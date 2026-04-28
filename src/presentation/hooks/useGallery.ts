"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IndexedDBPhotoRepository } from "@/data/repositories/IndexedDBPhotoRepository";
import { IndexedDBFileStorage } from "@/data/storage/IndexedDBFileStorage";
import { Photo } from "@/domain/entities/Photo";

const fileStorage = new IndexedDBFileStorage();
const photoRepository = new IndexedDBPhotoRepository(fileStorage);

export function useGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<string, string>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const urlsRef = useRef<Map<string, string>>(new Map());

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
  }, []);

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
    },
    [],
  );

  const getFullBlob = useCallback(async (id: string): Promise<Blob | null> => {
    return photoRepository.getImageBlob(id);
  }, []);

  return { photos, thumbnailUrls, loading, deletePhoto, getFullBlob, refresh: loadPhotos };
}
