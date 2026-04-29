"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Undo2,
  Redo2,
  SplitSquareHorizontal,
  Wand2,
  Crop,
  Paintbrush,
  Type,
} from "lucide-react";
import { useEditor } from "@/presentation/hooks/useEditor";
import { useImageColors } from "@/presentation/hooks/useImageColors";
import { operationGroups } from "@/data/operations/registry";
import { OperationTabs, groupsToTabs, TabEntry } from "./OperationTabs";
import { OperationPanel } from "./OperationPanel";
import { PresetsPanel } from "./PresetsPanel";
import { CropPanel } from "./CropPanel";
import { CropOverlay } from "./CropOverlay";
import { DrawPanel } from "./DrawPanel";
import { DrawOverlay } from "./DrawOverlay";
import { TextPanel } from "./TextPanel";
import { TextOverlay } from "./TextOverlay";
import { CompareSlider } from "./CompareSlider";
import { ExportDialog } from "@/presentation/components/ui/ExportDialog";
import { Preset } from "@/data/operations/presets";
import { TextItem } from "@/domain/entities/Overlay";
import { ExportFormat } from "@/data/services/ImageRenderer";
import { Button } from "@/presentation/components/ui/Button";
import { Spinner } from "@/presentation/components/ui/Spinner";

const PRESETS_TAB_ID = "presets";
const CROP_TAB_ID = "crop";
const DRAW_TAB_ID = "draw";
const TEXT_TAB_ID = "text";

const presetsTab: TabEntry = {
  id: PRESETS_TAB_ID,
  label: "Presets",
  icon: Wand2,
};

const cropTab: TabEntry = {
  id: CROP_TAB_ID,
  label: "Recadrer",
  icon: Crop,
};

const drawTab: TabEntry = {
  id: DRAW_TAB_ID,
  label: "Dessiner",
  icon: Paintbrush,
};

const textTab: TabEntry = {
  id: TEXT_TAB_ID,
  label: "Texte",
  icon: Type,
};

const allTabs: TabEntry[] = [
  presetsTab,
  cropTab,
  drawTab,
  textTab,
  ...groupsToTabs(operationGroups),
];

export function EditorView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const photoId = searchParams.get("photoId");

  const {
    canvasRef,
    colorSrc,
    values,
    loading,
    error,
    updateParam,
    applyPreset,
    resetAll,
    save,
    undo,
    redo,
    canUndo,
    canRedo,
    comparing,
    originalDataUrl,
    toggleCompare,
    isCropping,
    cropRect,
    setCropRect,
    startCrop,
    cancelCrop,
    applyCrop,
    drawStrokes,
    addStroke,
    clearStrokes,
    textItems,
    addTextItem,
    updateTextItem,
    deleteTextItem,
  } = useEditor(photoId);

  const [activeTabId, setActiveTabId] = useState<string>(PRESETS_TAB_ID);
  const [activePresetId, setActivePresetId] = useState<string | null>("original");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("image/png");
  const [exportQuality, setExportQuality] = useState(85);

  // Crop aspect ratio state
  const [cropAspectRatio, setCropAspectRatio] = useState<number | null>(null);

  // Draw tool state
  const [drawColor, setDrawColor] = useState("#ffffff");
  const [drawSize, setDrawSize] = useState(6);
  const [drawEraser, setDrawEraser] = useState(false);

  // Text tool state
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  const activeGroup = operationGroups.find((g) => g.id === activeTabId);

  const handleTabSelect = (tabId: string) => {
    if (tabId === CROP_TAB_ID) {
      // Enter crop mode when the crop tab is selected.
      startCrop();
    } else if (activeTabId === CROP_TAB_ID && tabId !== CROP_TAB_ID) {
      // Leaving the crop tab without applying — cancel.
      cancelCrop();
    }
    setActiveTabId(tabId);
  };

  const handlePresetSelect = (preset: Preset) => {
    setActivePresetId(preset.id);
    applyPreset(preset);
  };

  const handleApplyCrop = async () => {
    await applyCrop();
    setActiveTabId(PRESETS_TAB_ID);
  };

  const handleCancelCrop = () => {
    cancelCrop();
    setActiveTabId(PRESETS_TAB_ID);
  };

  const handleRotateLeft = () => {
    // Rotate the crop rect -90° within the normalised space.
    if (!cropRect) return;
    // Map (x, y, w, h) to a 90° CCW rotation in [0,1] space.
    // New: x' = y, y' = 1 - x - w, w' = h, h' = w
    const { x, y, width, height } = cropRect;
    setCropRect({
      x: y,
      y: 1 - x - width,
      width: height,
      height: width,
    });
  };

  const handleRotateRight = () => {
    // 90° CW in [0,1] space.
    // New: x' = 1 - y - h, y' = x, w' = h, h' = w
    if (!cropRect) return;
    const { x, y, width, height } = cropRect;
    setCropRect({
      x: 1 - y - height,
      y: x,
      width: height,
      height: width,
    });
  };

  const handleAddText = () => {
    const item: TextItem = {
      id: crypto.randomUUID(),
      text: "Texte",
      x: 0.3,
      y: 0.4,
      fontSize: 48,
      color: "#ffffff",
      bold: false,
    };
    addTextItem(item);
    setSelectedTextId(item.id);
  };

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    const quality = exportFormat !== "image/png" ? exportQuality / 100 : undefined;
    await save(name.trim(), exportFormat, quality);
    setSaving(false);
    router.push("/gallery");
  };

  const bgGradient = useImageColors(colorSrc);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-black">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-black text-white">
        <p className="text-lg">{error}</p>
        <button
          onClick={() => router.push("/gallery")}
          className="rounded-full border-2 border-white px-6 py-3 text-base font-medium transition-colors hover:bg-white/10"
        >
          Retour à la caméra
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-black lg:flex-row">
      {/* Dynamic background gradient from photo colors */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-20 transition-[background-image] duration-700"
        style={{ backgroundImage: bgGradient ?? undefined }}
      />
      <div className="pointer-events-none absolute inset-0 z-0 bg-black/50" />
      {/* Canvas area */}
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col lg:flex-1">
        {/* Header */}
        <div className="relative z-20 flex items-center gap-2 px-[max(0.75rem,env(safe-area-inset-left))] pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 lg:px-4 lg:pb-3">
          <button
            onClick={() => router.push("/gallery")}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900/80 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-zinc-800 active:bg-zinc-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Undo */}
          <button
            onClick={undo}
            disabled={!canUndo}
            aria-label="Annuler"
            className="flex items-center justify-center rounded-full bg-zinc-900/80 p-2 text-white backdrop-blur-sm transition-colors hover:bg-zinc-800 active:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Undo2 className="h-4 w-4" />
          </button>

          {/* Redo */}
          <button
            onClick={redo}
            disabled={!canRedo}
            aria-label="Rétablir"
            className="flex items-center justify-center rounded-full bg-zinc-900/80 p-2 text-white backdrop-blur-sm transition-colors hover:bg-zinc-800 active:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Redo2 className="h-4 w-4" />
          </button>

          {/* Compare toggle */}
          <button
            onClick={toggleCompare}
            aria-label="Comparer avant/après"
            aria-pressed={comparing}
            className={`flex items-center justify-center rounded-full p-2 backdrop-blur-sm transition-colors ${
              comparing
                ? "bg-white text-black"
                : "bg-zinc-900/80 text-white hover:bg-zinc-800 active:bg-zinc-700"
            }`}
          >
            <SplitSquareHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 pb-3">
          <div className="relative flex max-h-full max-w-full">
            <canvas
              ref={canvasRef}
              className="max-h-full max-w-full rounded-lg object-contain"
            />

            {comparing && originalDataUrl && (
              <CompareSlider originalSrc={originalDataUrl} />
            )}
          </div>
        </div>

        {/* Crop overlay */}
        {isCropping && cropRect && (
          <CropOverlay
            canvasRef={canvasRef}
            cropRect={cropRect}
            aspectRatio={cropAspectRatio}
            onChange={setCropRect}
          />
        )}

        {/* Draw overlay — always rendered so strokes are visible, active only on draw tab */}
        <DrawOverlay
          canvasRef={canvasRef}
          strokes={drawStrokes}
          active={activeTabId === DRAW_TAB_ID}
          color={drawColor}
          brushSize={drawSize}
          eraser={drawEraser}
          onStrokeComplete={addStroke}
        />

        {/* Text overlay — always visible when there are text items */}
        {textItems.length > 0 && (
          <TextOverlay
            canvasRef={canvasRef}
            items={textItems}
            selectedId={activeTabId === TEXT_TAB_ID ? selectedTextId : null}
            onUpdate={updateTextItem}
            onSelect={setSelectedTextId}
          />
        )}
      </div>

      {/* Controls panel */}
      <div className="relative z-[1] flex max-h-[40dvh] flex-col border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-sm lg:max-h-none lg:w-80 lg:border-l lg:border-t-0">
        <OperationTabs
          tabs={allTabs}
          activeTabId={activeTabId}
          onSelect={handleTabSelect}
        />

        {activeTabId === PRESETS_TAB_ID ? (
          <PresetsPanel
            activePresetId={activePresetId}
            onSelect={handlePresetSelect}
          />
        ) : activeTabId === CROP_TAB_ID ? (
          <CropPanel
            selectedAspectRatio={cropAspectRatio}
            onAspectRatioChange={setCropAspectRatio}
            onRotateLeft={handleRotateLeft}
            onRotateRight={handleRotateRight}
            onApply={handleApplyCrop}
            onCancel={handleCancelCrop}
          />
        ) : activeTabId === DRAW_TAB_ID ? (
          <DrawPanel
            color={drawColor}
            size={drawSize}
            eraser={drawEraser}
            onColorChange={setDrawColor}
            onSizeChange={setDrawSize}
            onToggleEraser={() => setDrawEraser((v) => !v)}
            onClear={clearStrokes}
          />
        ) : activeTabId === TEXT_TAB_ID ? (
          <TextPanel
            items={textItems}
            selectedId={selectedTextId}
            onAdd={handleAddText}
            onUpdate={updateTextItem}
            onDelete={deleteTextItem}
            onSelect={setSelectedTextId}
          />
        ) : activeGroup ? (
          <OperationPanel
            group={activeGroup}
            values={values}
            onParamChange={updateParam}
            onResetAll={resetAll}
          />
        ) : null}

        <div className="border-t border-zinc-800 px-4 py-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <Button variant="primary" onClick={() => setShowSaveDialog(true)} className="w-full">
            <Download className="h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <ExportDialog
        open={showSaveDialog}
        name={name}
        format={exportFormat}
        quality={exportQuality}
        saving={saving}
        onNameChange={setName}
        onFormatChange={setExportFormat}
        onQualityChange={setExportQuality}
        onSave={handleSave}
        onClose={() => setShowSaveDialog(false)}
      />
    </div>
  );
}
