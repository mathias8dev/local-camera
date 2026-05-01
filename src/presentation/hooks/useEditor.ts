"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fileStorage, mediaRepository } from "@/data/instances";
import { OperationValues } from "@/domain/entities/EditorOperation";
import { MediaItem } from "@/domain/entities/MediaItem";
import { allOperations, defaultValues } from "@/data/operations/registry";
import { renderImage, exportCanvas, ExportFormat } from "@/data/services/ImageRenderer";
import { Preset } from "@/data/operations/presets";
import { CropRect } from "@/presentation/components/editor/CropOverlay";
import { Stroke, TextItem } from "@/domain/entities/Overlay";

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
  const mountedRef = useRef(true);
  const [values, setValues] = useState<OperationValues>({ ...defaultValues });
  const valuesRef = useRef<OperationValues>(values);

  const [imageReady, setImageReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [colorSrc, setColorSrc] = useState<string | null>(null);
  const [drawTrigger, setDrawTrigger] = useState(0);

  // Undo / redo stacks — each entry is a full OperationValues snapshot.
  const undoStackRef = useRef<OperationValues[]>([]);
  const redoStackRef = useRef<OperationValues[]>([]);
  // Reactive availability flags — updated whenever stacks change.
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Compare slider state.
  const [comparing, setComparing] = useState(false);
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);

  // Crop state
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const intermediateFileIdRef = useRef<string | null>(null);

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
    return () => {
      mountedRef.current = false;
      if (intermediateFileIdRef.current) {
        fileStorage.delete(intermediateFileIdRef.current);
        intermediateFileIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!photoId) {
      setError("Aucune photo à éditer.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    fileStorage.get(photoId).then((blob) => {
      if (cancelled) return;
      if (!blob) {
        setError("Photo introuvable.");
        setLoading(false);
        return;
      }
      const thumbUrl = URL.createObjectURL(blob);
      setColorSrc(thumbUrl);
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        imageRef.current = img;
        setImageReady(true);
        setLoading(false);
      };
      img.onerror = () => {
        if (cancelled) return;
        URL.revokeObjectURL(thumbUrl);
        setError("Impossible de charger l'image.");
        setLoading(false);
      };
      img.src = thumbUrl;
    });
    return () => {
      cancelled = true;
      setColorSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
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
    draw();
  }, [draw]);

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

  const toggleCompare = useCallback(() => {
    setComparing((prev) => {
      if (prev) {
        setOriginalDataUrl(null);
        return false;
      }
      const img = imageRef.current;
      if (!img) return false;
      const offscreen = document.createElement("canvas");
      renderImage(offscreen, img, allOperations, defaultValues);
      setOriginalDataUrl(offscreen.toDataURL("image/jpeg", 0.85));
      return true;
    });
  }, []);

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
  const computeCrop = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !cropRect) return null;

    renderImage(canvas, img, allOperations, valuesRef.current);

    const srcX = Math.round(cropRect.x * canvas.width);
    const srcY = Math.round(cropRect.y * canvas.height);
    const srcW = Math.max(1, Math.round(cropRect.width * canvas.width));
    const srcH = Math.max(1, Math.round(cropRect.height * canvas.height));

    const out = document.createElement("canvas");
    out.width  = srcW;
    out.height = srcH;
    const outCtx = out.getContext("2d")!;
    outCtx.drawImage(canvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

    const blob = await exportCanvas(out);
    out.width = 0;
    out.height = 0;
    return blob;
  }, [canvasRef, cropRect]);

  const reloadSource = useCallback(async (blob: Blob) => {
    if (intermediateFileIdRef.current) {
      await fileStorage.delete(intermediateFileIdRef.current);
    }
    const newId = crypto.randomUUID();
    intermediateFileIdRef.current = newId;
    await fileStorage.save(newId, blob);

    const newImg = new Image();
    const blobUrl = URL.createObjectURL(blob);
    newImg.onload = () => {
      URL.revokeObjectURL(blobUrl);
      if (!mountedRef.current) return;
      imageRef.current = newImg;
      undoStackRef.current = [];
      redoStackRef.current = [];
      setCanUndo(false);
      setCanRedo(false);
      applyValues({ ...defaultValues });
      setIsCropping(false);
      setCropRect(null);
      setDrawTrigger((n) => n + 1);
    };
    newImg.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      fileStorage.delete(newId);
      if (intermediateFileIdRef.current === newId) {
        intermediateFileIdRef.current = null;
      }
    };
    newImg.src = blobUrl;
  }, [applyValues]);

  const applyCrop = useCallback(async () => {
    const blob = await computeCrop();
    if (blob) await reloadSource(blob);
  }, [computeCrop, reloadSource]);

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
    async (name: string, format: ExportFormat = "image/png", quality?: number): Promise<Blob | null> => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      draw();

      const composite = document.createElement("canvas");
      composite.width = canvas.width;
      composite.height = canvas.height;
      const ctx = composite.getContext("2d")!;

      ctx.drawImage(canvas, 0, 0);
      compositeStrokes(ctx, drawStrokesRef.current, composite.width, composite.height);
      compositeText(ctx, textItemsRef.current, composite.width, composite.height);

      const savedW = composite.width;
      const savedH = composite.height;
      const blob = await exportCanvas(composite, format, quality);
      composite.width = 0;
      composite.height = 0;
      const photo: MediaItem = {
        id: crypto.randomUUID(),
        name,
        width: savedW,
        height: savedH,
        createdAt: new Date(),
        type: "photo",
        mimeType: format,
      };
      await mediaRepository.save(photo, blob);
      if (photoId) await fileStorage.delete(photoId);

      if (intermediateFileIdRef.current) {
        await fileStorage.delete(intermediateFileIdRef.current);
        intermediateFileIdRef.current = null;
      }
      return blob;
    },
    [draw, photoId],
  );

  return {
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
