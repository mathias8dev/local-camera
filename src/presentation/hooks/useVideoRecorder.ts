"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type VideoRecordingResult,
  pickMimeType,
  MAX_DURATION_SECONDS,
} from "./recording-utils";

export type { VideoRecordingResult };

export function useVideoRecorder(stream: MediaStream | null) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const mountedRef = useRef(true);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const resolveStopRef = useRef<((result: VideoRecordingResult) => void) | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (maxDurationTimerRef.current) clearTimeout(maxDurationTimerRef.current);
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const startRecording = useCallback(async () => {
    if (!stream || isRecording) return;
    setError(null);

    const mimeType = pickMimeType();
    if (!mimeType) {
      setError("Aucun format vidéo supporté par ce navigateur.");
      return;
    }

    const combinedStream = new MediaStream(stream.getVideoTracks());

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = audioStream;
      for (const track of audioStream.getAudioTracks()) {
        combinedStream.addTrack(track);
      }
    } catch {
      audioStreamRef.current = null;
    }

    chunksRef.current = [];
    const recorder = new MediaRecorder(combinedStream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onerror = () => {
      if (mountedRef.current) {
        setError("Erreur pendant l'enregistrement.");
        setIsRecording(false);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    recorder.onstop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
      }

      const blob = new Blob(chunksRef.current, { type: mimeType });
      const duration = (Date.now() - startTimeRef.current) / 1000;

      const videoTrack = stream?.getVideoTracks()[0];
      const settings = videoTrack?.getSettings();
      const width = settings?.width ?? 0;
      const height = settings?.height ?? 0;

      if (mountedRef.current) {
        setIsRecording(false);
        setElapsed(0);
      }

      resolveStopRef.current?.({ blob, duration, width, height, mimeType });
      resolveStopRef.current = null;
    };

    recorderRef.current = recorder;
    startTimeRef.current = Date.now();
    recorder.start(1000);

    setIsRecording(true);
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    maxDurationTimerRef.current = setTimeout(() => {
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
    }, MAX_DURATION_SECONDS * 1000);
  }, [stream, isRecording]);

  const stopRecording = useCallback((): Promise<VideoRecordingResult> => {
    return new Promise((resolve, reject) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state !== "recording") {
        reject(new Error("Not recording"));
        return;
      }
      resolveStopRef.current = resolve;
      recorder.stop();
    });
  }, []);

  return { isRecording, elapsed, startRecording, stopRecording, error };
}
