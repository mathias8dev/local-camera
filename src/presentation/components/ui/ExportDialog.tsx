"use client";

import { ExportFormat } from "@/data/services/ImageRenderer";
import { Dialog } from "./Dialog";
import { Input } from "./Input";

const FORMAT_OPTIONS: { format: ExportFormat; label: string }[] = [
  { format: "image/png", label: "PNG" },
  { format: "image/jpeg", label: "JPEG" },
  { format: "image/webp", label: "WebP" },
];

interface ExportDialogProps {
  open: boolean;
  name: string;
  format: ExportFormat;
  quality: number;
  saving: boolean;
  onNameChange: (name: string) => void;
  onFormatChange: (format: ExportFormat) => void;
  onQualityChange: (quality: number) => void;
  onSave: () => void;
  onClose: () => void;
}

export function ExportDialog({
  open,
  name,
  format,
  quality,
  saving,
  onNameChange,
  onFormatChange,
  onQualityChange,
  onSave,
  onClose,
}: ExportDialogProps) {
  const canSave = name.trim().length > 0 && !saving;

  return (
    <Dialog open={open} onClose={onClose} title="Exporter la photo">
      <Input
        autoFocus
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && canSave) onSave();
        }}
        placeholder="Ex : Coucher de soleil"
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-zinc-400">Format</span>
        <div className="flex gap-2">
          {FORMAT_OPTIONS.map(({ format: f, label }) => (
            <button
              key={f}
              onClick={() => onFormatChange(f)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                format === f
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {format !== "image/png" && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Qualité</span>
            <span className="text-xs font-medium text-zinc-300">{quality}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={quality}
            onChange={(e) => onQualityChange(Number(e.target.value))}
            className="w-full accent-white"
          />
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Annuler
        </button>
        <button
          onClick={onSave}
          disabled={!canSave}
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-40"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </Dialog>
  );
}
