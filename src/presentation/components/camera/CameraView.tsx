"use client";

import { useRouter } from "next/navigation";
import { FlipHorizontal2, SwitchCamera } from "lucide-react";
import { useCamera } from "@/presentation/hooks/useCamera";
import { CaptureButton } from "./CaptureButton";
import { PhotoPreview } from "./PhotoPreview";

export function CameraView() {
  const router = useRouter();
  const {
    videoRef,
    isReady,
    previewUrl,
    error,
    isMirrored,
    onVideoReady,
    capture,
    savePhoto,
    sendToEditor,
    retake,
    toggleMirror,
    switchCamera,
  } = useCamera();

  const handleEdit = async () => {
    const id = await sendToEditor();
    if (id) router.push(`/editor?photoId=${id}`);
  };

  if (error) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <SwitchCamera className="h-16 w-16 text-zinc-400" />
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedData={onVideoReady}
        className={`absolute inset-0 h-full w-full object-cover ${isMirrored ? "scale-x-[-1]" : ""}`}
      />

      {!isReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-600 border-t-white" />
        </div>
      )}

      {previewUrl && (
        <PhotoPreview
          previewUrl={previewUrl}
          onSave={savePhoto}
          onEdit={handleEdit}
          onRetake={retake}
        />
      )}

      {!previewUrl && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-6 bg-gradient-to-t from-black/60 to-transparent px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-20">
          <div className="flex w-full max-w-xs items-center justify-between">
            <button
              onClick={toggleMirror}
              aria-label="Activer/désactiver le miroir"
              className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${isMirrored ? "bg-white text-black" : "bg-white/20 text-white"}`}
            >
              <FlipHorizontal2 className="h-5 w-5" />
            </button>
            <CaptureButton onCapture={capture} disabled={!isReady} />
            <button
              onClick={switchCamera}
              aria-label="Changer de caméra"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors active:scale-90"
            >
              <SwitchCamera className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
