
import { useCallback, useEffect, useRef, useState } from "react";
import { Stroke, Point } from "@/domain/entities/Overlay";
import { getImageDisplayRect } from "@/presentation/utils/canvas";

interface DrawOverlayProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  strokes: Stroke[];
  active: boolean;
  color: string;
  brushSize: number;
  eraser: boolean;
  onStrokeComplete: (stroke: Stroke) => void;
}

function renderStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  w: number,
  h: number,
) {
  ctx.clearRect(0, 0, w, h);
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
    const pts = stroke.points;
    ctx.moveTo(pts[0].x * w, pts[0].y * h);
    if (pts.length === 1) {
      ctx.lineTo(pts[0].x * w + 0.1, pts[0].y * h);
    } else {
      for (let i = 1; i < pts.length - 1; i++) {
        const prev = pts[i];
        const next = pts[i + 1];
        const mx = ((prev.x + next.x) / 2) * w;
        const my = ((prev.y + next.y) / 2) * h;
        ctx.quadraticCurveTo(prev.x * w, prev.y * h, mx, my);
      }
      const last = pts[pts.length - 1];
      ctx.lineTo(last.x * w, last.y * h);
    }
    ctx.stroke();
    ctx.restore();
  }
}

export function DrawOverlay({
  canvasRef,
  strokes,
  active,
  color,
  brushSize,
  eraser,
  onStrokeComplete,
}: DrawOverlayProps) {
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<Point[]>([]);
  const strokesRef = useRef(strokes);
  useEffect(() => { strokesRef.current = strokes; }, [strokes]);

  const [imgDisplay, setImgDisplay] = useState<ReturnType<typeof getImageDisplayRect> | null>(null);

  const updateLayout = useCallback(() => {
    const src = canvasRef.current;
    const dst = drawCanvasRef.current;
    if (!src || !dst) return;
    const disp = getImageDisplayRect(src);
    setImgDisplay(disp);
    dst.style.left = `${disp.left}px`;
    dst.style.top = `${disp.top}px`;
    dst.style.width = `${disp.width}px`;
    dst.style.height = `${disp.height}px`;
    // Match the editor canvas intrinsic resolution for 1:1 pixel compositing
    if (dst.width !== src.width || dst.height !== src.height) {
      dst.width = src.width;
      dst.height = src.height;
    }
    const ctx = dst.getContext("2d");
    if (ctx) renderStrokes(ctx, strokesRef.current, dst.width, dst.height);
  }, [canvasRef]);

  useEffect(() => {
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, [updateLayout]);

  useEffect(() => {
    const src = canvasRef.current;
    if (!src) return;
    const ro = new ResizeObserver(updateLayout);
    ro.observe(src);
    return () => ro.disconnect();
  }, [canvasRef, updateLayout]);

  // Re-render whenever strokes change
  useEffect(() => {
    const dst = drawCanvasRef.current;
    if (!dst) return;
    const ctx = dst.getContext("2d");
    if (ctx) renderStrokes(ctx, strokes, dst.width, dst.height);
  }, [strokes]);

  // ── Pointer handlers ────────────────────────────────────────────────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!active) return;
      e.preventDefault();
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      drawingRef.current = true;
      const rect = drawCanvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pt: Point = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
      currentStrokeRef.current = [pt];
    },
    [active],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!active || !drawingRef.current) return;
      e.preventDefault();
      const rect = drawCanvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pt: Point = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
      currentStrokeRef.current = [...currentStrokeRef.current, pt];
      const dst = drawCanvasRef.current!;
      const ctx = dst.getContext("2d");
      if (!ctx) return;
      // Render committed strokes + the in-progress stroke
      renderStrokes(ctx, [
        ...strokesRef.current,
        { points: currentStrokeRef.current, color, size: brushSize, eraser },
      ], dst.width, dst.height);
    },
    [active, color, brushSize, eraser],
  );

  const finalizeStroke = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!active || !drawingRef.current) return;
      e.preventDefault();
      drawingRef.current = false;
      const points = currentStrokeRef.current;
      currentStrokeRef.current = [];
      if (points.length === 0) return;
      onStrokeComplete({ points, color, size: brushSize, eraser });
    },
    [active, color, brushSize, eraser, onStrokeComplete],
  );

  return (
    <canvas
      ref={drawCanvasRef}
      style={{
        position: "fixed",
        zIndex: 11,
        touchAction: "none",
        pointerEvents: active ? "auto" : "none",
        cursor: active ? (eraser ? "cell" : "crosshair") : "default",
        borderRadius: "0.5rem",
        // width/height/left/top are set imperatively by updateLayout
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finalizeStroke}
      onPointerCancel={finalizeStroke}
    />
  );
}

export { renderStrokes };
