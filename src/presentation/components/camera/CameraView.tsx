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
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-600 border-t-white" />
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
          isMirrored={capturedMirrored}
          onSave={savePhoto}
          onEdit={handleEdit}
          onShare={handleShare}
          onRetake={retake}
        />
      )}

      {!previewUrl && (
        <>
          {/* Top-left: torch button */}
          <div className="absolute top-0 left-0 z-10 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
            {torchSupported && (
              <button
                onClick={toggleTorch}
                aria-label="Activer/désactiver la lampe torche"
                className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:bg-black/60 ${
                  torchEnabled ? "bg-yellow-400 text-black" : "bg-black/40 text-white"
                }`}
              >
                <Zap className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Top-right: gallery button */}
          <div className="absolute top-0 right-0 z-10 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <button
              onClick={() => router.push("/gallery")}
              aria-label="Galerie"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors active:bg-black/60"
            >
              <Images className="h-5 w-5" />
            </button>
          </div>

          {/* Bottom controls */}
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
              {/* Left group: mirror + enhance + grid + timer */}
              <div className="flex gap-2">
                <button
                  onClick={toggleMirror}
                  aria-label="Activer/désactiver le miroir"
                  className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${
                    isMirrored ? "bg-white text-black" : "bg-white/20 text-white"
                  }`}
                >
                  <FlipHorizontal2 className="h-5 w-5" />
                </button>
                <button
                  onClick={toggleEnhance}
                  aria-label="Activer/désactiver les améliorations"
                  className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${
                    enhanceEnabled ? "bg-white text-black" : "bg-white/20 text-white"
                  }`}
                >
                  <Sparkles className="h-5 w-5" />
                </button>
                <button
                  onClick={toggleGrid}
                  aria-label="Activer/désactiver la grille"
                  className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${
                    showGrid ? "bg-white text-black" : "bg-white/20 text-white"
                  }`}
                >
                  <Grid3x3 className="h-5 w-5" />
                </button>
                <button
                  onClick={cycleTimer}
                  aria-label="Minuterie de capture"
                  className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${
                    timerMode !== 0 ? "bg-white text-black" : "bg-white/20 text-white"
                  }`}
                >
                  <span className="relative flex items-center justify-center">
                    <Timer className="h-5 w-5" />
                    {timerMode !== 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[9px] font-bold text-black">
                        {timerMode}
                      </span>
                    )}
                  </span>
                </button>
              </div>

              <CaptureButton onCapture={capture} disabled={!isReady || countdown !== null} />

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
