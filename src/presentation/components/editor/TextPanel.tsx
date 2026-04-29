"use client";

import { Plus, Trash2 } from "lucide-react";
import { TextItem } from "@/domain/entities/Overlay";
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
      <button
        onClick={onAdd}
        className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-white active:bg-zinc-700"
      >
        <Plus className="h-4 w-4" />
        Ajouter un texte
      </button>

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
          <button
            onClick={() => onUpdate(selected.id, { bold: !selected.bold })}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              selected.bold
                ? "bg-white text-black"
                : "border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <span className="text-base font-black">B</span>
            Gras
          </button>

          {/* Delete text */}
          <button
            onClick={() => {
              onDelete(selected.id);
              onSelect(null);
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-500/50 px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 active:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer ce texte
          </button>
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
