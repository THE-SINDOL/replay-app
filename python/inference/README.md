# Local Inference

## Step 1: Install Dependencies and RVC Repo

`python setup.py`

## Step 2: Add Models:

- Just dump models into the `/models` directory. No need to format

## Step 3: Run inference

`python infer.py <artist_name> <path_to_song>`

_Note_ For Silicon support, you'll need to set MPS compatibility for Torch:

`export PYTORCH_ENABLE_MPS_FALLBACK=1 python infer.py <artist_name> <path_to_song>`

<div align="left">

<h1>Mangio-RVC-Fork for CLI Inference </h1>
A fork of the RVC framework based on VITS with top1 retrieval. In general, this fork provides a CLI interface in addition. And also gives you more f0 methods to use, as well as a personlized 'hybrid' f0 estimation method using nanmedian. <br><br>
<b>

### Todo: Get rid of all the junk and make this inference-only.

### Todo: Change cli-gui for direct CLI calling

# About this fork's f0 Hybrid feature on inference

Right now, the hybrid f0 method is only available on CLI, not GUI yet. But basically during inference, we can specify an
array of f0 methods, E.G ["pm", "harvest", "crepe"], get f0 calculations of all of them and 'combine' them with
nanmedian to get a hybrid f0 signal to get the 'best of all worlds' of the f0 methods provided.

Here's how we would infer with the hybrid f0 method in cli:

```bash
MyModel.pth saudio/Source.wav Output.wav logs/mi-test/added.index 0 -2 hybrid[pm+crepe] 128 3 0 1 0.95 0.33
```

Notice that the method is "hybrid[pm+crepe]" instead of a singular method like "harvest".

```bash
hybrid[pm+harvest+crepe]
# the crepe calculation will be at the 'end' of the computational stack.
# the parselmouth calculation will be at the 'start' of the computational stack.
# the 'hybrid' method will calculate the nanmedian of both pm, harvest and crepe
```

Many f0 methods may be used. But are to be split with a delimiter of the '+' character. Keep in mind that inference will
take much longer as we are calculating f0 X more times.

# About the original repo's crepe method, compared to this forks crepe method (mangio-crepe)

The original repos crepe f0 computation method is slightly different to mine. Its arguable that in some areas, my crepe
implementation sounds more stable in some parts. However, the orginal repo's crepe implementation gets rid of noise and
artifacts much better. In this fork, my own crepe implementation (mangio-crepe) uses a customizable crepe_hop_length
feature on both the GUI and the CLI which the original crepe doesnt have. Please let it be known, that each
implementation sounds slightly different, and there isn't a clear "better" or "worse". It all depends on the context!

If one must be chosen, I highly recommend using the original crepe implementation (not this fork's) as the developers of
RVC have more control on fixing issues than I have.

# About this fork's f0 training additional features.

## Crepe f0 feature extraction

Crepe training is still incredibly instable and there's been report of a memory leak. This will be fixed in the future,
however it works quite well on paperspace machines. Please note that crepe training adds a little bit of difference
against a harvest trained model. Crepe sounds clearer on some parts, but sounds more robotic on some parts too. Both I
would say are equally good to train with, but I still think crepe on INFERENCE is not only quicker, but more pitch
stable (especially with vocal layers). Right now, its quite stable to train with a harvest model and infer it with
crepe. If you are training with crepe however (f0 feature extraction), please make sure your datasets are as dry as
possible to reduce artifacts and unwanted harmonics as I assume the crepe pitch estimation latches on to reverb more.

## Hybrid f0 feature extraction

Only for CLI (not implemented in GUI yet). Basically the same as usage described in this readme's f0 hybrid on inference
section. Instead of stating "harvest" into your arguments in the f0 feature extraction page, you would use "
hybrid[harvest+dio+pm+crepe]" for example. This f0 nanmedian hybrid method will take very long during feature
extraction. Please, if you're willing to use hybrid f0, be patient.

## If you get CUDA issues with crepe training, or pm and harvest etc.

This is due to the number of processes (n_p) being too high. Make sure to cut the number of threads down. Please lower
the value of the "Number of CPU Threads to use" slider on the feature extraction GUI.

## Windows/MacOS

**Notice**: `faiss 1.7.2` will raise Segmentation Fault: 11 under `MacOS`, please use `pip install faiss-cpu==1.7.0` if
you use pip to install it manually. `Swig` can be installed via `brew` under `MacOS`

```bash
brew install swig
```

Install requirements:

```bash
pip install -r requirements.txt
```

If you're experiencing httpx invalid port errors please insteall httpx==0.23.0

# Preparation of other Pre-models ⬇️

## Local Users

RVC requires other pre-models to infer.
You need to download them from our [Huggingface space](https://huggingface.co/lj1995/VoiceConversionWebUI/tree/main/).

Here's a list of Pre-models and other files that RVC needs:

```bash
hubert_base.pt

./pretrained

./uvr5_weights


If you want to test the v2 version model (the v2 version model changes the feature from the 256-dimensional input of 9-layer hubert+final_proj to the 768-dimensional input of 12-layer hubert, and adds 3 cycle discriminators), an additional download is required

./pretrained_v2
```

# Inference with CLI

Simply call `infer.py` as follows:

```
python infer.py <model_path> <input_audio> <output_audio> <index_path> 1 0 harvest 160 3 0 1 0.78 0.33
```

```

```
