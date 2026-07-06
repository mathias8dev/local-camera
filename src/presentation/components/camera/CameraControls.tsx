import { Images, SwitchCamera } from "lucide-react";
import { CaptureButton } from "./CaptureButton";

interface CameraControlsProps {
  onCapture: () => void;
  onGallery: () => void;
  onSwitchCamera: () => void;
  mode: "photo" | "video";
  isRecording: boolean;
  isReady: boolean;
  countdown: number | null;
}

export function CameraControls({
  onCapture,
  onGallery,
  onSwitchCamera,
  mode,
  isRecording,
  isReady,
  countdown,
}: CameraControlsProps) {
  return (
    <div className="mx-auto flex max-w-sm items-center justify-center">
      <div className="flex flex-1 justify-start">
        {!isRecording && (
          <button
            onClick={onGallery}
            aria-label="Galerie"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors active:scale-90"
          >
            <Images className="h-5 w-5" />
          </button>
        )}
      </div>

      <CaptureButton
        onCapture={onCapture}
        disabled={!isReady || countdown !== null}
        mode={mode}
        isRecording={isRecording}
      />

      <div className="flex flex-1 justify-end">
        {!isRecording && (
          <button
            onClick={onSwitchCamera}
            aria-label="Changer de caméra"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors active:scale-90"
          >
            <SwitchCamera className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
