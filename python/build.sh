set -e

python_path=$(python get_bin.py)
echo "Installing deps"
$python_path setup.py
echo "Building"
$python_path bundle.py
echo "Done"
