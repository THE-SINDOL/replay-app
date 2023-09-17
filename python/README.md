# Audio Data Processing

This repository contains a set of Python scripts to help process and organize audio data for training Diffusion-SVC
models.

# Dependencies

Before you start, make sure you have the following dependencies installed:

- Python 3.6 or higher
- PyDub: `pip install pydub`
- tqdm: `pip install tqdm`
- ffprobe or avprobe: Install FFmpeg from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)

# Data Organization

Source data for Artists should be organized as follows:

- Place a directory for each artist under the `data` directory.
- The directory name should be in the form `kanye_west`
- Under the artist directory, place a directory for each album.
- Hoenstly the format doesn't matter. The scripts will recursively search for the given file type under each artist
  directory. No need to clean up.

# Scripts

1. `calculate_minutes.py`: This script helps to calculate the total number of audio files duration of all FLAC files in
   a given directory. This is useful to check if we have enough data to train a model, as well as seeing how many
   credits we need to stem the music with the LalaLAI API.

## Script Arguments

### --artist

**Type**: String  
**Required**: Yes  
**Description**: Path to the artist's directory that you want to process.

**Example usage**: `--artist ./my_artist_directory`

### --file_type

**Type**: String  
**Default**: flac  
**Description**: File type of the audio files in the artist's directory.

**Example usage**: `--file_type mp3`

2. `organize_files.py`: This script helps to organize input files by copying them into a new directory structure. It
   names the files as "{song_name}.mp3", without including the track number, and reduces file size by converting to MP3
   format.

## Script Arguments

### --artist

**Type**: String  
**Required**: Yes  
**Description**: Path to the artist's directory that you want to process.

**Example usage**: `--artist ./my_artist_directory`

### --file_type

**Type**: String  
**Default**: flac  
**Description**: File type of the audio files in the artist's directory.

**Example usage**: `--file_type mp3`

3. `batch_audio.py`: This script helps you batch your audio files into a specified number of subdirectories for parallel
   processing.

## Script Arguments

### --artist

**Type**: String  
**Required**: Yes  
**Description**: Path to the artist's directory that you want to process.

**Example usage**: `--artist ./my_artist_directory`

### --level

**Type**: Integer  
**Default**: 5  
**Description**: Level of parallelization (i.e., the number of subdirectories to create).

**Example usage**: `--level 10`

4. `stem_with_lala.py`: This script helps to stem the music with the LalaLAI API. It will take a while (~1-2 minutes per
   song), and write the instrumental and vocal tracks to the output directory.

## Script Arguments

### --license

**Type**: String  
**Required**: Yes  
**Description**: Your license key for the Lalalai API.

**Example usage**: `--license YOUR_LICENSE_KEY`

### --input

**Type**: String  
**Required**: Yes  
**Description**: Path to the input directory or a file that you want to process.

**Example usage**: `--input ./my_music_directory`

### --output

**Type**: String  
**Default**: Current Directory  
**Description**: Path to the directory where you want to save the output files.

**Example usage**: `--output ./my_output_directory`

### --stem

**Type**: String  
**Default**: vocals  
**Choices**: vocals, drum, bass, piano, electric_guitar, acoustic_guitar, synthesizer, voice, strings, wind  
**Description**: The stem option specifies the type of audio track to be isolated from the original audio file. Note: "
voice", "strings", and "wind" stems are not supported by the Cassiopeia splitter.

**Example usage**: `--stem piano`

### --filter

**Type**: Integer  
**Default**: 1  
**Choices**: 0 (mild), 1 (normal), 2 (aggressive)  
**Description**: The filter level specifies how aggressive the splitting process should be.

**Example usage**: `--filter 2`

### --splitter

**Type**: String  
**Default**: phoenix  
**Choices**: phoenix, cassiopeia  
**Description**: The type of neural network used to split the audio.

**Example usage**: `--splitter cassiopeia`

5. `process_audio_data.py`: This script helps to process the audio data by grabbing only the vocal files from a given
   artist's post-stemming directory, downsample them, split them into 15s chunks, and finally, output them to a new
   directory with a train-test split.

## Script Arguments

## --artist

**Type**: String
**Required**: Yes
**Description**: Name of the artist to process.

**Example usage**: `--artist 'Adele'`

# Basic Workflow

1. Use `check_minutes.py` to check the total duration of the FLAC files. Ensure the LalaLAI API has enough credits to
   stem the music based on the total duration.
2. Organize, downsample, and convert the input files with `organize_files.py`.
3. [Optional] If you have a lot of data, run `batch_audio.py`. This will split the files into a given number of
   subdirectories, with which you can run the Lala splitter in parallel to speed up processing time.
4. Stem your music with the LalaLAI API by running `stem_with_lala.py`. This will take a while (~1-2 minutes per song),
   and write the instrumental and vocal tracks to the output directory.
5. Finally, run `process_audio_data.py` to process the audio data. This will downsample the audio files, split them into
   15s chunks, and output them to a new directory with a train-test split. This directory can be used to train a
   Diffusion-SVC model directly.
