"use client";

import { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FlipHorizontal2,
  Images,
  Sparkles,
  SwitchCamera,
  Grid3x3,
  Zap,
  Timer,
} from "lucide-react";
import { useCamera } from "@/presentation/hooks/useCamera";
import { shareFile, downloadBlob } from "@/data/services/WebShareService";
import type { ExportFormat } from "@/data/services/ImageRenderer";

import { CaptureButton } from "./CaptureButton";
import { PhotoPreview } from "./PhotoPreview";
import { Spinner } from "@/presentation/components/ui/Spinner";

export function CameraView() {
  const router = useRouter();
  const {
    videoRef,
    canvasRef,
    isReady,
    previewUrl,
    capturedBlob,
    dismissPreview,
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
    // Feature 1: Grid
    showGrid,
    toggleGrid,
    // Feature 2: Torch
    torchEnabled,
    torchSupported,
    toggleTorch,
    // Feature 3: Timer
    timerMode,
    countdown,
    cycleTimer,
    // Feature 4: Zoom
    zoomCapabilities,
    zoomLevel,
    showZoomIndicator,
    applyZoom,
  } = useCamera();

  // Pinch-to-zoom state (touch handling lives in the view, zoom logic in hook)
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && zoomCapabilities) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStartDistRef.current = Math.hypot(dx, dy);
        pinchStartZoomRef.current = zoomLevel;
      }
    },
    [zoomCapabilities, zoomLevel],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (
        e.touches.length === 2 &&
        zoomCapabilities &&
        pinchStartDistRef.current !== null
      ) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const scale = dist / pinchStartDistRef.current;
        const newZoom = pinchStartZoomRef.current * scale;
        applyZoom(newZoom);
      }
    },
    [zoomCapabilities, applyZoom],
  );

  const handleTouchEnd = useCallback(() => {
    pinchStartDistRef.current = null;
  }, []);

  const handleSave = async (name: string, format: ExportFormat, quality?: number) => {
    const blob = await savePhoto(name, format, quality);
    if (blob) {
      downloadBlob(blob, name);
      dismissPreview();
      router.push("/gallery");
    }
  };

  const handleEdit = async () => {
    const id = await sendToEditor();
    if (id) router.push(`/editor?photoId=${id}`);
  };

  const handleShare = async () => {
    if (!capturedBlob) return;
    await shareFile(capturedBlob, "Photo");
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

      {/* Canvas with pinch-to-zoom touch handlers */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 z-1 h-full w-full object-cover ${isMirrored ? "scale-x-[-1]" : ""}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Feature 1: Grid overlay (rule of thirds) */}
      {showGrid && !previewUrl && (
        <div className="pointer-events-none absolute inset-0 z-2" aria-hidden>
          {/* Vertical lines at 1/3 and 2/3 */}
          <div className="absolute inset-y-0 left-1/3 w-px bg-white/30" />
          <div className="absolute inset-y-0 left-2/3 w-px bg-white/30" />
          {/* Horizontal lines at 1/3 and 2/3 */}
          <div className="absolute inset-x-0 top-1/3 h-px bg-white/30" />
          <div className="absolute inset-x-0 top-2/3 h-px bg-white/30" />
        </div>
      )}

      {!isReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <Spinner />
        </div>
      )}

      {/* Feature 3: Countdown overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <span
            key={countdown}
            className="animate-ping-once text-9xl font-bold text-white drop-shadow-lg"
            style={{
              animation: "countdown-pulse 1s ease-out forwards",
            }}
          >
            {countdown}
          </span>
        </div>
      )}

      {/* Feature 4: Zoom level indicator */}
      {showZoomIndicator && zoomCapabilities && (
        <div className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/50 px-4 py-2 backdrop-blur-sm">
          <span className="text-sm font-semibold text-white">
            {zoomLevel.toFixed(1)}×
          </span>
        </div>
      )}

      {previewUrl && (
        <PhotoPreview
          previewUrl={previewUrl}
          onSave={handleSave}
          onEdit={handleEdit}
          onShare={handleShare}
          onRetake={retake}
        />
      )}

      {!previewUrl && (
        <>
          {/* Top bar: torch (left) + settings (right) */}
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <div>
              {torchSupported && (
                <button
                  onClick={toggleTorch}
                  aria-label="Activer/désactiver la lampe torche"
                  className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${
                    torchEnabled ? "bg-yellow-400 text-black" : "bg-black/40 text-white"
                  }`}
                >
                  <Zap className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleMirror}
                aria-label="Activer/désactiver le miroir"
                className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${
                  isMirrored ? "bg-white text-black" : "bg-black/40 text-white"
                }`}
              >
                <FlipHorizontal2 className="h-4 w-4" />
              </button>
              <button
                onClick={toggleEnhance}
                aria-label="Activer/désactiver les améliorations"
                className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${
                  enhanceEnabled ? "bg-white text-black" : "bg-black/40 text-white"
                }`}
              >
                <Sparkles className="h-4 w-4" />
              </button>
              <button
                onClick={toggleGrid}
                aria-label="Activer/désactiver la grille"
                className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${
                  showGrid ? "bg-white text-black" : "bg-black/40 text-white"
                }`}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={cycleTimer}
                aria-label="Minuterie de capture"
                className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${
                  timerMode !== 0 ? "bg-white text-black" : "bg-black/40 text-white"
                }`}
              >
                <span className="relative flex items-center justify-center">
                  <Timer className="h-4 w-4" />
                  {timerMode !== 0 && (
                    <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-yellow-400 text-[8px] font-bold text-black">
                      {timerMode}
                    </span>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Resolution pills */}
          {resolutions.length > 1 && (
            <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-[calc(max(1rem,env(safe-area-inset-top))+3.25rem)]">
              <div className="flex gap-1.5">
                {resolutions.map((res) => (
                  <button
                    key={res.label}
                    onClick={() => setSelectedResolution(res)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm transition-colors ${
                      selectedResolution?.label === res.label
                        ? "bg-white text-black"
                        : "bg-black/30 text-white/70"
                    }`}
                  >
                    {res.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom bar: gallery | capture | switch camera */}
          <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/60 to-transparent px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-20">
            <div className="mx-auto flex max-w-xs items-center">
              <div className="flex flex-1 justify-start">
                <button
                  onClick={() => router.push("/gallery")}
                  aria-label="Galerie"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors active:scale-90"
                >
                  <Images className="h-5 w-5" />
                </button>
              </div>

              <CaptureButton onCapture={capture} disabled={!isReady || countdown !== null} />

              <div className="flex flex-1 justify-end">
                <button
                  onClick={switchCamera}
                  aria-label="Changer de caméra"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors active:scale-90"
                >
                  <SwitchCamera className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Countdown pulse animation */}
      <style>{`
        @keyframes countdown-pulse {
          0% { opacity: 1; transform: scale(1.2); }
          80% { opacity: 0.8; transform: scale(0.9); }
          100% { opacity: 0; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
