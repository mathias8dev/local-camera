"use client";

interface CaptureButtonProps {
  onCapture: () => void;
  disabled?: boolean;
  mode?: "photo" | "video";
  isRecording?: boolean;
}

export function CaptureButton({
  onCapture,
  disabled,
  mode = "photo",
  isRecording = false,
}: CaptureButtonProps) {
  const label =
    mode === "photo"
      ? "Prendre une photo"
      : isRecording
        ? "Arrêter l'enregistrement"
        : "Démarrer l'enregistrement";

  return (
    <button
      onClick={onCapture}
      disabled={disabled}
      aria-label={label}
      className={`group relative flex h-20 w-20 items-center justify-center rounded-full border-4 shadow-lg transition-transform active:scale-90 disabled:opacity-40 ${
        isRecording ? "border-red-500 animate-pulse" : "border-white"
      }`}
    >
      {mode === "photo" ? (
        <span className="block h-14 w-14 rounded-full bg-white transition-colors group-hover:bg-zinc-200" />
      ) : isRecording ? (
        <span className="block h-8 w-8 rounded-md bg-red-500" />
      ) : (
        <span className="block h-14 w-14 rounded-full bg-red-500 transition-colors group-hover:bg-red-400" />
      )}
    </button>
  );
}
