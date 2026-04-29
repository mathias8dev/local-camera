"use client";

import { RotateCcw, RotateCw, Check, X } from "lucide-react";
import { Button } from "@/presentation/components/ui/Button";
import { SectionLabel } from "@/presentation/components/ui/SectionLabel";

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
        <SectionLabel>
          Ratio
        </SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIO_OPTIONS.map((opt) => {
            const isActive =
              opt.value === selectedAspectRatio ||
              (opt.value === null && selectedAspectRatio === null);
            return (
              <Button
                key={opt.label}
                variant="toggle"
                active={isActive}
                onClick={() => onAspectRatioChange(opt.value)}
                className="active:scale-95"
              >
                {opt.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Rotation */}
      <div className="flex flex-col gap-2">
        <SectionLabel>
          Rotation
        </SectionLabel>
        <div className="flex gap-3">
          <Button onClick={onRotateLeft} aria-label="Pivoter à gauche (90°)" className="flex-1">
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">−90°</span>
          </Button>
          <Button onClick={onRotateRight} aria-label="Pivoter à droite (90°)" className="flex-1">
            <RotateCw className="h-4 w-4" />
            <span className="hidden sm:inline">+90°</span>
          </Button>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Apply / Cancel */}
      <div className="flex gap-3">
        <Button onClick={onCancel} className="flex-1">
          <X className="h-4 w-4" />
          Annuler
        </Button>
        <Button variant="primary" onClick={onApply} className="flex-1">
          <Check className="h-4 w-4" />
          Appliquer
        </Button>
      </div>
    </div>
  );
}
