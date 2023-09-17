set -e

python_path=$(python get_bin.py)
echo "Installing boto3"
$python_path -m pip install boto3
echo "Deploying"
$python_path deploy.py
echo "Done"
