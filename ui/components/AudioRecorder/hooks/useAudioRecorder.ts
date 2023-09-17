import { useState, useCallback } from "react";

export interface RecorderControls {
  startRecording: () => void;
  stopRecording: () => void;
  togglePauseResume: () => void;
  recordingBlob?: Blob;
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  mediaRecorder?: MediaRecorder;
}

export type MediaAudioTrackConstraints = Pick<
  MediaTrackConstraints,
  | "deviceId"
  | "groupId"
  | "autoGainControl"
  | "channelCount"
  | "echoCancellation"
  | "noiseSuppression"
  | "sampleRate"
  | "sampleSize"
>;

const useAudioRecorder = (
  audioTrackConstraints?: MediaAudioTrackConstraints,
  onNotAllowedOrFound?: (exception: DOMException) => any,
  mediaRecorderOptions?: MediaRecorderOptions,
): RecorderControls => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>();
  const [timerInterval, setTimerInterval] = useState<number>();
  const [recordingBlob, setRecordingBlob] = useState<Blob>();

  const _startTimer: () => void = useCallback(() => {
    const interval = window.setInterval(() => {
      setRecordingTime((time) => time + 1);
    }, 1000);
    setTimerInterval(interval);
  }, [setRecordingTime, setTimerInterval]);

  const _stopTimer: () => void = useCallback(() => {
    timerInterval != null && clearInterval(timerInterval);
    setTimerInterval(undefined);
  }, [timerInterval, setTimerInterval]);

  /**
   * Calling this method would result in the recording to start. Sets `isRecording` to true
   */
  const startRecording = useCallback(() => {
    if (timerInterval != null) {
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: audioTrackConstraints ?? true })
      .then((stream) => {
        setIsRecording(true);
        const recorder: MediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
        setMediaRecorder(recorder);
        recorder.start();
        _startTimer();

        recorder.addEventListener("dataavailable", (event) => {
          setRecordingBlob(event.data);
          recorder.stream.getTracks().forEach((t) => t.stop());
          setMediaRecorder(undefined);
        });
      })
      .catch((err: DOMException) => {
        console.log(err.name, err.message, err.cause);
        onNotAllowedOrFound?.(err);
      });
  }, [timerInterval, audioTrackConstraints, mediaRecorderOptions, _startTimer, onNotAllowedOrFound]);

  /**
   * Calling this method results in a recording in progress being stopped and the resulting audio being present in `recordingBlob`. Sets `isRecording` to false
   */
  const stopRecording: () => void = useCallback(() => {
    mediaRecorder?.stop();
    _stopTimer();
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
  }, [mediaRecorder, setRecordingTime, setIsRecording, setIsPaused, _stopTimer]);

  /**
   * Calling this method would pause the recording if it is currently running or resume if it is paused. Toggles the value `isPaused`
   */
  const togglePauseResume: () => void = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      mediaRecorder?.resume();
      _startTimer();
    } else {
      setIsPaused(true);
      _stopTimer();
      mediaRecorder?.pause();
    }
  }, [isPaused, mediaRecorder, _startTimer, _stopTimer]);

  return {
    startRecording,
    stopRecording,
    togglePauseResume,
    recordingBlob,
    isRecording,
    isPaused,
    recordingTime,
    mediaRecorder,
  };
};

export default useAudioRecorder;
