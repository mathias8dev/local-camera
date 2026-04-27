"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraService, FacingMode } from "@/data/services/CameraService";
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
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [isReady, setIsReady] = useState(false);
  const [captured, setCaptured] = useState<CapturedData | null>(null);
  const [isMirrored, setIsMirrored] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async (mode: FacingMode) => {
    try {
      setError(null);
      setIsReady(false);
      const stream = await cameraService.start(mode);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => cameraService.stop();
  }, [facingMode, startCamera]);

  const onVideoReady = useCallback(() => setIsReady(true), []);

  const capture = useCallback(async () => {
    if (!videoRef.current) return;
    const { blob, width, height } = await cameraService.capture(videoRef.current, isMirrored);
    setCaptured({
      blob,
      previewUrl: URL.createObjectURL(blob),
      width,
      height,
    });
  }, [isMirrored]);

  const savePhoto = useCallback(
    async (name: string) => {
      if (!captured) return;
      const photo: Photo = {
        id: crypto.randomUUID(),
        name,
        width: captured.width,
        height: captured.height,
        createdAt: new Date(),
      };
      await photoRepository.save(photo, captured.blob);
      const link = document.createElement("a");
      link.href = captured.previewUrl;
      link.download = `${name}.png`;
      link.click();
      URL.revokeObjectURL(captured.previewUrl);
      setCaptured(null);
    },
    [captured],
  );

  const sendToEditor = useCallback(async (): Promise<string | null> => {
    if (!captured) return null;
    const id = crypto.randomUUID();
    await fileStorage.save(id, captured.blob);
    URL.revokeObjectURL(captured.previewUrl);
    setCaptured(null);
    return id;
  }, [captured]);

  const retake = useCallback(() => {
    if (captured) URL.revokeObjectURL(captured.previewUrl);
    setCaptured(null);
  }, [captured]);

  const toggleMirror = useCallback(() => setIsMirrored((prev) => !prev), []);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    if (captured) URL.revokeObjectURL(captured.previewUrl);
    setCaptured(null);
  }, [captured]);

  return {
    videoRef,
    isReady,
    previewUrl: captured?.previewUrl ?? null,
    error,
    isMirrored,
    onVideoReady,
    capture,
    savePhoto,
    sendToEditor,
    retake,
    toggleMirror,
    switchCamera,
  };
}
