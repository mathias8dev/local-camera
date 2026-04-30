"use client";

import { useState } from "react";
import { RotateCcw, Pencil, Share2, Download } from "lucide-react";
import { ExportDialog } from "@/presentation/components/ui/ExportDialog";
import { ExportFormat } from "@/data/services/ImageRenderer";
import { downloadBlob } from "@/data/services/WebShareService";

interface PhotoPreviewProps {
  previewUrl: string;
  onSave: (name: string, format: ExportFormat, quality?: number) => Promise<Blob | null>;
  onEdit: () => void;
  onShare: () => void;
  onRetake: () => void;
}

export function PhotoPreview({ previewUrl, onSave, onEdit, onShare, onRetake }: PhotoPreviewProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [name, setName] = useState("");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("image/jpeg");
  const [exportQuality, setExportQuality] = useState(85);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const quality = exportFormat !== "image/png" ? exportQuality / 100 : undefined;
      const blob = await onSave(name.trim(), exportFormat, quality);
      if (blob) downloadBlob(blob, name.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-black">
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 pt-[max(1rem,env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        <img
          src={previewUrl}
          alt="Photo capturée"
          className="max-h-full max-w-full rounded-lg object-contain"
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
          onClick={onShare}
          className="flex items-center gap-2 rounded-full border-2 border-white bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-colors active:bg-white/20 sm:px-6 sm:py-3 sm:text-base"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Partager</span>
        </button>
        <button
          onClick={() => setShowExportDialog(true)}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors active:bg-zinc-300 sm:px-6 sm:py-3 sm:text-base"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Sauvegarder</span>
        </button>
      </div>

      <ExportDialog
        open={showExportDialog}
        name={name}
        format={exportFormat}
        quality={exportQuality}
        saving={saving}
        onNameChange={setName}
        onFormatChange={setExportFormat}
        onQualityChange={setExportQuality}
        onSave={handleSave}
        onClose={() => setShowExportDialog(false)}
      />
    </div>
  );
}
