"use client";

import { useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FlipHorizontal2,
  Images,
  Sparkles,
  SwitchCamera,
  Grid3x3,
  Zap,
  Timer,
  SlidersHorizontal,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCamera } from "@/presentation/hooks/useCamera";
import { useVideoRecorder, VideoRecordingResult } from "@/presentation/hooks/useVideoRecorder";
import { useFaceEffects } from "@/presentation/hooks/useFaceEffects";
import { FILTER_PARAM_META, type FilterKey } from "@/data/operations/cameraFilters";
import type { DistortionEffect } from "@/domain/entities/FaceEffect";
import { mediaRepository } from "@/data/instances";
import { MediaItem } from "@/domain/entities/MediaItem";
import { shareFile } from "@/data/services/WebShareService";
import type { ExportFormat } from "@/data/services/ImageRenderer";

import { CaptureButton } from "./CaptureButton";
import { PhotoPreview } from "./PhotoPreview";
import { VideoPreview } from "./VideoPreview";
import { Spinner } from "@/presentation/components/ui/Spinner";

type CameraMode = "photo" | "video";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CameraView() {
  const router = useRouter();
  const {
    videoRef,
    canvasRef,
    postProcessorRef,
    stream,
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
    activeFilter,
    filterIntensity,
    filterValues,
    cameraFilters,
    selectFilter,
    setFilterIntensity,
    setFilterParam,
    switchCamera,
    showGrid,
    toggleGrid,
    torchEnabled,
    torchSupported,
    toggleTorch,
    timerMode,
    countdown,
    cycleTimer,
    zoomCapabilities,
    zoomLevel,
    showZoomIndicator,
    applyZoom,
  } = useCamera();

  const {
    overlayCanvasRef,
    compositeCanvasRef,
    activeFaceEffect,
    faceEffects,
    selectFaceEffect,
    faceEffectParams,
    setFaceEffectParam,
    isModelLoading,
  } = useFaceEffects(videoRef, canvasRef, postProcessorRef);

  const hasFaceEffect = activeFaceEffect.id !== "none";
  const recordingCanvasRef = hasFaceEffect ? compositeCanvasRef : canvasRef;

  const { isRecording, elapsed, startRecording, stopRecording, error: recError } =
    useVideoRecorder(stream, recordingCanvasRef);

  const [mode, setMode] = useState<CameraMode>("photo");
  const [videoResult, setVideoResult] = useState<VideoRecordingResult | null>(null);
  const [showFilterControls, setShowFilterControls] = useState(false);

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

  const captureFaceEffect = useCallback(async () => {
    const canvas = compositeCanvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", 0.95),
    );
    if (!blob) return;
    const photoId = crypto.randomUUID();
    const name = `Photo ${new Date().toLocaleString("fr-FR")}`;
    const photo: MediaItem = {
      id: photoId,
      name,
      width: canvas.width,
      height: canvas.height,
      createdAt: new Date(),
      type: "photo",
      mimeType: "image/jpeg",
    };
    await mediaRepository.save(photo, blob);
  }, [compositeCanvasRef]);

  const handleCapture = useCallback(async () => {
    if (mode === "photo") {
      if (hasFaceEffect) {
        await captureFaceEffect();
      } else {
        await capture();
      }
    } else if (isRecording) {
      const result = await stopRecording();
      setVideoResult(result);
    } else {
      await startRecording();
    }
  }, [mode, isRecording, capture, captureFaceEffect, hasFaceEffect, startRecording, stopRecording]);

  const handleSavePhoto = useCallback(
    (name: string, format: ExportFormat, quality?: number) => savePhoto(name, format, quality),
    [savePhoto],
  );

  const handleSaveVideo = useCallback(
    async (name: string) => {
      if (!videoResult) return;
      const item: MediaItem = {
        id: crypto.randomUUID(),
        name,
        width: videoResult.width,
        height: videoResult.height,
        createdAt: new Date(),
        type: "video",
        duration: videoResult.duration,
        mimeType: videoResult.mimeType,
      };
      await mediaRepository.save(item, videoResult.blob);
    },
    [videoResult],
  );

  const handlePhotoDone = useCallback(() => {
    dismissPreview();
    router.push("/gallery");
  }, [dismissPreview, router]);

  const handleVideoDone = useCallback(() => {
    setVideoResult(null);
    router.push("/gallery");
  }, [router]);

  const handleEdit = async () => {
    const id = await sendToEditor();
    if (id) router.push(`/editor?photoId=${id}`);
  };

  const handleShare = async () => {
    if (!capturedBlob) return;
    await shareFile(capturedBlob, "Photo");
  };

  const handleVideoRetake = () => {
    setVideoResult(null);
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      <canvas
        ref={overlayCanvasRef}
        className={`pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover ${isMirrored ? "scale-x-[-1]" : ""}`}
      />

      <canvas
        ref={compositeCanvasRef}
        className="pointer-events-none fixed -left-[9999px]"
      />

      {showGrid && !previewUrl && !videoResult && (
        <div className="pointer-events-none absolute inset-0 z-2" aria-hidden>
          <div className="absolute inset-y-0 left-1/3 w-px bg-white/30" />
          <div className="absolute inset-y-0 left-2/3 w-px bg-white/30" />
          <div className="absolute inset-x-0 top-1/3 h-px bg-white/30" />
          <div className="absolute inset-x-0 top-2/3 h-px bg-white/30" />
        </div>
      )}

      {!isReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <Spinner />
        </div>
      )}

      {countdown !== null && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <span
            key={countdown}
            className="animate-ping-once text-9xl font-bold text-white drop-shadow-lg"
            style={{ animation: "countdown-pulse 1s ease-out forwards" }}
          >
            {countdown}
          </span>
        </div>
      )}

      {showZoomIndicator && zoomCapabilities && (
        <div className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/50 px-4 py-2 backdrop-blur-sm">
          <span className="text-sm font-semibold text-white">
            {zoomLevel.toFixed(1)}×
          </span>
        </div>
      )}

      {isModelLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="rounded-xl bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-sm">
            Chargement du modèle...
          </div>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-0 inset-x-0 z-30 flex justify-center pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-white tabular-nums">
              {formatElapsed(elapsed)}
            </span>
          </div>
        </div>
      )}

      {/* Recorder error */}
      {recError && (
        <div className="absolute top-0 inset-x-0 z-30 flex justify-center pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="rounded-xl bg-red-600/90 px-4 py-2 text-sm text-white backdrop-blur-sm">
            {recError}
          </div>
        </div>
      )}

      {previewUrl && (
        <PhotoPreview
          previewUrl={previewUrl}
          onSave={handleSavePhoto}
          onDone={handlePhotoDone}
          onEdit={handleEdit}
          onShare={handleShare}
          onRetake={retake}
        />
      )}

      {videoResult && (
        <VideoPreview
          blob={videoResult.blob}
          onRetake={handleVideoRetake}
          onSave={handleSaveVideo}
          onDone={handleVideoDone}
        />
      )}

      {!previewUrl && !videoResult && (
        <>
          {/* Top bar */}
          {!isRecording && (
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
                {mode === "photo" && (
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
                )}
              </div>
            </div>
          )}

          {/* Resolution pills */}
          {mode === "photo" && resolutions.length > 1 && !isRecording && (
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

          {/* Bottom bar */}
          <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/60 to-transparent px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-20">
            <div className="mx-auto flex max-w-xs items-center justify-center">
              <div className="flex flex-1 justify-start">
                {!isRecording && (
                  <button
                    onClick={() => router.push("/gallery")}
                    aria-label="Galerie"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors active:scale-90"
                  >
                    <Images className="h-5 w-5" />
                  </button>
                )}
              </div>

              <CaptureButton
                onCapture={handleCapture}
                disabled={!isReady || countdown !== null}
                mode={mode}
                isRecording={isRecording}
              />

              <div className="flex flex-1 justify-end">
                {!isRecording && (
                  <button
                    onClick={switchCamera}
                    aria-label="Changer de caméra"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors active:scale-90"
                  >
                    <SwitchCamera className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter strip + tune button */}
            {!isRecording && (
              <div className="mt-4 flex items-center gap-2">
                <div className="-mx-6 flex flex-1 gap-2 overflow-x-auto px-6 scrollbar-none">
                  {cameraFilters.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        selectFilter(f);
                        setShowFilterControls(false);
                      }}
                      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors ${
                        activeFilter.id === f.id
                          ? "bg-white text-black"
                          : "bg-white/15 text-white/80 active:bg-white/25"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                {activeFilter.id !== "none" && (
                  <button
                    onClick={() => setShowFilterControls((prev) => !prev)}
                    aria-label="Réglages du filtre"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${
                      showFilterControls ? "bg-white text-black" : "bg-white/20 text-white"
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Filter controls */}
            <AnimatePresence>
              {!isRecording && activeFilter.id !== "none" && showFilterControls && (
                <motion.div
                  key="filter-controls"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-[11px] text-white/60 text-right">Intensité</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={filterIntensity}
                        onChange={(e) => setFilterIntensity(Number(e.target.value))}
                        className="h-1 flex-1 appearance-none rounded-full bg-white/20 accent-white [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                      />
                      <span className="w-8 text-[11px] text-white/60 tabular-nums">{filterIntensity}%</span>
                    </div>
                    {(Object.keys(activeFilter.values) as FilterKey[]).map((key) => {
                      const meta = FILTER_PARAM_META[key];
                      const value = filterValues[key] ?? 0;
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-20 shrink-0 text-[11px] text-white/60 text-right">{meta.label}</span>
                          <input
                            type="range"
                            min={meta.min}
                            max={meta.max}
                            step={meta.step}
                            value={value}
                            onChange={(e) => setFilterParam(key, Number(e.target.value))}
                            className="h-1 flex-1 appearance-none rounded-full bg-white/20 accent-white [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                          />
                          <span className="w-8 text-[11px] text-white/60 tabular-nums">{value.toFixed(1)}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Face effects strip */}
            {!isRecording && (
              <div className="mt-3 flex items-center gap-2">
                <div className="-mx-6 flex flex-1 gap-2 overflow-x-auto px-6 scrollbar-none">
                  {faceEffects.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => selectFaceEffect(f)}
                      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors ${
                        activeFaceEffect.id === f.id
                          ? "bg-purple-500 text-white"
                          : "bg-white/15 text-white/80 active:bg-white/25"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                {activeFaceEffect.type === "distortion" && hasFaceEffect && (
                  <button
                    onClick={() => setShowFilterControls((prev) => !prev)}
                    aria-label="Réglages de l'effet"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${
                      showFilterControls ? "bg-purple-500 text-white" : "bg-white/20 text-white"
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Face effect distortion params */}
            <AnimatePresence>
              {!isRecording && hasFaceEffect && activeFaceEffect.type === "distortion" && showFilterControls && (
                <motion.div
                  key="face-effect-controls"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-1.5">
                    {(activeFaceEffect as DistortionEffect).params.map((p) => (
                      <div key={p.key} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 text-[11px] text-white/60 text-right">{p.label}</span>
                        <input
                          type="range"
                          min={p.min}
                          max={p.max}
                          step={p.step}
                          value={faceEffectParams[p.key] ?? p.defaultValue}
                          onChange={(e) => setFaceEffectParam(p.key, Number(e.target.value))}
                          className="h-1 flex-1 appearance-none rounded-full bg-white/20 accent-white [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                        />
                        <span className="w-8 text-[11px] text-white/60 tabular-nums">
                          {(faceEffectParams[p.key] ?? p.defaultValue).toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mode toggle */}
            {!isRecording && (
              <div className="mx-auto mt-3 flex items-center justify-center gap-6">
                <button
                  onClick={() => setMode("photo")}
                  className={`text-sm font-semibold transition-colors ${
                    mode === "photo" ? "text-white" : "text-white/50"
                  }`}
                >
                  Photo
                </button>
                <button
                  onClick={() => setMode("video")}
                  className={`text-sm font-semibold transition-colors ${
                    mode === "video" ? "text-white" : "text-white/50"
                  }`}
                >
                  Vidéo
                </button>
              </div>
            )}
          </div>
        </>
      )}

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
