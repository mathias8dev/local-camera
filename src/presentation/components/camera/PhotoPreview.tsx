"use client";

import { useState } from "react";
import { RotateCcw, Pencil, Download } from "lucide-react";
import { Dialog } from "@/presentation/components/ui/Dialog";
import { Input } from "@/presentation/components/ui/Input";

interface PhotoPreviewProps {
  previewUrl: string;
  isMirrored: boolean;
  onSave: (name: string) => void;
  onEdit: () => void;
  onRetake: () => void;
}

export function PhotoPreview({ previewUrl, isMirrored, onSave, onEdit, onRetake }: PhotoPreviewProps) {
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [name, setName] = useState("");

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-black">
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 pt-[max(1rem,env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        <img
          src={previewUrl}
          alt="Photo capturée"
          className={`max-h-full max-w-full rounded-lg object-contain ${isMirrored ? "scale-x-[-1]" : ""}`}
        />
      </div>

      <div className="flex items-center justify-center gap-3 bg-black/80 px-[max(1rem,env(safe-area-inset-left))] py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:gap-4">
        <button
          onClick={onRetake}
          className="flex items-center gap-2 rounded-full border-2 border-white px-4 py-2.5 text-sm font-medium text-white transition-colors active:bg-white/10 sm:px-6 sm:py-3 sm:text-base"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">Reprendre</span>
        </button>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 rounded-full border-2 border-white bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-colors active:bg-white/20 sm:px-6 sm:py-3 sm:text-base"
        >
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">Editer</span>
        </button>
        <button
          onClick={() => setShowNameDialog(true)}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors active:bg-zinc-300 sm:px-6 sm:py-3 sm:text-base"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Sauvegarder</span>
        </button>
      </div>

      <Dialog
        open={showNameDialog}
        onClose={() => setShowNameDialog(false)}
        title="Nom de la photo"
      >
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onSave(name.trim());
          }}
          placeholder="Ex : Coucher de soleil"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowNameDialog(false)}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(name.trim())}
            disabled={!name.trim()}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-40"
          >
            Enregistrer
          </button>
        </div>
      </Dialog>
    </div>
  );
}
