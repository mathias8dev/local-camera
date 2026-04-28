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
  const [loadingFull, setLoadingFull] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
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

      setLoadingFull(true);
      const blob = await getFullBlob(photo.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        fullUrlsRef.current.set(photo.id, url);
        setFullUrls(new Map(fullUrlsRef.current));
      }
      setLoadingFull(false);
    },
    [photos, getFullBlob],
  );

  useEffect(() => {
    loadFull(currentIndex);
  }, [currentIndex, loadFull]);

  // Preload adjacent photos
  useEffect(() => {
    if (currentIndex > 0) loadFull(currentIndex - 1);
    if (currentIndex < photos.length - 1) loadFull(currentIndex + 1);
  }, [currentIndex, photos.length, loadFull]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      for (const [, url] of fullUrlsRef.current) URL.revokeObjectURL(url);
    };
  }, []);

  // Keyboard navigation
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
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const goToNext = () => {
    if (currentIndex < photos.length - 1) setCurrentIndex((i) => i + 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only register horizontal swipes (more horizontal than vertical)
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
    // Navigate after delete
    if (photos.length === 1) {
      onClose();
    } else if (currentIndex >= photos.length - 1) {
      setCurrentIndex((i) => i - 1);
    }
  };

  if (!currentPhoto) return null;

  const thumbnailUrl = thumbnailUrls.get(currentPhoto.id);
  const fullUrl = fullUrls.get(currentPhoto.id);
  const displayUrl = fullUrl ?? thumbnailUrl;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-60 flex flex-col bg-black"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 z-10">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm active:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="text-sm text-zinc-400">
            {currentIndex + 1} / {photos.length}
          </span>
          <div className="h-10 w-10" />
        </div>

        {/* Image area */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          {displayUrl ? (
            <img
              key={currentPhoto.id}
              src={displayUrl}
              alt={currentPhoto.name}
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-600 border-t-white" />
            </div>
          )}

          {/* Loading full-res indicator */}
          {loadingFull && fullUrl === undefined && displayUrl !== undefined && (
            <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs text-zinc-300">
              Chargement HD…
            </div>
          )}

          {/* Prev/Next nav buttons */}
          {currentIndex > 0 && (
            <button
              onClick={goToPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm active:bg-black/70"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {currentIndex < photos.length - 1 && (
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm active:bg-black/70"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Bottom info + actions */}
        <div className="px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/90 to-transparent">
          <p className="truncate text-base font-semibold text-white">
            {currentPhoto.name}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {dateFormat.format(currentPhoto.createdAt)} &middot;{" "}
            {currentPhoto.width} &times; {currentPhoto.height}
          </p>

          <div className="mt-4 flex items-center justify-center gap-4">
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
        </div>
      </div>

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
    </>,
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
      className={`flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors active:scale-95 ${
        danger
          ? "bg-red-500/20 text-red-400 active:bg-red-500/30"
          : "bg-white/10 text-white active:bg-white/20"
      }`}
    >
      {children}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
