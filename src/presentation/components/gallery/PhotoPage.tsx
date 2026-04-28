"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Share2,
  Download,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useImageColors } from "@/presentation/hooks/useImageColors";
import { IndexedDBPhotoRepository } from "@/data/repositories/IndexedDBPhotoRepository";
import { IndexedDBFileStorage } from "@/data/storage/IndexedDBFileStorage";
import { shareFile, downloadBlob } from "@/data/services/WebShareService";
import { Photo } from "@/domain/entities/Photo";
import { Dialog } from "@/presentation/components/ui/Dialog";

const fileStorage = new IndexedDBFileStorage();
const photoRepository = new IndexedDBPhotoRepository(fileStorage);

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

interface PhotoPageProps {
  photoId: string;
}

export function PhotoPage({ photoId }: PhotoPageProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [thumbnailUrls, setThumbnailUrls] = useState<Map<string, string>>(
    new Map(),
  );
  const [fullUrls, setFullUrls] = useState<Map<string, string>>(new Map());
  const [fullLoaded, setFullLoaded] = useState<Set<string>>(new Set());
  const fullUrlsRef = useRef<Map<string, string>>(new Map());
  const thumbnailUrlsRef = useRef<Map<string, string>>(new Map());

  const [direction, setDirection] = useState(0);

  // Touch swipe
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50;

  // Load all photos and find current
  useEffect(() => {
    (async () => {
      const all = await photoRepository.getAll();
      const sorted = [...all].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      setPhotos(sorted);
      const idx = sorted.findIndex((p) => p.id === photoId);
      setCurrentIndex(idx >= 0 ? idx : 0);
      setLoading(false);

      // Load thumbnails
      const thumbs = new Map<string, string>();
      await Promise.all(
        sorted.map(async (photo) => {
          const thumb = await photoRepository.getThumbnail(photo.id);
          if (thumb) {
            thumbs.set(photo.id, URL.createObjectURL(thumb));
          }
        }),
      );
      thumbnailUrlsRef.current = thumbs;
      setThumbnailUrls(thumbs);
    })();

    const thumbUrls = thumbnailUrlsRef.current;
    const fullResUrls = fullUrlsRef.current;
    return () => {
      for (const [, url] of thumbUrls) URL.revokeObjectURL(url);
      for (const [, url] of fullResUrls) URL.revokeObjectURL(url);
    };
  }, [photoId]);

  const currentPhoto = currentIndex >= 0 ? photos[currentIndex] : null;
  const currentThumbUrl = currentPhoto
    ? thumbnailUrls.get(currentPhoto.id)
    : undefined;
  const bgGradient = useImageColors(currentThumbUrl);

  // Load full-res
  const loadFull = useCallback(
    async (index: number) => {
      const photo = photos[index];
      if (!photo || fullUrlsRef.current.has(photo.id)) return;
      const blob = await photoRepository.getImageBlob(photo.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        fullUrlsRef.current.set(photo.id, url);
        setFullUrls(new Map(fullUrlsRef.current));
      }
    },
    [photos],
  );

  useEffect(() => {
    if (currentIndex >= 0) loadFull(currentIndex);
  }, [currentIndex, loadFull]);

  // Preload adjacent
  useEffect(() => {
    if (currentIndex > 0) loadFull(currentIndex - 1);
    if (currentIndex < photos.length - 1) loadFull(currentIndex + 1);
  }, [currentIndex, photos.length, loadFull]);

  const goToPrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < photos.length - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    }
  };

  // Keyboard nav
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/gallery");
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) goToNext();
      else goToPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleEdit = async () => {
    if (!currentPhoto) return;
    const blob = await photoRepository.getImageBlob(currentPhoto.id);
    if (blob) {
      await fileStorage.save(`edit-${currentPhoto.id}`, blob);
      router.push(`/editor?photoId=edit-${currentPhoto.id}`);
    }
  };

  const handleShare = async () => {
    if (!currentPhoto) return;
    const blob = await photoRepository.getImageBlob(currentPhoto.id);
    if (blob) await shareFile(blob, currentPhoto.name);
  };

  const handleDownload = async () => {
    if (!currentPhoto) return;
    const blob = await photoRepository.getImageBlob(currentPhoto.id);
    if (blob) downloadBlob(blob, currentPhoto.name);
  };

  const handleDelete = async () => {
    if (!currentPhoto) return;
    setConfirmDelete(false);
    await photoRepository.delete(currentPhoto.id);

    const url = fullUrlsRef.current.get(currentPhoto.id);
    if (url) URL.revokeObjectURL(url);
    fullUrlsRef.current.delete(currentPhoto.id);

    const thumbUrl = thumbnailUrlsRef.current.get(currentPhoto.id);
    if (thumbUrl) URL.revokeObjectURL(thumbUrl);
    thumbnailUrlsRef.current.delete(currentPhoto.id);

    if (photos.length <= 1) {
      router.push("/gallery");
    } else {
      const newPhotos = photos.filter((p) => p.id !== currentPhoto.id);
      setPhotos(newPhotos);
      setCurrentIndex((i) => Math.min(i, newPhotos.length - 1));
    }
  };

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-600 border-t-white" />
      </div>
    );
  }

  if (!currentPhoto) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-black text-white">
        <p className="text-lg text-zinc-400">Photo introuvable</p>
        <button
          onClick={() => router.push("/gallery")}
          className="rounded-full border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-300 transition-colors active:bg-zinc-800"
        >
          Retour à la galerie
        </button>
      </div>
    );
  }

  const thumbnailUrl = thumbnailUrls.get(currentPhoto.id);
  const fullUrl = fullUrls.get(currentPhoto.id);
  const isFullLoaded = fullLoaded.has(currentPhoto.id);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div
      className="relative flex h-dvh flex-col bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dynamic background gradient from photo colors */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30 transition-[background-image] duration-700"
        style={{ backgroundImage: bgGradient ?? undefined }}
      />
      <div className="pointer-events-none absolute inset-0 bg-black/40" />
      {/* Top bar */}
      <motion.div
        className="flex items-center justify-between px-[max(1rem,env(safe-area-inset-left))] pt-[max(1rem,env(safe-area-inset-top))] pb-3 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.2 }}
      >
        <button
          onClick={() => router.push("/gallery")}
          className="flex items-center gap-1.5 rounded-full bg-zinc-900/80 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors active:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Galerie
        </button>
        {photos.length > 1 && (
          <span className="text-sm text-zinc-500">
            {currentIndex + 1} / {photos.length}
          </span>
        )}
        <div className="w-20" />
      </motion.div>

      {/* Image area */}
      <div
        className="relative z-10 flex flex-1 items-center justify-center overflow-hidden"
        key="image-area"
      >
        <motion.div
          key={currentPhoto.id}
          className="absolute inset-0 flex items-center justify-center"
          custom={direction}
          variants={slideVariants}
          initial={direction !== 0 ? "enter" : false}
          animate="center"
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={currentPhoto.name}
              className={`absolute max-h-full max-w-full object-contain select-none transition-opacity duration-500 ${
                isFullLoaded ? "opacity-0" : "opacity-100"
              }`}
              draggable={false}
            />
          )}
          {fullUrl && (
            <img
              src={fullUrl}
              alt={currentPhoto.name}
              className={`absolute max-h-full max-w-full object-contain select-none transition-opacity duration-500 ${
                isFullLoaded ? "opacity-100" : "opacity-0"
              }`}
              draggable={false}
              onLoad={() =>
                setFullLoaded((prev) => new Set(prev).add(currentPhoto.id))
              }
            />
          )}
          {!thumbnailUrl && !fullUrl && (
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-600 border-t-white" />
          )}
        </motion.div>

        {currentIndex > 0 && (
          <button
            onClick={goToPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm active:bg-black/60 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {currentIndex < photos.length - 1 && (
          <button
            onClick={goToNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm active:bg-black/60 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom info + actions */}
      <motion.div
        className="relative z-10 px-[max(1rem,env(safe-area-inset-left))] pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.2 }}
      >
        <p className="truncate text-base font-semibold text-white">
          {currentPhoto.name}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {dateFormat.format(currentPhoto.createdAt)} &middot;{" "}
          {currentPhoto.width} &times; {currentPhoto.height}
        </p>

        <div className="mt-4 flex items-center justify-center gap-3">
          <ActionButton label="Modifier" onClick={handleEdit}>
            <Pencil className="h-5 w-5" />
          </ActionButton>
          <ActionButton label="Partager" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </ActionButton>
          <ActionButton label="Télécharger" onClick={handleDownload}>
            <Download className="h-5 w-5" />
          </ActionButton>
          <ActionButton
            label="Supprimer"
            onClick={() => setConfirmDelete(true)}
            danger
          >
            <Trash2 className="h-5 w-5" />
          </ActionButton>
        </div>
      </motion.div>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Supprimer cette photo ?"
      >
        <p className="text-sm text-zinc-400">
          &quot;{currentPhoto.name}&quot; sera définitivement supprimée.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setConfirmDelete(false)}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Supprimer
          </button>
        </div>
      </Dialog>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3 transition-all duration-150 active:scale-95 ${
        danger
          ? "bg-red-500/15 text-red-400 active:bg-red-500/25"
          : "bg-white/10 text-white active:bg-white/20"
      }`}
    >
      {children}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
