import type { ReactElement } from "react";
import React, { useState, useEffect, Suspense } from "react";
import type { Props } from "./interfaces";
import useAudioRecorder from "../hooks/useAudioRecorder";
import { LiveAudioVisualizer } from "react-audio-visualize";

import micSVG from "../icons/mic.svg";
import pauseSVG from "../icons/pause.svg";
import resumeSVG from "../icons/play.svg";
import saveSVG from "../icons/save.svg";
import discardSVG from "../icons/stop.svg";
import "../styles/audio-recorder.css";
import Typography from "@mui/material/Typography";
import { Box } from "@mui/material";

/**
 * Usage: https://github.com/samhirtarif/react-audio-recorder#audiorecorder-component
 *
 *
 * @prop `onRecordingComplete` Method that gets called when save recording option is clicked
 * @prop `recorderControls` Externally initilize hook and pass the returned object to this param, this gives your control over the component from outside the component.
 * https://github.com/samhirtarif/react-audio-recorder#combine-the-useaudiorecorder-hook-and-the-audiorecorder-component
 * @prop `audioTrackConstraints`: Takes a {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings#instance_properties_of_audio_tracks subset} of `MediaTrackConstraints` that apply to the audio track
 * @prop `onNotAllowedOrFound`: A method that gets called when the getUserMedia promise is rejected. It receives the DOMException as its input.
 * @prop `downloadOnSavePress` If set to `true` the file gets downloaded when save recording is pressed. Defaults to `false`
 * @prop `downloadFileExtension` File extension for the audio filed that gets downloaded. Defaults to `mp3`. Allowed values are `mp3`, `wav` and `webm`
 * @prop `showVisualizer` Displays a waveform visualization for the audio when set to `true`. Defaults to `false`
 * @prop `classes` Is an object with attributes representing classes for different parts of the component
 */
const AudioRecorder: (props: Props) => ReactElement = ({
  onRecordingComplete,
  onNotAllowedOrFound,
  audioTrackConstraints,
  mediaRecorderOptions,
}: Props) => {
  const {
    startRecording,
    stopRecording,
    togglePauseResume,
    recordingBlob,
    isRecording,
    isPaused,
    recordingTime,
    mediaRecorder,
  } = useAudioRecorder(audioTrackConstraints, onNotAllowedOrFound, mediaRecorderOptions);

  const [shouldSave, setShouldSave] = useState(false);

  const stopAudioRecorder = (save: boolean = true) => {
    setShouldSave(save);
    stopRecording();
  };

  useEffect(() => {
    if (shouldSave && recordingBlob != null && onRecordingComplete) {
      onRecordingComplete(recordingBlob);
    }
  }, [onRecordingComplete, recordingBlob, shouldSave]);

  return (
    <Box
      sx={{
        display: "flex",
        backgroundColor: "#3c3c3c",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: "8px",
        width: "100%",
        borderRadius: "12px",
        minHeight: 80,
      }}
    >
      <div className={`audio-recorder ${isRecording ? "recording" : ""}`} data-testid="audio_recorder">
        <img
          alt={"mic"}
          src={isRecording ? saveSVG : micSVG}
          className={`audio-recorder-mic`}
          onClick={isRecording ? () => stopAudioRecorder() : startRecording}
          data-testid="ar_mic"
          title={isRecording ? "Save recording" : "Start recording"}
        />
        <span className={`audio-recorder-timer ${!isRecording ? "display-none" : ""}`} data-testid="ar_timer">
          {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
        </span>
        <span className={`audio-recorder-visualizer ${!isRecording ? "display-none" : ""}`}>
          {mediaRecorder && (
            <Suspense fallback={<></>}>
              <LiveAudioVisualizer
                mediaRecorder={mediaRecorder}
                barWidth={2}
                gap={2}
                width={120}
                height={30}
                fftSize={512}
                maxDecibels={-10}
                minDecibels={-80}
                smoothingTimeConstant={0.4}
              />
            </Suspense>
          )}
        </span>
        <img
          alt={"pause or resume"}
          src={isPaused ? resumeSVG : pauseSVG}
          className={`audio-recorder-options ${!isRecording ? "display-none" : ""}`}
          onClick={togglePauseResume}
          title={isPaused ? "Resume recording" : "Pause recording"}
          data-testid="ar_pause"
        />
        <img
          src={discardSVG}
          alt={"discard"}
          className={`audio-recorder-options ${!isRecording ? "display-none" : ""}`}
          onClick={() => stopAudioRecorder(false)}
          title="Discard Recording"
          data-testid="ar_cancel"
        />
      </div>
      <Typography
        onClick={isRecording ? () => stopAudioRecorder() : startRecording}
        sx={{ cursor: "pointer" }}
        variant={"body2"}
      >
        Record your own
      </Typography>
    </Box>
  );
};

export default AudioRecorder;
