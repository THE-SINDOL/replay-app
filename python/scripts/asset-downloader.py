import json
import os
from urllib.parse import urlparse

from mega import Mega
import gdown

rvc_path = os.path.join(os.path.dirname(__file__), "../scripts/rvc-models-to-parse.json")
rvcs = json.load(open(rvc_path))
mega = Mega()
m = mega.login()
models_dir = os.path.join(os.path.dirname(__file__), "./models")
if not os.path.exists(models_dir):
    os.makedirs(models_dir)

for rvc in rvcs:
    safe_name = "".join(x for x in rvc["title"] if x.isalnum())
    if rvc["url"]:
        # parse url
        url = rvc["url"]
        o = urlparse(url)
        output = os.path.join(models_dir, f"{safe_name}.zip")
        if o.netloc == "mega.nz":
            m.download_url(url, output=output)
        elif o.netloc == "drive.google.com":
            gdown.download(url, output, quiet=False)
