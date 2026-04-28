"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IndexedDBFileStorage } from "@/data/storage/IndexedDBFileStorage";
import { IndexedDBPhotoRepository } from "@/data/repositories/IndexedDBPhotoRepository";
import { OperationValues } from "@/domain/entities/EditorOperation";
import { Photo } from "@/domain/entities/Photo";
import { allOperations, defaultValues } from "@/data/operations/registry";
import { renderImage, exportCanvas } from "@/data/services/ImageRenderer";
import { Preset } from "@/data/operations/presets";
import { CropRect } from "@/presentation/components/editor/CropOverlay";
import { Stroke, TextItem } from "@/domain/entities/Overlay";

const fileStorage = new IndexedDBFileStorage();
const photoRepository = new IndexedDBPhotoRepository(fileStorage);

/** Draw all strokes onto a canvas context using normalized coordinates. */
function compositeStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  canvasW: number,
  canvasH: number,
) {
  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;
    ctx.save();
    if (stroke.eraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = stroke.color;
    }
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    const first = stroke.points[0];
    ctx.moveTo(first.x * canvasW, first.y * canvasH);
    if (stroke.points.length === 1) {
      ctx.lineTo(first.x * canvasW + 0.1, first.y * canvasH);
    } else {
      for (let i = 1; i < stroke.points.length - 1; i++) {
        const curr = stroke.points[i];
        const next = stroke.points[i + 1];
        const mx = ((curr.x + next.x) / 2) * canvasW;
        const my = ((curr.y + next.y) / 2) * canvasH;
        ctx.quadraticCurveTo(curr.x * canvasW, curr.y * canvasH, mx, my);
      }
      const last = stroke.points[stroke.points.length - 1];
      ctx.lineTo(last.x * canvasW, last.y * canvasH);
    }
    ctx.stroke();
    ctx.restore();
  }
}

/** Draw all text items onto a canvas context using normalized coordinates. */
function compositeText(
  ctx: CanvasRenderingContext2D,
  items: TextItem[],
  canvasW: number,
  canvasH: number,
) {
  for (const item of items) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    const weight = item.bold ? "bold" : "normal";
    ctx.font = `${weight} ${item.fontSize}px sans-serif`;
    ctx.fillStyle = item.color;
    ctx.textBaseline = "top";
    ctx.fillText(item.text, item.x * canvasW, item.y * canvasH);
    ctx.restore();
  }
}

export function useEditor(photoId: string | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [values, setValues] = useState<OperationValues>({ ...defaultValues });
  // Always-current mirror of `values` so callbacks can read it without
  // becoming stale or triggering extra re-renders.
  const valuesRef = useRef<OperationValues>(values);

  const [imageReady, setImageReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Incremented to force a redraw without changing operation values.
  const [drawTrigger, setDrawTrigger] = useState(0);

  // Undo / redo stacks — each entry is a full OperationValues snapshot.
  const undoStackRef = useRef<OperationValues[]>([]);
  const redoStackRef = useRef<OperationValues[]>([]);
  // Reactive availability flags — updated whenever stacks change.
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Compare toggle — when true the canvas renders with default values.
  const [comparing, setComparing] = useState(false);

  // Crop state
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);

  // ── Overlay state ──────────────────────────────────────────────────────────
  const [drawStrokes, setDrawStrokes] = useState<Stroke[]>([]);
  const drawStrokesRef = useRef<Stroke[]>([]);

  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const textItemsRef = useRef<TextItem[]>([]);

  /** Keep the ref in sync with state. */
  const applyValues = useCallback((next: OperationValues) => {
    valuesRef.current = next;
    setValues(next);
  }, []);

  /** Update reactive stack-availability flags. */
  const syncFlags = useCallback(() => {
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, []);

  useEffect(() => {
    if (!photoId) {
      setError("Aucune photo à éditer.");
      setLoading(false);
      return;
    }
    fileStorage.get(photoId).then((blob) => {
      if (!blob) {
        setError("Photo introuvable.");
        setLoading(false);
        return;
      }
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setImageReady(true);
        setLoading(false);
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(blob);
    });
  }, [photoId]);

  const draw = useCallback(
    (overrideValues?: OperationValues) => {
      const canvas = canvasRef.current;
      const img = imageRef.current;
      if (!canvas || !img) return;
      renderImage(canvas, img, allOperations, overrideValues ?? values);
    },
    [values, imageReady, drawTrigger], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    draw(comparing ? defaultValues : undefined);
  }, [draw, comparing]);

  const updateParam = useCallback(
    (operationId: string, paramKey: string, value: number) => {
      const snapshot = valuesRef.current;
      undoStackRef.current = [...undoStackRef.current, snapshot];
      redoStackRef.current = [];
      const next: OperationValues = {
        ...snapshot,
        [operationId]: { ...snapshot[operationId], [paramKey]: value },
      };
      applyValues(next);
      syncFlags();
    },
    [applyValues, syncFlags],
  );

  const applyPreset = useCallback(
    (preset: Preset) => {
      const snapshot = valuesRef.current;
      undoStackRef.current = [...undoStackRef.current, snapshot];
      redoStackRef.current = [];
      // Start from defaults then overlay preset values.
      const next: OperationValues = { ...defaultValues };
      for (const [opId, opVals] of Object.entries(preset.values)) {
        next[opId] = { ...defaultValues[opId], ...opVals };
      }
      applyValues(next);
      syncFlags();
    },
    [applyValues, syncFlags],
  );

  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const previous = undoStackRef.current[undoStackRef.current.length - 1];
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    redoStackRef.current = [valuesRef.current, ...redoStackRef.current];
    applyValues(previous);
    syncFlags();
  }, [applyValues, syncFlags]);

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current[0];
    redoStackRef.current = redoStackRef.current.slice(1);
    undoStackRef.current = [...undoStackRef.current, valuesRef.current];
    applyValues(next);
    syncFlags();
  }, [applyValues, syncFlags]);

  const resetAll = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
    applyValues({ ...defaultValues });
  }, [applyValues]);

  // ── Crop actions ─────────────────────────────────────────────────────────

  /** Enter crop mode; the overlay initialises to the full image. */
  const startCrop = useCallback(() => {
    setIsCropping(true);
    setCropRect({ x: 0, y: 0, width: 1, height: 1 });
  }, []);

  /** Discard the crop selection and leave crop mode. */
  const cancelCrop = useCallback(() => {
    setIsCropping(false);
    setCropRect(null);
  }, []);

  /**
   * Commit the crop: render the current canvas into a new off-screen canvas
   * limited to the crop rectangle, export it as a blob, store it, and reload
   * the editor with the new image so all subsequent edits start from the
   * cropped source.
   */
  const applyCrop = useCallback(async () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !cropRect) return;

    // Re-render to ensure the canvas is up to date.
    renderImage(canvas, img, allOperations, valuesRef.current);

    // Compute the pixel crop region from normalized coords.
    const srcX = Math.round(cropRect.x * canvas.width);
    const srcY = Math.round(cropRect.y * canvas.height);
    const srcW = Math.max(1, Math.round(cropRect.width * canvas.width));
    const srcH = Math.max(1, Math.round(cropRect.height * canvas.height));

    // Draw the cropped region to a new canvas.
    const out = document.createElement("canvas");
    out.width  = srcW;
    out.height = srcH;
    const outCtx = out.getContext("2d")!;
    outCtx.drawImage(canvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

    // Export and store the new blob.
    const blob = await exportCanvas(out);
    const newId = crypto.randomUUID();
    await fileStorage.save(newId, blob);

    // Load the cropped image as the new source and reset edit values.
    const newImg = new Image();
    newImg.onload = () => {
      imageRef.current = newImg;
      // Reset operation values so edits are relative to new image.
      undoStackRef.current = [];
      redoStackRef.current = [];
      setCanUndo(false);
      setCanRedo(false);
      applyValues({ ...defaultValues });
      setIsCropping(false);
      setCropRect(null);
      // Trigger a redraw via the drawTrigger dependency.
      setDrawTrigger((n) => n + 1);
      URL.revokeObjectURL(newImg.src);
    };
    newImg.src = URL.createObjectURL(blob);
  }, [canvasRef, cropRect, applyValues]);

  // ── Draw stroke actions ────────────────────────────────────────────────────

  const addStroke = useCallback((stroke: Stroke) => {
    const next = [...drawStrokesRef.current, stroke];
    drawStrokesRef.current = next;
    setDrawStrokes(next);
  }, []);

  const clearStrokes = useCallback(() => {
    drawStrokesRef.current = [];
    setDrawStrokes([]);
  }, []);

  const undoLastStroke = useCallback(() => {
    const next = drawStrokesRef.current.slice(0, -1);
    drawStrokesRef.current = next;
    setDrawStrokes(next);
  }, []);

  // ── Text item actions ──────────────────────────────────────────────────────

  const addTextItem = useCallback((item: TextItem) => {
    const next = [...textItemsRef.current, item];
    textItemsRef.current = next;
    setTextItems(next);
  }, []);

  const updateTextItem = useCallback((id: string, partial: Partial<TextItem>) => {
    const next = textItemsRef.current.map((t) =>
      t.id === id ? { ...t, ...partial } : t,
    );
    textItemsRef.current = next;
    setTextItems(next);
  }, []);

  const deleteTextItem = useCallback((id: string) => {
    const next = textItemsRef.current.filter((t) => t.id !== id);
    textItemsRef.current = next;
    setTextItems(next);
  }, []);

  // ── Save (composite everything) ────────────────────────────────────────────

  const save = useCallback(
    async (name: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // 1. Render base image with filters/transforms onto the editor canvas.
      draw();

      // 2. Create an off-screen canvas for compositing.
      const composite = document.createElement("canvas");
      composite.width = canvas.width;
      composite.height = canvas.height;
      const ctx = composite.getContext("2d")!;

      // 3. Draw the rendered base image.
      ctx.drawImage(canvas, 0, 0);

      // 4. Composite drawing strokes.
      compositeStrokes(ctx, drawStrokesRef.current, composite.width, composite.height);

      // 5. Composite text items.
      compositeText(ctx, textItemsRef.current, composite.width, composite.height);

      // 6. Export and save.
      const blob = await exportCanvas(composite);
      const photo: Photo = {
        id: crypto.randomUUID(),
        name,
        width: composite.width,
        height: composite.height,
        createdAt: new Date(),
      };
      await photoRepository.save(photo, blob);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name}.png`;
      link.click();
      URL.revokeObjectURL(url);
      if (photoId) await fileStorage.delete(photoId);
    },
    [draw, photoId],
  );

  return {
    canvasRef,
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
    setComparing,
    // crop
    isCropping,
    cropRect,
    setCropRect,
    startCrop,
    cancelCrop,
    applyCrop,
    // draw overlay
    drawStrokes,
    addStroke,
    clearStrokes,
    undoLastStroke,
    // text overlay
    textItems,
    addTextItem,
    updateTextItem,
    deleteTextItem,
  };
}
