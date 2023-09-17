import os
import platform
import subprocess
import sysconfig
from shutil import which

LIB_PATHS = sysconfig.get_paths()["purelib"]

is_github = os.environ.get("GITHUB_TOKEN", False)

is_windows = os.name == "nt"
is_mac = platform.system() == "Darwin"
is_mac_x64 = is_mac and platform.machine() == "x86_64"


def install_dependencies():
    print("Installing system dependencies...")

    if not is_github:
        commands = []
        if platform.system() == "Darwin":  # Mac
            # Check if Homebrew is installed, and if not, install it
            brew_check_command = ["brew", "--version"]
            brew_installed = (
                subprocess.run(brew_check_command, capture_output=True).returncode == 0
            )

            if not brew_installed:
                install_brew_command = [
                    "/bin/bash",
                    "-c",
                    "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)",
                ]
                subprocess.run(install_brew_command)

            commands = [
                "HOMEBREW_NO_AUTO_UPDATE=1 brew install ffmpeg --quiet",
            ]
        elif platform.system() == "Linux":
            commands = [
                "sudo apt-get update",
                "sudo apt-get install -y ffmpeg",
            ]
        else:
            print("Unsupported platform. Cannot install system dependencies.")

        for command in commands:
            process = subprocess.Popen(
                command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
            )
            process.wait()
            output, error = process.communicate()
            if error:
                print(
                    f"Error in installing system dependencies: {error.decode().strip()}"
                )
                return
    python_bin = which("python3.10") or which("python3") or which("python")
    pip_bin = f"{python_bin} -m pip"
    print(f"Using python binary: {python_bin}")
    print(f"Using pip binary: {pip_bin}")
    # Upgrade pip
    print("Upgrading pip...")
    os.system(f"{python_bin} -m pip install --upgrade pip")
    print("Pip upgraded.")

    # Upgrade setuptools and wheel
    print("Upgrading setuptools and wheel...")
    os.system(f"{pip_bin} install --upgrade setuptools wheel")
    print("Setuptools and wheel upgraded.")

    # Install Python packages
    print("Installing Python packages...")
    suffix = ""
    if not is_mac:
        print(f"Setting index url")
        suffix = "--index-url https://download.pytorch.org/whl/cu118 --extra-index-url https://pypi.org/simple"
    os.system(f"{pip_bin} install -r requirements.txt {suffix}")
    onnx = "onnxruntime"
    try:
        os.system(f"{pip_bin} uninstall -y {onnx}")
    except:
        pass

    if not is_mac:
        onnx = "onnxruntime-gpu"
    else:
        if is_mac_x64:
            onnx = "onnxruntime-coreml"
        else:
            onnx = "onnxruntime-silicon"
    os.system(f"{pip_bin} install {onnx}")
    print("Python packages installed.")

    print("Fixing fairseq")
    fairseq = os.path.join(LIB_PATHS, "fairseq", "dataclass", "configs.py")
    # if file exists, parse and replace
    if os.path.exists(fairseq):
        f = open(fairseq, "r")
        lines = f.read()
        f.close()
        # replace metadata={help: with metadata={"help":
        lines = lines.replace("metadata={help:", 'metadata={"help":')
        # save updated text
        w = open(fairseq, "w")
        w.write(lines)
        w.close()
        print("Fairseq fixed.")
    else:
        print("Fairseq not found. Skipping fix.")


def main():
    install_dependencies()
    print("\n--------------------------------------------------------------")
    print("Setup Successful!")
    print("All packages and dependencies have been installed correctly.")
    print("--------------------------------------------------------------\n")
    print("You're now ready to run the app!")
    print("Use the following command to start the application from /replay-app")
    print("\n\t yarn dev\n")


if __name__ == "__main__":
    main()
