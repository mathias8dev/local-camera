"use client";

import { useState } from "react";
import { Pencil, Share2, Download, Trash2, Check } from "lucide-react";
import { Photo } from "@/domain/entities/Photo";
import { Dialog } from "@/presentation/components/ui/Dialog";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

interface GalleryCardProps {
  photo: Photo;
  thumbnailUrl?: string;
  onEdit: () => void;
  onShare: () => void;
  onDownload: () => void;
  onDelete: () => void;
  // Select mode
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onOpen?: () => void;
}

export function GalleryCard({
  photo,
  thumbnailUrl,
  onEdit,
  onShare,
  onDownload,
  onDelete,
  selectMode = false,
  selected = false,
  onSelect,
  onOpen,
}: GalleryCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleCardClick = () => {
    if (selectMode) {
      onSelect?.();
    } else {
      onOpen?.();
    }
  };

  return (
    <>
      <div
        className="group relative overflow-hidden rounded-xl bg-zinc-900 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="aspect-square">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={photo.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-500">
              <span className="text-xs">Pas d&apos;aperçu</span>
            </div>
          )}
        </div>

        {/* Select mode overlay */}
        {selectMode && (
          <div
            className={`absolute inset-0 transition-colors ${
              selected ? "bg-blue-500/30" : "bg-transparent"
            }`}
          >
            <div
              className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                selected
                  ? "border-blue-400 bg-blue-500"
                  : "border-white/60 bg-black/30"
              }`}
            >
              {selected && <Check className="h-3.5 w-3.5 text-white" />}
            </div>
          </div>
        )}

        {/* Action overlay (only in non-select mode) */}
        {!selectMode && (
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 active:opacity-100">
            <div className="flex justify-center gap-1 px-2 pb-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm active:bg-white/30"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
                className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm active:bg-white/30"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
                className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm active:bg-white/30"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(true);
                }}
                className="rounded-full bg-red-500/80 p-2 text-white backdrop-blur-sm active:bg-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-medium text-white">
            {photo.name}
          </p>
          <p className="text-xs text-zinc-400">
            {dateFormat.format(photo.createdAt)}
          </p>
        </div>
      </div>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Supprimer cette photo ?"
      >
        <p className="text-sm text-zinc-400">
          &quot;{photo.name}&quot; sera définitivement supprimée.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setConfirmDelete(false)}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              setConfirmDelete(false);
              onDelete();
            }}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Supprimer
          </button>
        </div>
      </Dialog>
    </>
  );
}
