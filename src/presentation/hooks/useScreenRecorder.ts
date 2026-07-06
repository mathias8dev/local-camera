
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type VideoRecordingResult,
  pickMimeType,
} from "./recording-utils";

export function useScreenRecorder() {
  const [isSupported] = useState(
    () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia,
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micEnabled, setMicEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoRecordingResult | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const pausedAccumRef = useRef(0);
  const pauseStartRef = useRef(0);
  const isPausedRef = useRef(false);
  const mountedRef = useRef(true);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef("");
  const stopFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalizedRef = useRef(false);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (stopFallbackRef.current) clearTimeout(stopFallbackRef.current);
      if (recorderRef.current?.state === "recording" || recorderRef.current?.state === "paused") {
        recorderRef.current.stop();
      }
      displayStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearStopFallback = useCallback(() => {
    if (stopFallbackRef.current) {
      clearTimeout(stopFallbackRef.current);
      stopFallbackRef.current = null;
    }
  }, []);

  const stopStreams = useCallback(() => {
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((t) => t.stop());
      displayStreamRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
  }, []);

  const finalizeRecording = useCallback(() => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;

    clearTimers();
    clearStopFallback();

    const mimeType = mimeTypeRef.current;
    const blob = new Blob(chunksRef.current, { type: mimeType });
    const totalPaused = isPausedRef.current
      ? pausedAccumRef.current + (Date.now() - pauseStartRef.current)
      : pausedAccumRef.current;
    const duration = (Date.now() - startTimeRef.current - totalPaused) / 1000;

    const { width, height } = dimensionsRef.current;

    stopStreams();
    recorderRef.current = null;

    if (mountedRef.current) {
      setIsRecording(false);
      setIsPaused(false);
      isPausedRef.current = false;
      setElapsed(0);
      setResult({ blob, duration, width, height, mimeType });
    }
  }, [clearStopFallback, clearTimers, stopStreams]);

  const startRecording = useCallback(async () => {
    if (isRecording || !isSupported) return;
    setError(null);
    setResult(null);

    let displayStream: MediaStream;
    try {
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") return;
      if (mountedRef.current) setError("Impossible de démarrer le partage d'écran.");
      return;
    }
    displayStreamRef.current = displayStream;
    const settings = displayStream.getVideoTracks()[0]?.getSettings();
    dimensionsRef.current = {
      width: settings?.width ?? 0,
      height: settings?.height ?? 0,
    };

    const mimeType = pickMimeType();
    if (!mimeType) {
      stopStreams();
      if (mountedRef.current) setError("Aucun format vidéo supporté par ce navigateur.");
      return;
    }
    mimeTypeRef.current = mimeType;

    const combinedStream = new MediaStream(displayStream.getTracks());

    if (micEnabled) {
      try {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = mic;
        for (const track of mic.getAudioTracks()) {
          combinedStream.addTrack(track);
        }
      } catch {
        micStreamRef.current = null;
      }
    }

    chunksRef.current = [];
    pausedAccumRef.current = 0;
    isPausedRef.current = false;
    finalizedRef.current = false;
    const recorder = new MediaRecorder(combinedStream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onerror = () => {
      if (mountedRef.current) {
        setError("Erreur pendant l'enregistrement.");
        setIsRecording(false);
        setIsPaused(false);
        isPausedRef.current = false;
      }
      clearTimers();
      stopStreams();
    };

    recorder.onstop = finalizeRecording;

    const videoTrack = displayStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.addEventListener("ended", () => {
        if (recorderRef.current?.state === "recording" || recorderRef.current?.state === "paused") {
          recorderRef.current.stop();
        }
      });
    }

    recorderRef.current = recorder;
    startTimeRef.current = Date.now();
    recorder.start(1000);

    setIsRecording(true);
    setIsPaused(false);
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        const totalPaused = pausedAccumRef.current;
        setElapsed(Math.floor((Date.now() - startTimeRef.current - totalPaused) / 1000));
      }
    }, 1000);

  }, [isRecording, isSupported, micEnabled, clearTimers, finalizeRecording, stopStreams]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) {
      if (isRecording) finalizeRecording();
      return;
    }
    if (recorder.state !== "recording" && recorder.state !== "paused") return;

    if (recorder.state === "paused") {
      pausedAccumRef.current += Date.now() - pauseStartRef.current;
      isPausedRef.current = false;
      try {
        recorder.resume();
      } catch {
        // The fallback below will still finalize the recording from collected chunks.
      }
    }

    try {
      recorder.requestData();
    } catch {
      // Some browsers do not support requestData in every recorder state.
    }

    stopFallbackRef.current = setTimeout(() => {
      if (recorderRef.current) finalizeRecording();
    }, 1500);

    try {
      recorder.stop();
    } catch {
      finalizeRecording();
    }
  }, [finalizeRecording, isRecording]);

  const togglePause = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;

    if (recorder.state === "recording") {
      recorder.pause();
      pauseStartRef.current = Date.now();
      isPausedRef.current = true;
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else if (recorder.state === "paused") {
      pausedAccumRef.current += Date.now() - pauseStartRef.current;
      isPausedRef.current = false;
      recorder.resume();
      setIsPaused(false);
      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          const totalPaused = pausedAccumRef.current;
          setElapsed(Math.floor((Date.now() - startTimeRef.current - totalPaused) / 1000));
        }
      }, 1000);
    }
  }, []);

  const toggleMic = useCallback(async () => {
    if (isRecording) return;
    setMicEnabled((prev) => !prev);
  }, [isRecording]);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    isSupported,
    isRecording,
    isPaused,
    elapsed,
    micEnabled,
    result,
    startRecording,
    stopRecording,
    togglePause,
    toggleMic,
    clearResult,
    error,
  };
}
