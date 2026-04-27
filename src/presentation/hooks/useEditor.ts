"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IndexedDBFileStorage } from "@/data/storage/IndexedDBFileStorage";
import { IndexedDBPhotoRepository } from "@/data/repositories/IndexedDBPhotoRepository";
import { OperationValues } from "@/domain/entities/EditorOperation";
import { Photo } from "@/domain/entities/Photo";
import { allOperations, defaultValues } from "@/data/operations/registry";
import { renderImage, exportCanvas } from "@/data/services/ImageRenderer";

const fileStorage = new IndexedDBFileStorage();
const photoRepository = new IndexedDBPhotoRepository(fileStorage);

export function useEditor(photoId: string | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [values, setValues] = useState<OperationValues>({ ...defaultValues });
  const [imageReady, setImageReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!photoId) {
      setError("Aucune photo à éditer.");
      setLoading(false);
      return;
    }
    fileStorage.get(photoId).then((blob) => {
      if (!blob) {
        setError("Photo introuvable.");
        setLoading(false);
        return;
      }
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setImageReady(true);
        setLoading(false);
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(blob);
    });
  }, [photoId]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    renderImage(canvas, img, allOperations, values);
  }, [values, imageReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    draw();
  }, [draw]);

  const updateParam = useCallback(
    (operationId: string, paramKey: string, value: number) => {
      setValues((prev) => ({
        ...prev,
        [operationId]: { ...prev[operationId], [paramKey]: value },
      }));
    },
    [],
  );

  const resetAll = useCallback(() => {
    setValues({ ...defaultValues });
  }, []);

  const save = useCallback(
    async (name: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      draw();
      const blob = await exportCanvas(canvas);
      const photo: Photo = {
        id: crypto.randomUUID(),
        name,
        width: canvas.width,
        height: canvas.height,
        createdAt: new Date(),
      };
      await photoRepository.save(photo, blob);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name}.png`;
      link.click();
      URL.revokeObjectURL(url);
      if (photoId) await fileStorage.delete(photoId);
    },
    [draw, photoId],
  );

  return {
    canvasRef,
    values,
    loading,
    error,
    updateParam,
    resetAll,
    save,
  };
}
