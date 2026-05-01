"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Share2, Download } from "lucide-react";
import { shareFile, downloadBlob } from "@/data/services/WebShareService";

interface VideoPreviewProps {
  blob: Blob;
  onRetake: () => void;
  onSave: (name: string) => Promise<void>;
  onDone: () => void;
}

export function VideoPreview({ blob, onRetake, onSave, onDone }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(name.trim());
      onDone();
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    await shareFile(blob, "Video");
  };

  const handleDownload = () => {
    downloadBlob(blob, name.trim() || "Video");
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-black">
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 pt-[max(1rem,env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        )}
      </div>

      {showNameInput ? (
        <div className="bg-black/80 px-[max(1rem,env(safe-area-inset-left))] py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom de la vidéo"
            autoFocus
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => setShowNameInput(false)}
              className="flex-1 rounded-full border-2 border-white px-4 py-2.5 text-sm font-medium text-white transition-colors active:bg-white/10"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="flex-1 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors active:bg-zinc-300 disabled:opacity-40"
            >
              {saving ? "Sauvegarde…" : "Sauvegarder"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-3 bg-black/80 px-[max(1rem,env(safe-area-inset-left))] py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:gap-4">
          <button
            onClick={onRetake}
            className="flex items-center gap-2 rounded-full border-2 border-white px-4 py-2.5 text-sm font-medium text-white transition-colors active:bg-white/10 sm:px-6 sm:py-3 sm:text-base"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reprendre</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 rounded-full border-2 border-white bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-colors active:bg-white/20 sm:px-6 sm:py-3 sm:text-base"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Partager</span>
          </button>
          <button
            onClick={() => setShowNameInput(true)}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors active:bg-zinc-300 sm:px-6 sm:py-3 sm:text-base"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Sauvegarder</span>
          </button>
        </div>
      )}
    </div>
  );
}
