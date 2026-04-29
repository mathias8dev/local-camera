"use client";

import { Eraser, Trash2 } from "lucide-react";
import { ColorPicker } from "@/presentation/components/ui/ColorPicker";
import { SectionLabel } from "@/presentation/components/ui/SectionLabel";

interface DrawPanelProps {
  color: string;
  size: number;
  eraser: boolean;
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onToggleEraser: () => void;
  onClear: () => void;
}

export function DrawPanel({
  color,
  size,
  eraser,
  onColorChange,
  onSizeChange,
  onToggleEraser,
  onClear,
}: DrawPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 lg:px-5">
      {/* Color picker */}
      <div className="flex flex-col gap-2">
        <SectionLabel>Couleur</SectionLabel>
        <ColorPicker value={color} onChange={onColorChange} inactive={eraser} />
      </div>

      {/* Brush size */}
      <div className="flex flex-col gap-2">
        <SectionLabel>Taille — {size}px</SectionLabel>
        <input
          type="range"
          min={2}
          max={20}
          step={1}
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="w-full accent-white"
        />
      </div>

      {/* Eraser toggle */}
      <button
        onClick={onToggleEraser}
        className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
          eraser
            ? "bg-white text-black"
            : "border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
        }`}
      >
        <Eraser className="h-4 w-4" />
        Gomme
      </button>

      <div className="flex-1" />

      {/* Clear all */}
      <button
        onClick={onClear}
        className="flex items-center justify-center gap-2 rounded-xl border border-red-500/50 px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 active:bg-red-500/20"
      >
        <Trash2 className="h-4 w-4" />
        Tout effacer
      </button>
    </div>
  );
}
