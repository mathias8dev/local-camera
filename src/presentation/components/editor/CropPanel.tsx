"use client";

import { RotateCcw, RotateCw, Check, X } from "lucide-react";

export interface AspectRatioOption {
  label: string;
  value: number | null; // null = free
}

export const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { label: "Libre",  value: null },
  { label: "1:1",    value: 1 },
  { label: "4:3",    value: 4 / 3 },
  { label: "3:2",    value: 3 / 2 },
  { label: "16:9",   value: 16 / 9 },
  { label: "9:16",   value: 9 / 16 },
];

interface CropPanelProps {
  selectedAspectRatio: number | null;
  onAspectRatioChange: (ratio: number | null) => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onApply: () => void;
  onCancel: () => void;
}

export function CropPanel({
  selectedAspectRatio,
  onAspectRatioChange,
  onRotateLeft,
  onRotateRight,
  onApply,
  onCancel,
}: CropPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 lg:px-5">
      {/* Aspect ratio presets */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Ratio
        </p>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIO_OPTIONS.map((opt) => {
            const active =
              opt.value === selectedAspectRatio ||
              (opt.value === null && selectedAspectRatio === null);
            return (
              <button
                key={opt.label}
                onClick={() => onAspectRatioChange(opt.value)}
                className={`flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors active:scale-95 ${
                  active
                    ? "bg-white text-black"
                    : "border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rotation */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Rotation
        </p>
        <div className="flex gap-3">
          <button
            onClick={onRotateLeft}
            aria-label="Pivoter à gauche (90°)"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-white active:bg-zinc-700"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">−90°</span>
          </button>
          <button
            onClick={onRotateRight}
            aria-label="Pivoter à droite (90°)"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-white active:bg-zinc-700"
          >
            <RotateCw className="h-4 w-4" />
            <span className="hidden sm:inline">+90°</span>
          </button>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Apply / Cancel */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-white active:bg-zinc-700"
        >
          <X className="h-4 w-4" />
          Annuler
        </button>
        <button
          onClick={onApply}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 active:bg-zinc-300"
        >
          <Check className="h-4 w-4" />
          Appliquer
        </button>
      </div>
    </div>
  );
}
