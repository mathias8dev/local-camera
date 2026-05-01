"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { mediaRepository } from "@/data/instances";
import { MediaItem } from "@/domain/entities/MediaItem";

function extractVideoMeta(blob: Blob): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "auto";
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video metadata"));
    };
    video.src = url;
  });
}

export interface StorageEstimate {
  usedMB: number;
  quotaMB: number;
  usedFraction: number;
}

export function useGallery() {
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<string, string>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [storageEstimate, setStorageEstimate] =
    useState<StorageEstimate | null>(null);
  const urlsRef = useRef<Map<string, string>>(new Map());

  const refreshStorageEstimate = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.storage?.estimate
    )
      return;
    const estimate = await navigator.storage.estimate();
    const usedMB = (estimate.usage ?? 0) / 1024 / 1024;
    const quotaMB = (estimate.quota ?? 0) / 1024 / 1024;
    setStorageEstimate({
      usedMB,
      quotaMB,
      usedFraction: quotaMB > 0 ? usedMB / quotaMB : 0,
    });
  }, []);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    const all = await mediaRepository.getAll();
    setPhotos(all);

    const urls = new Map<string, string>();
    await Promise.all(
      all.map(async (photo) => {
        const thumb = await mediaRepository.getThumbnail(photo.id);
        if (thumb) {
          urls.set(photo.id, URL.createObjectURL(thumb));
        }
      }),
    );

    for (const [, url] of urlsRef.current) URL.revokeObjectURL(url);
    urlsRef.current = urls;
    setThumbnailUrls(urls);
    setLoading(false);
    await refreshStorageEstimate();
  }, [refreshStorageEstimate]);

  useEffect(() => {
    loadPhotos();
    return () => {
      for (const [, url] of urlsRef.current) URL.revokeObjectURL(url);
    };
  }, [loadPhotos]);

  const deletePhoto = useCallback(
    async (id: string) => {
      await mediaRepository.delete(id);
      const url = urlsRef.current.get(id);
      if (url) URL.revokeObjectURL(url);
      urlsRef.current.delete(id);
      setThumbnailUrls(new Map(urlsRef.current));
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      await refreshStorageEstimate();
    },
    [refreshStorageEstimate],
  );

  const getFullBlob = useCallback(
    async (id: string): Promise<Blob | null> => {
      return mediaRepository.getImageBlob(id);
    },
    [],
  );

  const importMedia = useCallback(
    async (
      files: FileList,
      onProgress?: (done: number, total: number) => void,
    ) => {
      const fileArr = Array.from(files);
      let done = 0;
      for (const file of fileArr) {
        try {
          const blob: Blob = file;
          const id = `import-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const name = file.name.replace(/\.[^.]+$/, "");

          if (file.type.startsWith("video/")) {
            const { width, height, duration } = await extractVideoMeta(blob);
            const item: MediaItem = {
              id,
              name,
              width,
              height,
              createdAt: new Date(file.lastModified || Date.now()),
              type: "video",
              duration,
              mimeType: blob.type,
            };
            await mediaRepository.save(item, blob);
          } else {
            const bitmap = await createImageBitmap(blob);
            const width = bitmap.width;
            const height = bitmap.height;
            bitmap.close();
            const item: MediaItem = {
              id,
              name,
              width,
              height,
              createdAt: new Date(file.lastModified || Date.now()),
              type: "photo",
              mimeType: blob.type || "image/jpeg",
            };
            await mediaRepository.save(item, blob);
          }
        } catch {
          // skip unreadable files
        }
        done++;
        onProgress?.(done, fileArr.length);
      }
      await loadPhotos();
    },
    [loadPhotos],
  );

  return {
    photos,
    thumbnailUrls,
    loading,
    storageEstimate,
    deletePhoto,
    getFullBlob,
    importMedia,
    refresh: loadPhotos,
  };
}
