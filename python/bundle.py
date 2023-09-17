import os
import platform
import shutil
from pathlib import Path

import PyInstaller.__main__

is_windows = os.name == "nt"
is_linux = not is_windows and os.uname().sysname == "Linux"
is_mac = not is_windows and platform.system() == "Darwin"
print("Running PyInstaller")

hidden_import = [
    "--hidden-import",
    "app",
]
to_collect = [
    "--collect-all",
    "fairseq",
    "--collect-all",
    "torchcrepe",
    "--collect-all",
    "torchaudio",
    "--collect-all",
    "torch",
    "--collect-all",
    "onnxruntime",
    "--collect-all",
    "onnxruntime-gpu",
]

suffix = []
name_suffix = "mac"
if is_windows:
    name_suffix = "win"
elif is_linux:
    name_suffix = "linux"
name = f"packager-{name_suffix}"
args = ["server.py", "--noconfirm", "-n", name] + hidden_import + to_collect + suffix
print(f"Bundling with {' '.join(args)}")
PyInstaller.__main__.run(args)

print("PyInstaller finished")
print("Moving binary")
# find a file starting with packager in dist dir
for file in os.listdir("dist"):
    if file.startswith(name):
        # rename it to server
        new_name = file.replace(name, "server")
        dest = os.path.join("dist", new_name)
        if os.path.exists(dest):
            shutil.rmtree(dest)
        os.rename(os.path.join("dist", file), dest)


if is_linux or is_mac:
    # we want to symlink all the files in torch/lib into the root
    dir_path = Path("dist") / "server" / "torch" / "lib"

    if dir_path.exists():
        for file in dir_path.iterdir():
            dest = Path("dist") / "server" / file.name

            # Remove the destination if it already exists
            if dest.exists():
                if dest.is_dir() and not dest.is_symlink():
                    dest.rmdir()
                else:
                    dest.unlink()

            # Create the symlink
            relative_path = file.relative_to(dest.parent)
            dest.symlink_to(relative_path)


def pretty_print_bytes(bytes, precision=2):
    """Return a human-readable string representation of a byte size."""
    abbrevs = (
        (1 << 50, "PB"),
        (1 << 40, "TB"),
        (1 << 30, "GB"),
        (1 << 20, "MB"),
        (1 << 10, "kB"),
        (1, "bytes"),
    )
    if bytes == 1:
        return "1 byte"
    for factor, suffix in abbrevs:
        if bytes >= factor:
            break
    return f"{bytes / factor:.{precision}f} {suffix}"


# if exists print filesize of server.exe
server_path = ""
if is_windows:
    server_path = os.path.join("dist", "server", f"{name}.exe")
else:
    server_path = os.path.join("dist", "server", name)
if os.path.exists(server_path):
    file_stats = os.stat(server_path)
    print(f"Filesize of server.exe: {pretty_print_bytes(file_stats.st_size)} bytes")
