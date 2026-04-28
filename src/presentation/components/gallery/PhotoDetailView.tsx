"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Share2,
  Download,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Photo } from "@/domain/entities/Photo";
import { Dialog } from "@/presentation/components/ui/Dialog";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

interface PhotoDetailViewProps {
  photos: Photo[];
  initialIndex: number;
  thumbnailUrls: Map<string, string>;
  getFullBlob: (id: string) => Promise<Blob | null>;
  onClose: () => void;
  onEdit: (id: string) => void;
  onShare: (id: string, name: string) => void;
  onDownload: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function PhotoDetailView({
  photos,
  initialIndex,
  thumbnailUrls,
  getFullBlob,
  onClose,
  onEdit,
  onShare,
  onDownload,
  onDelete,
}: PhotoDetailViewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [fullUrls, setFullUrls] = useState<Map<string, string>>(new Map());
  const [fullLoaded, setFullLoaded] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [direction, setDirection] = useState(0);
  const fullUrlsRef = useRef<Map<string, string>>(new Map());

  // Touch swipe state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50;

  const currentPhoto = photos[currentIndex];

  const loadFull = useCallback(
    async (index: number) => {
      const photo = photos[index];
      if (!photo) return;
      if (fullUrlsRef.current.has(photo.id)) return;

      const blob = await getFullBlob(photo.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        fullUrlsRef.current.set(photo.id, url);
        setFullUrls(new Map(fullUrlsRef.current));
      }
    },
    [photos, getFullBlob],
  );

  useEffect(() => {
    loadFull(currentIndex);
  }, [currentIndex, loadFull]);

  useEffect(() => {
    if (currentIndex > 0) loadFull(currentIndex - 1);
    if (currentIndex < photos.length - 1) loadFull(currentIndex + 1);
  }, [currentIndex, photos.length, loadFull]);

  useEffect(() => {
    return () => {
      for (const [, url] of fullUrlsRef.current) URL.revokeObjectURL(url);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

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

  const handleDelete = () => {
    setConfirmDelete(false);
    onDelete(currentPhoto.id);
    if (photos.length === 1) {
      onClose();
    } else if (currentIndex >= photos.length - 1) {
      setCurrentIndex((i) => i - 1);
    }
  };

  if (!currentPhoto) return null;

  const thumbnailUrl = thumbnailUrls.get(currentPhoto.id);
  const fullUrl = fullUrls.get(currentPhoto.id);
  const isFullLoaded = fullLoaded.has(currentPhoto.id);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return createPortal(
    <motion.div
      className="fixed inset-0 z-60 flex flex-col bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <motion.div
        className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.2 }}
      >
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm active:bg-white/20 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <span className="text-sm text-zinc-400">
          {currentIndex + 1} / {photos.length}
        </span>
        <div className="h-10 w-10" />
      </motion.div>

      {/* Image area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={currentPhoto.id}
            className="absolute inset-0 flex items-center justify-center"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {/* Thumbnail (always visible as base) */}
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
            {/* Full-res (fades in over thumbnail) */}
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
            {/* Loading spinner when no image at all */}
            {!thumbnailUrl && !fullUrl && (
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-600 border-t-white" />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Prev/Next nav buttons */}
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
        className="px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.2 }}
      >
        <p className="truncate text-base font-semibold text-white">
          {currentPhoto.name}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {dateFormat.format(currentPhoto.createdAt)} &middot;{" "}
          {currentPhoto.width} &times; {currentPhoto.height}
        </p>

        <div className="mt-4 flex items-center justify-center gap-3">
          <ActionButton
            label="Modifier"
            onClick={() => onEdit(currentPhoto.id)}
          >
            <Pencil className="h-5 w-5" />
          </ActionButton>
          <ActionButton
            label="Partager"
            onClick={() => onShare(currentPhoto.id, currentPhoto.name)}
          >
            <Share2 className="h-5 w-5" />
          </ActionButton>
          <ActionButton
            label="Télécharger"
            onClick={() => onDownload(currentPhoto.id, currentPhoto.name)}
          >
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
    </motion.div>,
    document.body,
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
