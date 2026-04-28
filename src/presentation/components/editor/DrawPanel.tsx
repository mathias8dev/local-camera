"use client";

import { Eraser, Trash2 } from "lucide-react";

const PRESET_COLORS = [
  "#ffffff", "#000000", "#ef4444", "#3b82f6",
  "#22c55e", "#eab308", "#f97316", "#a855f7",
];

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
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Couleur
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onColorChange(c)}
              className={`h-8 w-8 rounded-full border-2 transition-transform active:scale-90 ${
                color === c && !eraser
                  ? "border-white scale-110"
                  : "border-zinc-600"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <label
            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 text-xs font-bold text-white ${
              !PRESET_COLORS.includes(color) && !eraser
                ? "border-white"
                : "border-zinc-600"
            }`}
            style={{
              background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`,
            }}
          >
            <input
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* Brush size */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Taille — {size}px
        </p>
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
