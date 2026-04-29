"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraService, FacingMode } from "@/data/services/CameraService";
import { WebGLPostProcessor } from "@/data/services/webgl/WebGLPostProcessor";
import { IndexedDBPhotoRepository } from "@/data/repositories/IndexedDBPhotoRepository";
import { IndexedDBFileStorage } from "@/data/storage/IndexedDBFileStorage";
import { Photo } from "@/domain/entities/Photo";
import type { Resolution } from "@/domain/entities/Resolution";
import { exportCanvas, ExportFormat } from "@/data/services/ImageRenderer";

const cameraService = new CameraService();
const fileStorage = new IndexedDBFileStorage();
const photoRepository = new IndexedDBPhotoRepository(fileStorage);

interface CapturedData {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  mirrored: boolean;
}

export type TimerMode = 0 | 3 | 10;

export interface ZoomCapabilities {
  min: number;
  max: number;
  step: number;
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const postProcessorRef = useRef<WebGLPostProcessor | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [isReady, setIsReady] = useState(false);
  const [captured, setCaptured] = useState<CapturedData | null>(null);
  const [isMirrored, setIsMirrored] = useState(false);
  const [enhanceEnabled, setEnhanceEnabled] = useState(true);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [selectedResolution, setSelectedResolution] = useState<Resolution | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Feature 1: Grid overlay
  const [showGrid, setShowGrid] = useState(false);

  // Feature 2: Torch/flash
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  // Feature 3: Timer
  const [timerMode, setTimerMode] = useState<TimerMode>(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Feature 4: Pinch-to-zoom
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomCapabilities, setZoomCapabilities] = useState<ZoomCapabilities | null>(null);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomIndicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        setIsReady(false);
        setTorchEnabled(false);
        setTorchSupported(false);
        setZoomLevel(1);
        setZoomCapabilities(null);

        const stream = await cameraService.start(facingMode);
        if (!cancelled && videoRef.current) {
          videoRef.current.srcObject = stream;
          const res = cameraService.getResolutions();
          setResolutions(res);
          if (res.length > 0) setSelectedResolution(res[0]);

          // Check torch and zoom support
          const track = stream.getVideoTracks()[0];
          if (track) {
            const caps = track.getCapabilities() as MediaTrackCapabilities & {
              torch?: boolean;
              zoom?: { min: number; max: number; step: number };
            };

            if (caps.torch) {
              setTorchSupported(true);
            }

            if (caps.zoom) {
              setZoomCapabilities({
                min: caps.zoom.min,
                max: caps.zoom.max,
                step: caps.zoom.step,
              });
            }
          }
        }
      } catch {
        if (!cancelled) {
          setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        }
      }
    })();
    return () => {
      cancelled = true;
      postProcessorRef.current?.stopPreview();
      cameraService.stop();
    };
  }, [facingMode]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && videoRef.current) {
        videoRef.current.play().catch(() => {});
        if (postProcessorRef.current && videoRef.current) {
          postProcessorRef.current.startPreview(videoRef.current);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      postProcessorRef.current?.dispose();
    };
  }, []);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const onVideoReady = useCallback(() => {
    setIsReady(true);
    if (!canvasRef.current || !videoRef.current) return;
    if (!postProcessorRef.current) {
      postProcessorRef.current = new WebGLPostProcessor();
      postProcessorRef.current.setConfig({ enabled: enhanceEnabled });
      postProcessorRef.current.attach(canvasRef.current);
    }
    postProcessorRef.current.startPreview(videoRef.current);
  }, [enhanceEnabled]);

  const doCapture = useCallback(async () => {
    if (!videoRef.current) return;
    const { blob, width, height } = await cameraService.capture(
      videoRef.current,
      selectedResolution ?? undefined,
    );
    let enhanced = blob;
    if (postProcessorRef.current) {
      enhanced = await postProcessorRef.current.processBlob(blob, width, height);
    }
    setCaptured({
      blob: enhanced,
      previewUrl: URL.createObjectURL(enhanced),
      width,
      height,
      mirrored: isMirrored,
    });
  }, [isMirrored, selectedResolution]);

  const capture = useCallback(async () => {
    if (timerMode === 0) {
      await doCapture();
      return;
    }

    // Start countdown
    setCountdown(timerMode);
    let remaining = timerMode;

    countdownIntervalRef.current = setInterval(async () => {
      remaining -= 1;
      if (remaining <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(null);
        await doCapture();
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  }, [timerMode, doCapture]);

  const savePhoto = useCallback(
    async (name: string, format: ExportFormat = "image/jpeg", quality?: number) => {
      if (!captured) return;
      let blob = captured.blob;
      if (captured.mirrored) {
        blob = await CameraService.applyMirror(blob, captured.width, captured.height);
      }
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
      bitmap.close();
      blob = await exportCanvas(canvas, format, quality);
      const photo: Photo = {
        id: crypto.randomUUID(),
        name,
        width: captured.width,
        height: captured.height,
        createdAt: new Date(),
      };
      await photoRepository.save(photo, blob);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      const ext = format === "image/jpeg" ? "jpg" : format === "image/webp" ? "webp" : "png";
      link.download = `${name}.${ext}`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
      URL.revokeObjectURL(captured.previewUrl);
      setCaptured(null);
    },
    [captured],
  );

  const sendToEditor = useCallback(async (): Promise<string | null> => {
    if (!captured) return null;
    const id = crypto.randomUUID();
    let blob = captured.blob;
    if (captured.mirrored) {
      blob = await CameraService.applyMirror(blob, captured.width, captured.height);
    }
    await fileStorage.save(id, blob);
    URL.revokeObjectURL(captured.previewUrl);
    setCaptured(null);
    return id;
  }, [captured]);

  const retake = useCallback(() => {
    if (captured) URL.revokeObjectURL(captured.previewUrl);
    setCaptured(null);
  }, [captured]);

  const toggleMirror = useCallback(() => setIsMirrored((prev) => !prev), []);

  const toggleEnhance = useCallback(() => {
    setEnhanceEnabled((prev) => {
      const next = !prev;
      postProcessorRef.current?.setConfig({ enabled: next });
      return next;
    });
  }, []);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    if (captured) URL.revokeObjectURL(captured.previewUrl);
    setCaptured(null);
  }, [captured]);

  // Feature 1: Grid toggle
  const toggleGrid = useCallback(() => setShowGrid((prev) => !prev), []);

  // Feature 2: Torch toggle
  const toggleTorch = useCallback(async () => {
    const stream = cameraService.getStream();
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    const next = !torchEnabled;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchEnabled(next);
    } catch {
      // torch not supported or failed silently
    }
  }, [torchEnabled]);

  // Feature 3: Timer cycle
  const cycleTimer = useCallback(() => {
    setTimerMode((prev) => {
      if (prev === 0) return 3;
      if (prev === 3) return 10;
      return 0;
    });
  }, []);

  // Feature 4: Zoom
  const applyZoom = useCallback(
    async (newZoom: number) => {
      if (!zoomCapabilities) return;
      const clamped = Math.min(
        zoomCapabilities.max,
        Math.max(zoomCapabilities.min, newZoom),
      );
      const stream = cameraService.getStream();
      if (!stream) return;
      const track = stream.getVideoTracks()[0];
      if (!track) return;
      try {
        await track.applyConstraints({
          advanced: [{ zoom: clamped } as MediaTrackConstraintSet],
        });
        setZoomLevel(clamped);

        // Show zoom indicator briefly
        setShowZoomIndicator(true);
        if (zoomIndicatorTimerRef.current) {
          clearTimeout(zoomIndicatorTimerRef.current);
        }
        zoomIndicatorTimerRef.current = setTimeout(() => {
          setShowZoomIndicator(false);
        }, 1500);
      } catch {
        // zoom not supported
      }
    },
    [zoomCapabilities],
  );

  return {
    videoRef,
    canvasRef,
    isReady,
    previewUrl: captured?.previewUrl ?? null,
    capturedBlob: captured?.blob ?? null,
    capturedMirrored: captured?.mirrored ?? false,
    error,
    isMirrored,
    enhanceEnabled,
    resolutions,
    selectedResolution,
    setSelectedResolution,
    onVideoReady,
    capture,
    savePhoto,
    sendToEditor,
    retake,
    toggleMirror,
    toggleEnhance,
    switchCamera,
    // Feature 1
    showGrid,
    toggleGrid,
    // Feature 2
    torchEnabled,
    torchSupported,
    toggleTorch,
    // Feature 3
    timerMode,
    countdown,
    cycleTimer,
    // Feature 4
    zoomLevel,
    zoomCapabilities,
    showZoomIndicator,
    applyZoom,
  };
}
