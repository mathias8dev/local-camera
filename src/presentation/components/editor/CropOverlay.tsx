
import { useCallback, useEffect, useRef, useState } from "react";

export interface CropRect {
  x: number; // normalized 0–1 relative to image width
  y: number; // normalized 0–1 relative to image height
  width: number;
  height: number;
}

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cropRect: CropRect;
  aspectRatio: number | null; // null = free
  onChange: (rect: CropRect) => void;
}

type Handle =
  | "tl" | "tc" | "tr"
  | "ml" |          "mr"
  | "bl" | "bc" | "br"
  | "move";

const MIN_SIZE = 0.02; // minimum 2% of image dimension

/** Map a handle name to the deltas it applies when dragging. */
function applyHandleDrag(
  handle: Handle,
  rect: CropRect,
  dx: number,  // normalized deltas
  dy: number,
  aspectRatio: number | null,
): CropRect {
  let { x, y, width, height } = rect;

  if (handle === "move") {
    x = Math.max(0, Math.min(1 - width, x + dx));
    y = Math.max(0, Math.min(1 - height, y + dy));
    return { x, y, width, height };
  }

  // Determine which edges move
  const moveLeft = handle === "tl" || handle === "ml" || handle === "bl";
  const moveRight = handle === "tr" || handle === "mr" || handle === "br";
  const moveTop = handle === "tl" || handle === "tc" || handle === "tr";
  const moveBottom = handle === "bl" || handle === "bc" || handle === "br";

  let newX = x;
  let newY = y;
  let newW = width;
  let newH = height;

  if (moveLeft) {
    newX = x + dx;
    newW = width - dx;
  }
  if (moveRight) {
    newW = width + dx;
  }
  if (moveTop) {
    newY = y + dy;
    newH = height - dy;
  }
  if (moveBottom) {
    newH = height + dy;
  }

  // Enforce aspect ratio
  if (aspectRatio !== null) {
    // Determine which axis is "primary" based on handle direction
    const isCorner = moveLeft || moveRight;
    if (isCorner || moveLeft || moveRight) {
      // Use width as primary, adjust height
      newH = newW / aspectRatio;
      if (moveTop) {
        newY = y + height - newH;
      }
    } else {
      // Edge-only vertical: use height as primary
      newW = newH * aspectRatio;
    }
  }

  // Clamp
  if (newW < MIN_SIZE) {
    if (moveLeft) newX = x + width - MIN_SIZE;
    newW = MIN_SIZE;
  }
  if (newH < MIN_SIZE) {
    if (moveTop) newY = y + height - MIN_SIZE;
    newH = MIN_SIZE;
  }
  if (newX < 0) { newW += newX; newX = 0; }
  if (newY < 0) { newH += newY; newY = 0; }
  if (newX + newW > 1) newW = 1 - newX;
  if (newY + newH > 1) newH = 1 - newY;

  return { x: newX, y: newY, width: newW, height: newH };
}

/**
 * Returns the canvas display rect accounting for object-contain letterboxing.
 * The canvas element may have CSS dimensions that differ from its pixel buffer;
 * object-contain means the image is centered with bars on either side.
 */
function getImageDisplayRect(canvas: HTMLCanvasElement): {
  left: number; top: number; width: number; height: number;
} {
  const elRect = canvas.getBoundingClientRect();
  const elW = elRect.width;
  const elH = elRect.height;
  const imgAspect = canvas.width / canvas.height;
  const elAspect = elW / elH;

  let imgW: number, imgH: number;
  if (imgAspect > elAspect) {
    // letterbox top/bottom
    imgW = elW;
    imgH = elW / imgAspect;
  } else {
    // letterbox left/right
    imgH = elH;
    imgW = elH * imgAspect;
  }

  return {
    left: elRect.left + (elW - imgW) / 2,
    top: elRect.top + (elH - imgH) / 2,
    width: imgW,
    height: imgH,
  };
}

const HANDLE_SIZE = 12; // px, visual square
const HANDLE_HIT = 44; // px, touch target

export function CropOverlay({ canvasRef, cropRect, aspectRatio, onChange }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    handle: Handle;
    startX: number;
    startY: number;
    startRect: CropRect;
    imgDisplay: ReturnType<typeof getImageDisplayRect>;
  } | null>(null);

  // Keep a ref to aspectRatio so pointer move handler is never stale
  const aspectRatioRef = useRef(aspectRatio);
  useEffect(() => { aspectRatioRef.current = aspectRatio; }, [aspectRatio]);

  const cropRectRef = useRef(cropRect);
  useEffect(() => { cropRectRef.current = cropRect; }, [cropRect]);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // ── Pointer handling ────────────────────────────────────────────────────────

  const handlePointerDown = useCallback((handle: Handle, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imgDisplay = getImageDisplayRect(canvas);
    dragRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...cropRectRef.current },
      imgDisplay,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [canvasRef]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (e.clientX - drag.startX) / drag.imgDisplay.width;
    const dy = (e.clientY - drag.startY) / drag.imgDisplay.height;
    const next = applyHandleDrag(drag.handle, drag.startRect, dx, dy, aspectRatioRef.current);
    onChangeRef.current(next);
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // ── Layout: position the overlay to match the canvas ────────────────────────

  const [imgDisplay, setImgDisplay] = useState<ReturnType<typeof getImageDisplayRect> | null>(null);

  useEffect(() => {
    const updateLayout = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setImgDisplay(getImageDisplayRect(canvas));
    };
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, [canvasRef]);

  // Re-measure whenever the canvas changes (e.g. after image loads)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      setImgDisplay(getImageDisplayRect(canvas));
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [canvasRef]);

  if (!imgDisplay) return null;

  // ── Convert normalized crop rect → screen pixels ─────────────────────────

  const cr = cropRect;
  const boxLeft   = imgDisplay.left + cr.x * imgDisplay.width;
  const boxTop    = imgDisplay.top  + cr.y * imgDisplay.height;
  const boxWidth  = cr.width  * imgDisplay.width;
  const boxHeight = cr.height * imgDisplay.height;

  // Build the darkened surround using a clip-path with a rectangular hole.
  // We use SVG clip-path technique: fill entire viewport, subtract the crop box.
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Outer rect covers viewport; inner rect is the crop hole
  const outerRect = `0 0, ${vw}px 0, ${vw}px ${vh}px, 0 ${vh}px, 0 0`;
  const innerRect = [
    `${boxLeft}px ${boxTop}px`,
    `${boxLeft + boxWidth}px ${boxTop}px`,
    `${boxLeft + boxWidth}px ${boxTop + boxHeight}px`,
    `${boxLeft}px ${boxTop + boxHeight}px`,
    `${boxLeft}px ${boxTop}px`,
  ].join(", ");

  const clipPath = `polygon(evenodd, ${outerRect}, ${innerRect})`;

  // ── Handles ──────────────────────────────────────────────────────────────

  interface HandleSpec {
    id: Handle;
    style: React.CSSProperties;
    cursor: string;
  }

  const hs = HANDLE_SIZE;
  const hh = HANDLE_HIT;

  // Helper: handle spec with visual center and hit target
  const mkHandle = (
    id: Handle,
    left: number,
    top: number,
    cursor: string,
  ): HandleSpec => ({
    id,
    cursor,
    style: {
      position: "fixed",
      left: left - hh / 2,
      top: top - hh / 2,
      width: hh,
      height: hh,
      cursor,
      touchAction: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  });

  const cx = boxLeft + boxWidth / 2;
  const cy = boxTop + boxHeight / 2;
  const r  = boxLeft + boxWidth;
  const b  = boxTop + boxHeight;

  const handles: HandleSpec[] = [
    mkHandle("tl", boxLeft, boxTop,    "nw-resize"),
    mkHandle("tc", cx,      boxTop,    "n-resize"),
    mkHandle("tr", r,       boxTop,    "ne-resize"),
    mkHandle("ml", boxLeft, cy,        "w-resize"),
    mkHandle("mr", r,       cy,        "e-resize"),
    mkHandle("bl", boxLeft, b,         "sw-resize"),
    mkHandle("bc", cx,      b,         "s-resize"),
    mkHandle("br", r,       b,         "se-resize"),
  ];

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      {/* Darkened surround */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          clipPath,
          pointerEvents: "none",
        }}
      />

      {/* Crop box border */}
      <div
        style={{
          position: "fixed",
          left: boxLeft,
          top: boxTop,
          width: boxWidth,
          height: boxHeight,
          border: "2px solid rgba(255,255,255,0.9)",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      >
        {/* Rule-of-thirds grid lines */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
          <div style={{ position: "absolute", left: "33.33%", top: 0, bottom: 0, borderLeft: "1px solid white" }} />
          <div style={{ position: "absolute", left: "66.66%", top: 0, bottom: 0, borderLeft: "1px solid white" }} />
          <div style={{ position: "absolute", top: "33.33%", left: 0, right: 0, borderTop: "1px solid white" }} />
          <div style={{ position: "absolute", top: "66.66%", left: 0, right: 0, borderTop: "1px solid white" }} />
        </div>
      </div>

      {/* Drag-to-move target (the crop box interior) */}
      <div
        style={{
          position: "fixed",
          left: boxLeft,
          top: boxTop,
          width: boxWidth,
          height: boxHeight,
          cursor: "move",
          pointerEvents: "auto",
          touchAction: "none",
        }}
        onPointerDown={(e) => handlePointerDown("move", e)}
      />

      {/* Resize handles */}
      {handles.map((h) => (
        <div
          key={h.id}
          style={{ ...h.style, pointerEvents: "auto" }}
          onPointerDown={(e) => handlePointerDown(h.id, e)}
        >
          <div
            style={{
              width: hs,
              height: hs,
              background: "white",
              borderRadius: 2,
              boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
            }}
          />
        </div>
      ))}
    </div>
  );
}
