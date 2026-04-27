"use client";

interface CaptureButtonProps {
  onCapture: () => void;
  disabled?: boolean;
}

export function CaptureButton({ onCapture, disabled }: CaptureButtonProps) {
  return (
    <button
      onClick={onCapture}
      disabled={disabled}
      aria-label="Prendre une photo"
      className="group relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-white shadow-lg transition-transform active:scale-90 disabled:opacity-40"
    >
      <span className="block h-14 w-14 rounded-full bg-white transition-colors group-hover:bg-zinc-200" />
    </button>
  );
}
