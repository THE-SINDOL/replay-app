import json
import logging
import os
import platform
import hashlib
import traceback
import zipfile
from queue import Queue
from datetime import datetime
from pathlib import Path
from typing import List

import boto3
import shutil
from botocore.config import Config
from botocore.exceptions import ClientError

logging.basicConfig(format="%(asctime)s | %(levelname)s | %(message)s", level=logging.INFO, datefmt="%Y-%m-%d %H:%M:%S")
logger = logging.getLogger(__name__)
is_windows = os.name == "nt"
is_linux = not is_windows and os.uname().sysname == "Linux"
is_mac = not is_windows and platform.system() == "Darwin"

client_config = Config(
    max_pool_connections=50,
)

"""Upload a file to an S3 bucket."""
s3_client = boto3.client(
    service_name="s3",
    endpoint_url="https://149cda160fcd819be7a2c36788e4e415.r2.cloudflarestorage.com",
    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", None),
    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", None),
    config=client_config,
)


# here we generate hashes for all files in dist, and symlink them if they are the same, keeping the highest in the tree
def heuristic_hash(file_path):
    """Return a heuristic hash for the file."""
    file_size = os.path.getsize(file_path)

    with open(file_path, "rb") as f:
        if file_size < 4096:
            content = f.read()
        else:
            start = f.read(4096)
            f.seek(-4096, os.SEEK_END)
            end = f.read(4096)
            content = start + end

        return hashlib.md5(content + bytes(file_size)).hexdigest()


def full_hash(file_path):
    """Return the full MD5 hash for the file."""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def deduplicate_directory(directory_path):
    all_files = [
        f
        for f in Path(directory_path).rglob("*")
        if f.is_file() and not f.is_symlink() and "dist-info" not in str(f) and f.name != "__init__.py"
    ]
    heuristic_hashes = {}

    # Build heuristic hashes
    for file_path in all_files:
        h_hash = heuristic_hash(file_path)
        if h_hash in heuristic_hashes:
            heuristic_hashes[h_hash].append(file_path)
        else:
            heuristic_hashes[h_hash] = [file_path]
    file_size_saved = 0

    # Handle potential duplicates with full hashes
    for h_hash, potential_dups in heuristic_hashes.items():
        if len(potential_dups) <= 1:
            continue

        full_hashes = {}
        for file_path in potential_dups:
            f_hash = full_hash(file_path)
            if f_hash in full_hashes:
                full_hashes[f_hash].append(file_path)
            else:
                full_hashes[f_hash] = [file_path]

        # Create symlinks for true duplicates
        for f_hash, true_dups in full_hashes.items():
            true_dups.sort(key=lambda x: len(x.parts))
            target = true_dups[0]
            file_size = os.path.getsize(target)
            for to_symlink in true_dups[1:]:
                file_size_saved += file_size
                logger.info(f"Symlinking {to_symlink} to {target}")
                to_symlink.unlink()
                to_symlink.symlink_to(target, target_is_directory=False)

    logger.info(f"Saved {file_size_saved} bytes by deduplicating")


def zip_directory(directory_path, output_path):
    """Zip the directory to the specified output path."""
    shutil.make_archive(output_path, "zip", directory_path)


def zip_file(file: Path, directory_path: Path) -> Path:
    """Zip the directory to the specified output path."""
    output_path = file.with_suffix(".zip")
    with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.write(file, file.relative_to(directory_path))
        zf.testzip()
        zf.close()
    return output_path


def get_sha1(file_path):
    sha1_sum = hashlib.sha1()
    with open(file_path, "rb") as f:
        while True:
            data = f.read(65536)
            if not data:
                break
            sha1_sum.update(data)
    return sha1_sum.hexdigest()


def generate_manifest(directory_path):
    large_files = []
    small_files = []

    logger.info(f"Generating manifest for {directory_path}")
    all_files: List[Path] = [f for f in Path(directory_path).rglob("*") if f.is_file()]
    logger.info(f"Found {len(all_files)} files")
    symlinks = [f for f in all_files if f.is_symlink()]
    # Classify the files based on their size
    for file_path in all_files:
        if file_path.is_symlink():
            continue
        if os.path.getsize(file_path) >= 10 * 1024 * 1024:  # Larger than 10MB
            large_files.append(file_path)
        else:
            small_files.append(file_path)

    logger.info(f"Found {len(large_files)} large files, {len(small_files)} small files")
    # For large files: Zip, upload and update the manifest
    manifest = {}

    def upload_large_file(large_file_path):
        # Update the manifest
        file_sha1 = get_sha1(large_file_path)
        remote_path = f"{file_sha1}-{get_name_suffix()}.zip"
        obj_head = object_exists_in_s3(S3_BUCKET, remote_path)
        size = 0
        orig_size = os.path.getsize(large_file_path)
        if not obj_head:
            logger.info(f"Uploading {large_file_path} to S3")
            zip_name = zip_file(large_file_path, directory_path)
            size = os.path.getsize(zip_name)
            # Upload the zipped file if it doesn't exist
            upload_zip_to_s3(zip_name, remote_path)
        else:
            size = obj_head["ContentLength"]
            logger.info(f"Skipping upload of {large_file_path} because it already exists in S3")
        file_path_relative = str(large_file_path.relative_to(directory_path))
        manifest[file_path_relative] = {
            "sha1": file_sha1,
            "asset_name": remote_path,
            "zip_size": size,
            "file_size": orig_size,
            "path": file_path_relative,
        }

    for file_path in large_files:
        upload_large_file(file_path)

    logger.info(f"Uploaded {len(large_files)} large files")
    logger.info(f"Creating other.zip for {len(small_files)} small files")
    # Zip all small files into other.zip
    other_zip = directory_path / "other.zip"
    with zipfile.ZipFile(other_zip, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for file_path in small_files:
            zf.write(file_path, file_path.relative_to(directory_path))
        zf.testzip()
        zf.close()
    logger.info(f"Created other.zip with size {os.path.getsize(other_zip)}")
    sha1 = get_sha1(other_zip)
    remote_path = f"{sha1}-{get_name_suffix()}.zip"
    # Update the manifest for other.zip
    if not object_exists_in_s3(S3_BUCKET, remote_path):
        logger.info(f"Uploading other.zip to S3")
        # Upload the zipped file if it doesn't exist
        upload_zip_to_s3(other_zip, remote_path)
    else:
        logger.info(f"Skipping upload of other.zip because it already exists in S3")

    logger.info(f"Uploaded other.zip")

    manifest["other.zip"] = {
        "sha1": sha1,
        "asset_name": remote_path,
        "zip_size": os.path.getsize(other_zip),
        "file_count": len(small_files),
        "path": str(other_zip.relative_to(directory_path)),
    }

    return manifest, symlinks


def get_name_suffix():
    os_name = "windows" if is_windows else "mac" if is_mac else "linux"
    arch = "arm64" if platform.machine() == "arm64" else "x64"
    return f"{os_name}-{arch}"


def object_exists_in_s3(bucket, key):
    """Check if a specific object exists in an S3 bucket."""
    try:
        return s3_client.head_object(Bucket=bucket, Key=key)
    except ClientError as err:
        return False


def upload_zip_to_s3(file_path, object_name=None):
    if object_name is None:
        object_name = file_path.name

    with open(file_path, "rb") as f:
        s3_client.upload_fileobj(
            f,
            S3_BUCKET,
            object_name,
            ExtraArgs={
                "ContentType": "application/zip",
            },
        )


def upload_config(manifest, symlinks: List[Path]):
    latest_config = {
        "version": new_release_version,
        "manifest": manifest,
        "symlinks": [{"to": str(s.relative_to(DIRECTORY_PATH)), "from": str(s.readlink())} for s in symlinks],
    }
    dev_str = "-dev" if "development" in new_release_version else ""
    key = f"latest{dev_str}-{get_name_suffix()}.json"
    logger.info(f"Uploading latest config to {key}")
    dumped_config = json.dumps(latest_config, indent=4)
    logger.info(dumped_config)
    s3_client.put_object(
        Body=dumped_config,
        Bucket=S3_BUCKET,
        Key=key,
        ContentType="application/json",
    )
    # also upload it to sha-tagged
    git_sha = os.environ.get("GITHUB_SHA", None)
    if git_sha:
        git_key = f"{git_sha}-{get_name_suffix()}.json"
        logger.info(f"Uploading git-sha config to {git_key}")
        s3_client.put_object(
            Body=dumped_config,
            Bucket=S3_BUCKET,
            Key=git_key,
            ContentType="application/json",
        )

        version_key = f"{new_release_version}-{get_name_suffix()}.json"
        logger.info(f"Uploading version config to {version_key}")
        s3_client.put_object(
            Body=dumped_config,
            Bucket=S3_BUCKET,
            Key=version_key,
            ContentType="application/json",
        )


# timestamp in form of YYYYMMDDHHMMSS
timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
fallback = f"0.0.0-development-{timestamp}"
new_release_version = os.environ.get("NEW_RELEASE_VERSION", fallback) or fallback

S3_BUCKET = "replay-servers"
DIRECTORY_PATH = Path("dist/server")
zip_basename = f"dist/server-{new_release_version}-{get_name_suffix()}"
OUTPUT_PATH = Path(zip_basename)

if __name__ == "__main__":
    try:
        logger.info(f"Deploying server - {new_release_version}")
        # skip deduplication for now bc of bugs
        # logger.info("Deduplicating")
        # deduplicate_directory(DIRECTORY_PATH)
        logger.info("Generating manifest")
        manifest, symlinks = generate_manifest(DIRECTORY_PATH)
        logger.info("Writing config to S3")
        upload_config(manifest, symlinks)
        logger.info("Done")
    except Exception as e:
        logger.info(f"Error deploying: {e}")
        logger.info(traceback.format_exc())
        exit(1)
