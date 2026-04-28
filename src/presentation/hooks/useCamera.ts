"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraService, FacingMode } from "@/data/services/CameraService";
import { WebGLPostProcessor } from "@/data/services/webgl/WebGLPostProcessor";
import { IndexedDBPhotoRepository } from "@/data/repositories/IndexedDBPhotoRepository";
import { IndexedDBFileStorage } from "@/data/storage/IndexedDBFileStorage";
import { Photo } from "@/domain/entities/Photo";

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

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const postProcessorRef = useRef<WebGLPostProcessor | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [isReady, setIsReady] = useState(false);
  const [captured, setCaptured] = useState<CapturedData | null>(null);
  const [isMirrored, setIsMirrored] = useState(false);
  const [enhanceEnabled, setEnhanceEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        setIsReady(false);
        const stream = await cameraService.start(facingMode);
        if (!cancelled && videoRef.current) {
          videoRef.current.srcObject = stream;
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

  const capture = useCallback(async () => {
    if (!videoRef.current) return;
    const { blob, width, height } = await cameraService.capture(videoRef.current);
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
  }, [isMirrored]);

  const savePhoto = useCallback(
    async (name: string) => {
      if (!captured) return;
      let blob = captured.blob;
      if (captured.mirrored) {
        blob = await CameraService.applyMirror(blob, captured.width, captured.height);
      }
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
      link.download = `${name}.jpg`;
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

  return {
    videoRef,
    canvasRef,
    isReady,
    previewUrl: captured?.previewUrl ?? null,
    capturedMirrored: captured?.mirrored ?? false,
    error,
    isMirrored,
    enhanceEnabled,
    onVideoReady,
    capture,
    savePhoto,
    sendToEditor,
    retake,
    toggleMirror,
    toggleEnhance,
    switchCamera,
  };
}
