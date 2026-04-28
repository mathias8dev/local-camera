"use client";

import { useRouter } from "next/navigation";
import { FlipHorizontal2, Images, Sparkles, SwitchCamera } from "lucide-react";
import { useCamera } from "@/presentation/hooks/useCamera";
import { shareFile } from "@/data/services/WebShareService";
import { CameraService } from "@/data/services/CameraService";
import { CaptureButton } from "./CaptureButton";
import { PhotoPreview } from "./PhotoPreview";

export function CameraView() {
  const router = useRouter();
  const {
    videoRef,
    canvasRef,
    isReady,
    previewUrl,
    capturedMirrored,
    capturedBlob,
    error,
    isMirrored,
    enhanceEnabled,
    resolutions,
    selectedResolution,
    setSelectedResolution,
    onVideoReady,
    capture,
    savePhoto,
    sendToEditor,
    retake,
    toggleMirror,
    toggleEnhance,
    switchCamera,
  } = useCamera();

  const handleEdit = async () => {
    const id = await sendToEditor();
    if (id) router.push(`/editor?photoId=${id}`);
  };

  const handleShare = async () => {
    if (!capturedBlob) return;
    let blob = capturedBlob;
    if (capturedMirrored) {
      const bitmap = await createImageBitmap(blob);
      blob = await CameraService.applyMirror(blob, bitmap.width, bitmap.height);
      bitmap.close();
    }
    await shareFile(blob, "Photo");
  };

  if (error) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <SwitchCamera className="h-16 w-16 text-zinc-400" />
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedData={onVideoReady}
        className="absolute inset-0 h-full w-full object-cover opacity-0"
      />

      <canvas
        ref={canvasRef}
        className={`absolute inset-0 z-1 h-full w-full object-cover ${isMirrored ? "scale-x-[-1]" : ""}`}
      />

      {!isReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-600 border-t-white" />
        </div>
      )}

      {previewUrl && (
        <PhotoPreview
          previewUrl={previewUrl}
          isMirrored={capturedMirrored}
          onSave={savePhoto}
          onEdit={handleEdit}
          onShare={handleShare}
          onRetake={retake}
        />
      )}

      {!previewUrl && (
        <>
          <div className="absolute top-0 right-0 z-10 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <button
              onClick={() => router.push("/gallery")}
              aria-label="Galerie"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors active:bg-black/60"
            >
              <Images className="h-5 w-5" />
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-6 bg-linear-to-t from-black/60 to-transparent px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-20">
            {resolutions.length > 1 && (
              <div className="flex gap-2">
                {resolutions.map((res) => (
                  <button
                    key={res.label}
                    onClick={() => setSelectedResolution(res)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors ${
                      selectedResolution?.label === res.label
                        ? "bg-white text-black"
                        : "bg-white/20 text-white"
                    }`}
                  >
                    {res.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex w-full max-w-xs items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={toggleMirror}
                  aria-label="Activer/désactiver le miroir"
                  className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${isMirrored ? "bg-white text-black" : "bg-white/20 text-white"}`}
                >
                  <FlipHorizontal2 className="h-5 w-5" />
                </button>
                <button
                  onClick={toggleEnhance}
                  aria-label="Activer/désactiver les améliorations"
                  className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${enhanceEnabled ? "bg-white text-black" : "bg-white/20 text-white"}`}
                >
                  <Sparkles className="h-5 w-5" />
                </button>
              </div>
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
        </>
      )}
    </div>
  );
}
