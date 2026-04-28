"use client";

import { useRouter } from "next/navigation";
import { Camera, ImageOff } from "lucide-react";
import { useGallery } from "@/presentation/hooks/useGallery";
import { shareFile, downloadBlob } from "@/data/services/WebShareService";
import { IndexedDBFileStorage } from "@/data/storage/IndexedDBFileStorage";
import { GalleryCard } from "./GalleryCard";

const fileStorage = new IndexedDBFileStorage();

export function GalleryView() {
  const router = useRouter();
  const { photos, thumbnailUrls, loading, deletePhoto, getFullBlob } =
    useGallery();

  const handleEdit = async (id: string) => {
    await fileStorage.save(`edit-${id}`, (await getFullBlob(id))!);
    router.push(`/editor?photoId=edit-${id}`);
  };

  const handleShare = async (id: string, name: string) => {
    const blob = await getFullBlob(id);
    if (blob) await shareFile(blob, name);
  };

  const handleDownload = async (id: string, name: string) => {
    const blob = await getFullBlob(id);
    if (blob) downloadBlob(blob, name);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-600 border-t-white" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-black">
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <h1 className="text-xl font-bold text-white">Galerie</h1>
        <button
          onClick={() => router.push("/camera")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-colors active:bg-zinc-300"
        >
          <Camera className="h-5 w-5" />
        </button>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <ImageOff className="h-16 w-16 text-zinc-600" />
          <p className="text-lg text-zinc-400">Aucune photo</p>
          <button
            onClick={() => router.push("/camera")}
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-colors active:bg-zinc-300"
          >
            Prendre une photo
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {photos.map((photo) => (
              <GalleryCard
                key={photo.id}
                photo={photo}
                thumbnailUrl={thumbnailUrls.get(photo.id)}
                onEdit={() => handleEdit(photo.id)}
                onShare={() => handleShare(photo.id, photo.name)}
                onDownload={() => handleDownload(photo.id, photo.name)}
                onDelete={() => deletePhoto(photo.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
