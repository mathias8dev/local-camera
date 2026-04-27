"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraService, FacingMode } from "@/data/services/CameraService";
import { LocalPhotoRepository } from "@/data/repositories/LocalPhotoRepository";
import { Photo } from "@/domain/entities/Photo";

const cameraService = new CameraService();
const photoRepository = new LocalPhotoRepository();

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [isReady, setIsReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<Photo | null>(null);
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

  const capture = useCallback(() => {
    if (!videoRef.current) return;
    const { dataUrl, width, height } = cameraService.capture(videoRef.current, isMirrored);
    const photo: Photo = {
      id: crypto.randomUUID(),
      name: "",
      dataUrl,
      width,
      height,
      createdAt: new Date(),
    };
    setCapturedPhoto(photo);
  }, [isMirrored]);

  const savePhoto = useCallback(
    (name: string) => {
      if (!capturedPhoto) return;
      photoRepository.save({ ...capturedPhoto, name });
      const link = document.createElement("a");
      link.href = capturedPhoto.dataUrl;
      link.download = `${name}.png`;
      link.click();
      setCapturedPhoto(null);
    },
    [capturedPhoto],
  );

  const retake = useCallback(() => setCapturedPhoto(null), []);

  const toggleMirror = useCallback(() => setIsMirrored((prev) => !prev), []);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    setCapturedPhoto(null);
  }, []);

  return {
    videoRef,
    isReady,
    capturedPhoto,
    error,
    isMirrored,
    onVideoReady,
    capture,
    savePhoto,
    retake,
    toggleMirror,
    switchCamera,
  };
}
