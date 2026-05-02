
import { useCallback, useRef, useState } from "react";

interface CompareSliderProps {
  originalSrc: string;
}

export function CompareSlider({ originalSrc }: CompareSliderProps) {
  const [position, setPosition] = useState(50);
  const draggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    setPosition(Math.max(0, Math.min(100, (x / rect.width) * 100)));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      draggingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      updatePosition(e.clientX);
    },
    [updatePosition],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      updatePosition(e.clientX);
    },
    [updatePosition],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-5"
      style={{ touchAction: "none", cursor: "ew-resize" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <img
        src={originalSrc}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full rounded-lg"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />

      <div
        className="pointer-events-none absolute top-0 bottom-0"
        style={{
          left: `${position}%`,
          width: 2,
          transform: "translateX(-1px)",
          background: "white",
          boxShadow: "0 0 8px rgba(0,0,0,0.5)",
        }}
      />

      <div
        className="pointer-events-none absolute flex items-center justify-center rounded-full bg-white"
        style={{
          left: `${position}%`,
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 32,
          height: 32,
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M5 3L2 8L5 13" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 3L14 8L11 13" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="pointer-events-none absolute left-2 top-2">
        <span className="rounded bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
          Avant
        </span>
      </div>

      <div className="pointer-events-none absolute right-2 top-2">
        <span className="rounded bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
          Après
        </span>
      </div>
    </div>
  );
}
