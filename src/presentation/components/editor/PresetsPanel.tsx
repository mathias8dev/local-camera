"use client";

import { presets, Preset } from "@/data/operations/presets";
import { Button } from "@/presentation/components/ui/Button";

interface PresetsPanelProps {
  activePresetId: string | null;
  onSelect: (preset: Preset) => void;
}

export function PresetsPanel({ activePresetId, onSelect }: PresetsPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-3 lg:gap-4 lg:px-5 lg:py-4">
      <p className="text-xs text-zinc-500">
        Tap a preset to apply it instantly. Combine with manual adjustments for
        a custom look.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
        {presets.map((preset) => (
          <Button
            key={preset.id}
            variant="toggle"
            active={preset.id === activePresetId}
            onClick={() => onSelect(preset)}
            className="active:scale-95"
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
