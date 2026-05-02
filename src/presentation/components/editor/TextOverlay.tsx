
import { useCallback, useEffect, useRef, useState } from "react";
import { TextItem } from "@/domain/entities/Overlay";
import { getImageDisplayRect } from "@/presentation/utils/canvas";

interface TextOverlayProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  items: TextItem[];
  selectedId: string | null;
  onUpdate: (id: string, partial: Partial<TextItem>) => void;
  onSelect: (id: string | null) => void;
}

export function TextOverlay({
  canvasRef,
  items,
  selectedId,
  onUpdate,
  onSelect,
}: TextOverlayProps) {
  const [imgDisplay, setImgDisplay] = useState<ReturnType<
    typeof getImageDisplayRect
  > | null>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    startNormX: number;
    startNormY: number;
  } | null>(null);

  const updateLayout = useCallback(() => {
    const src = canvasRef.current;
    if (!src) return;
    setImgDisplay(getImageDisplayRect(src));
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

  const handlePointerDown = useCallback(
    (id: string, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onSelect(id);
      const item = items.find((i) => i.id === id);
      if (!item) return;
      dragRef.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        startNormX: item.x,
        startNormY: item.y,
      };
    },
    [items, onSelect],
  );

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || !imgDisplay) return;
      const dx = (e.clientX - drag.startX) / imgDisplay.width;
      const dy = (e.clientY - drag.startY) / imgDisplay.height;
      const nx = Math.max(0, Math.min(1, drag.startNormX + dx));
      const ny = Math.max(0, Math.min(1, drag.startNormY + dy));
      onUpdate(drag.id, { x: nx, y: ny });
    };
    const handleUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [imgDisplay, onUpdate]);

  if (!imgDisplay) return null;

  const scaleX = imgDisplay.width / (canvasRef.current?.width ?? 1);

  return (
    <div
      style={{
        position: "fixed",
        left: imgDisplay.left,
        top: imgDisplay.top,
        width: imgDisplay.width,
        height: imgDisplay.height,
        zIndex: 12,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {items.map((item) => {
        const displayFontSize = item.fontSize * scaleX;
        return (
          <div
            key={item.id}
            style={{
              position: "absolute",
              left: `${item.x * 100}%`,
              top: `${item.y * 100}%`,
              color: item.color,
              fontSize: displayFontSize,
              fontWeight: item.bold ? 700 : 400,
              fontFamily: "sans-serif",
              cursor: "move",
              pointerEvents: "auto",
              touchAction: "none",
              userSelect: "none",
              textShadow: "0 1px 4px rgba(0,0,0,0.7)",
              whiteSpace: "nowrap",
              outline:
                item.id === selectedId
                  ? "2px dashed rgba(255,255,255,0.7)"
                  : "none",
              outlineOffset: 4,
              padding: 4,
            }}
            onPointerDown={(e) => handlePointerDown(item.id, e)}
          >
            {item.text || " "}
          </div>
        );
      })}
    </div>
  );
}
