"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Photo } from "@/domain/entities/Photo";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

interface GalleryCardProps {
  photo: Photo;
  thumbnailUrl?: string;
  onOpen?: () => void;
  // Select mode
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export function GalleryCard({
  photo,
  thumbnailUrl,
  onOpen,
  selectMode = false,
  selected = false,
  onSelect,
}: GalleryCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleCardClick = () => {
    if (selectMode) {
      onSelect?.();
    } else {
      onOpen?.();
    }
  };

  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-zinc-900 cursor-pointer transition-transform duration-150 active:scale-[0.97]"
      onClick={handleCardClick}
    >
      <div className="aspect-square relative">
        {/* Skeleton shimmer — visible until image loads */}
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-zinc-800" />
        )}

        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={photo.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          <div className="absolute inset-0 animate-pulse bg-zinc-800" />
        )}
      </div>

      {/* Select mode overlay */}
      {selectMode && (
        <div
          className={`absolute inset-0 transition-colors duration-150 ${
            selected ? "bg-blue-500/30" : "bg-transparent"
          }`}
        >
          <div
            className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-150 ${
              selected
                ? "border-blue-400 bg-blue-500 scale-110"
                : "border-white/60 bg-black/30"
            }`}
          >
            {selected && <Check className="h-3.5 w-3.5 text-white" />}
          </div>
        </div>
      )}

      <div className="px-2.5 py-2">
        {imgLoaded || thumbnailUrl ? (
          <>
            <p className="truncate text-sm font-medium text-white">
              {photo.name}
            </p>
            <p className="text-xs text-zinc-500">
              {dateFormat.format(photo.createdAt)}
            </p>
          </>
        ) : (
          <>
            <div className="mb-1.5 h-3.5 w-3/4 animate-pulse rounded bg-zinc-700" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-zinc-800" />
          </>
        )}
      </div>
    </div>
  );
}
