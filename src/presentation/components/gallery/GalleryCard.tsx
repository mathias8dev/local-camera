"use client";

import { useState } from "react";
import { Pencil, Share2, Download, Trash2 } from "lucide-react";
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
}

export function GalleryCard({
  photo,
  thumbnailUrl,
  onEdit,
  onShare,
  onDownload,
  onDelete,
}: GalleryCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <div className="group relative overflow-hidden rounded-xl bg-zinc-900">
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

        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 active:opacity-100">
          <div className="flex justify-center gap-1 px-2 pb-2">
            <button
              onClick={onEdit}
              className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm active:bg-white/30"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onShare}
              className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm active:bg-white/30"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDownload}
              className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm active:bg-white/30"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-full bg-red-500/80 p-2 text-white backdrop-blur-sm active:bg-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

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
