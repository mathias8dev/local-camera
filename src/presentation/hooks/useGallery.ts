"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IndexedDBPhotoRepository } from "@/data/repositories/IndexedDBPhotoRepository";
import { IndexedDBFileStorage } from "@/data/storage/IndexedDBFileStorage";
import { Photo } from "@/domain/entities/Photo";

const fileStorage = new IndexedDBFileStorage();
const photoRepository = new IndexedDBPhotoRepository(fileStorage);

export interface StorageEstimate {
  usedMB: number;
  quotaMB: number;
  usedFraction: number;
}

export function useGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
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
    const all = await photoRepository.getAll();
    setPhotos(all);

    const urls = new Map<string, string>();
    await Promise.all(
      all.map(async (photo) => {
        const thumb = await photoRepository.getThumbnail(photo.id);
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
      await photoRepository.delete(id);
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
      return photoRepository.getImageBlob(id);
    },
    [],
  );

  const importPhotos = useCallback(
    async (
      files: FileList,
      onProgress?: (done: number, total: number) => void,
    ) => {
      const fileArr = Array.from(files);
      let done = 0;
      for (const file of fileArr) {
        try {
          const blob: Blob = file;
          const bitmap = await createImageBitmap(blob);
          const width = bitmap.width;
          const height = bitmap.height;
          bitmap.close();

          const id = `import-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const name = file.name.replace(/\.[^.]+$/, "");
          const photo: Photo = {
            id,
            name,
            width,
            height,
            createdAt: new Date(file.lastModified || Date.now()),
          };
          await photoRepository.save(photo, blob);
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
    importPhotos,
    refresh: loadPhotos,
  };
}
