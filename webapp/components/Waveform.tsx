import React, { useCallback, useEffect, useRef, useState } from "react";
import type { WaveSurferOptions } from "wavesurfer.js";
import WaveSurfer from "wavesurfer.js";

const DEFAULT_WAVE_SIZE = 75;

const formWaveSurferOptions = (ref): WaveSurferOptions => ({
  container: ref,
  waveColor: "#eee",
  progressColor: "#1B3A4B",
  barWidth: 4,
  barRadius: 40,
  cursorWidth: 0,
  height: 75,
  // If true, normalize by the maximum peak instead of 1.0.
  normalize: true,
  hideScrollbar: true,
  sampleRate: 3000,
  autoplay: false,
});

const Waveform = ({ shareId, waveSize }: { shareId: string; waveSize?: number }) => {
  const waveformRef = useRef(null);
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const [playing, setPlay] = useState(false);

  const pause = useCallback(() => {
    setPlay(false);
  }, []);
  const play = useCallback(() => {
    setPlay(true);
  }, []);

  const handlePlayPause = () => {
    setPlay((wasPlaying) => {
      return !wasPlaying;
    });
  };

  const currentUrl = wavesurfer?.options?.url;
  useEffect(() => {
    const url = `https://tracks.replay-music.xyz/${shareId}.mp3`;
    if (shareId && currentUrl !== url) {
      // create new WaveSurfer instance
      const options = formWaveSurferOptions(waveformRef.current);

      const ws = WaveSurfer.create({
        ...options,
        height: waveSize || DEFAULT_WAVE_SIZE,
      });

      setWavesurfer(ws);
      ws.load(url);

      return () => {
        // Remove the 'finish' event handler before destroying the WaveSurfer instance
        if (ws) {
          ws.destroy();
        }
      };
    }
  }, [shareId, waveSize, currentUrl]);

  useEffect(() => {
    if (!wavesurfer) {
      return;
    }
    // Attach the 'finish' event handler
    wavesurfer.on("finish", pause);
    wavesurfer.on("pause", pause);
    wavesurfer.on("play", play);
    return () => {
      wavesurfer.un("finish", pause);
      wavesurfer.un("pause", pause);
      wavesurfer.un("play", play);
    };
  }, [pause, play, wavesurfer]);

  useEffect(() => {
    if (!wavesurfer) {
      return;
    }
    if (playing && !wavesurfer.isPlaying()) {
      wavesurfer.play();
    } else if (!playing && wavesurfer.isPlaying()) {
      wavesurfer.pause();
    }
  }, [wavesurfer, playing]);

  if (!shareId) {
    return null;
  }

  return (
    <div className="inline-flex items-center flex-col gap-2 w-full mt-2">
      <div className="w-full flex-shrink-0" id="waveform" ref={waveformRef} />
      <div className="flex items-end w-full">
        <button className="text-[1.2em] font-[400] bg-[#eee] px-2 py-1 rounded-lg mr-4" onClick={handlePlayPause}>
          {!playing ? "Play" : "Pause"}
        </button>
        <div className="flex items-center ml-auto gap-1">
          Made with
          <h3 className="text-[1.3em] font-[700] tracking-[-.08em]">Replay</h3>
        </div>
      </div>
    </div>
  );
};
export default Waveform;
