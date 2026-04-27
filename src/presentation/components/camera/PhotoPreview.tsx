"use client";

import { useState } from "react";
import { Dialog } from "@/presentation/components/ui/Dialog";
import { Input } from "@/presentation/components/ui/Input";

interface PhotoPreviewProps {
  previewUrl: string;
  onSave: (name: string) => void;
  onEdit: () => void;
  onRetake: () => void;
}

export function PhotoPreview({ previewUrl, onSave, onEdit, onRetake }: PhotoPreviewProps) {
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [name, setName] = useState("");

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-black">
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <img
          src={previewUrl}
          alt="Photo capturée"
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div className="flex items-center justify-center gap-4 bg-black/80 px-6 py-6">
        <button
          onClick={onRetake}
          className="rounded-full border-2 border-white px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/10"
        >
          Reprendre
        </button>
        <button
          onClick={onEdit}
          className="rounded-full border-2 border-white bg-white/10 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/20"
        >
          Editer
        </button>
        <button
          onClick={() => setShowNameDialog(true)}
          className="rounded-full bg-white px-6 py-3 text-base font-medium text-black transition-colors hover:bg-zinc-200"
        >
          Sauvegarder
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
