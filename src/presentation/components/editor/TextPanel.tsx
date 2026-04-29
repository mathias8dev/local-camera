"use client";

import { Plus, Trash2 } from "lucide-react";
import { TextItem } from "@/domain/entities/Overlay";
import { Button } from "@/presentation/components/ui/Button";
import { ColorPicker } from "@/presentation/components/ui/ColorPicker";
import { SectionLabel } from "@/presentation/components/ui/SectionLabel";

interface TextPanelProps {
  items: TextItem[];
  selectedId: string | null;
  onAdd: () => void;
  onUpdate: (id: string, partial: Partial<TextItem>) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string | null) => void;
}

export function TextPanel({
  items,
  selectedId,
  onAdd,
  onUpdate,
  onDelete,
  onSelect,
}: TextPanelProps) {
  const selected = items.find((i) => i.id === selectedId);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 lg:px-5">
      {/* Add button */}
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Ajouter un texte
      </Button>

      {selected && (
        <>
          {/* Text input */}
          <div className="flex flex-col gap-2">
            <SectionLabel>Texte</SectionLabel>
            <input
              type="text"
              value={selected.text}
              onChange={(e) => onUpdate(selected.id, { text: e.target.value })}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
              placeholder="Votre texte..."
            />
          </div>

          {/* Font size */}
          <div className="flex flex-col gap-2">
            <SectionLabel>Taille — {selected.fontSize}px</SectionLabel>
            <input
              type="range"
              min={12}
              max={120}
              step={1}
              value={selected.fontSize}
              onChange={(e) =>
                onUpdate(selected.id, { fontSize: Number(e.target.value) })
              }
              className="w-full accent-white"
            />
          </div>

          {/* Color */}
          <div className="flex flex-col gap-2">
            <SectionLabel>Couleur</SectionLabel>
            <ColorPicker
              value={selected.color}
              onChange={(c) => onUpdate(selected.id, { color: c })}
            />
          </div>

          {/* Bold toggle */}
          <Button
            variant="toggle"
            active={selected.bold}
            onClick={() => onUpdate(selected.id, { bold: !selected.bold })}
          >
            <span className="text-base font-black">B</span>
            Gras
          </Button>

          {/* Delete text */}
          <Button
            variant="danger"
            onClick={() => {
              onDelete(selected.id);
              onSelect(null);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer ce texte
          </Button>
        </>
      )}

      {/* Item list */}
      {items.length > 0 && (
        <div className="flex flex-col gap-1">
          <SectionLabel>Textes</SectionLabel>
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`truncate rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                item.id === selectedId
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {item.text || "(vide)"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
