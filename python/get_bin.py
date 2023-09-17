from shutil import which

python_bin = which("python3.10") or which("python3")

if __name__ == "__main__":
    print(python_bin)
