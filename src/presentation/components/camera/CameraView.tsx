
import { useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCamera } from "@/presentation/hooks/useCamera";
import { useVideoRecorder, VideoRecordingResult } from "@/presentation/hooks/useVideoRecorder";
import { useFaceEffects } from "@/presentation/hooks/useFaceEffects";
import { SwitchCamera } from "lucide-react";
import type { Resolution } from "@/domain/entities/Resolution";
import { mediaRepository } from "@/data/instances";
import { MediaItem } from "@/domain/entities/MediaItem";
import { shareFile } from "@/data/services/WebShareService";
import type { ExportFormat } from "@/data/services/ImageRenderer";

import { TopBar } from "./TopBar";
import { ModeCarousel } from "./ModeCarousel";
import { CameraControls } from "./CameraControls";
import { EffectsTray, type EffectsTab, type TrayState } from "./EffectsTray";
import { PhotoPreview } from "./PhotoPreview";
import { VideoPreview } from "./VideoPreview";
import { Spinner } from "@/presentation/components/ui/Spinner";

type CameraMode = "photo" | "video";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const haptic = (ms = 10) => navigator.vibrate?.(ms);

export function CameraView() {
  const navigate = useNavigate();
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
  const [activeEffectsTab, setActiveEffectsTab] = useState<EffectsTab>("filters");
  const [trayState, setTrayState] = useState<TrayState>("collapsed");

  // Pinch-to-zoom
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  // Swipe-to-switch-mode
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && zoomCapabilities) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStartDistRef.current = Math.hypot(dx, dy);
        pinchStartZoomRef.current = zoomLevel;
      } else if (e.touches.length === 1) {
        swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
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
        swipeStartRef.current = null;
      }
    },
    [zoomCapabilities, applyZoom],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      pinchStartDistRef.current = null;
      if (swipeStartRef.current && e.changedTouches.length === 1) {
        const dx = e.changedTouches[0].clientX - swipeStartRef.current.x;
        const dy = e.changedTouches[0].clientY - swipeStartRef.current.y;
        if (Math.abs(dx) > 60 && Math.abs(dy) < 40) {
          const newMode = dx < 0 ? "video" : "photo";
          if (newMode !== mode) {
            setMode(newMode);
            haptic();
          }
        }
      }
      swipeStartRef.current = null;
    },
    [mode],
  );

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
    setTrayState("collapsed");
    haptic(15);
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
    navigate("/gallery");
  }, [dismissPreview, navigate]);

  const handleVideoDone = useCallback(() => {
    setVideoResult(null);
    navigate("/gallery");
  }, [navigate]);

  const handleEdit = async () => {
    const id = await sendToEditor();
    if (id) navigate(`/editor?photoId=${id}`);
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
        className={`absolute inset-0 z-1 h-full w-full touch-none object-cover ${isMirrored ? "scale-x-[-1]" : ""}`}
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
            className="text-9xl font-bold text-white drop-shadow-lg"
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

      {isRecording && (
        <div className="absolute inset-x-0 top-0 z-30 flex justify-center pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm font-semibold text-white tabular-nums">
              {formatElapsed(elapsed)}
            </span>
          </div>
        </div>
      )}

      {recError && (
        <div className="absolute inset-x-0 top-0 z-30 flex justify-center pt-[max(1rem,env(safe-area-inset-top))]">
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
          {!isRecording && (
            <TopBar
              torchSupported={torchSupported}
              torchEnabled={torchEnabled}
              toggleTorch={toggleTorch}
              isMirrored={isMirrored}
              toggleMirror={toggleMirror}
              enhanceEnabled={enhanceEnabled}
              toggleEnhance={toggleEnhance}
              showGrid={showGrid}
              toggleGrid={toggleGrid}
              timerMode={timerMode}
              cycleTimer={cycleTimer}
              mode={mode}
            />
          )}

          {mode === "photo" && resolutions.length > 1 && !isRecording && (
            <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-[calc(max(1rem,env(safe-area-inset-top))+3.75rem)]">
              <div className="flex gap-1.5">
                {resolutions.map((res: Resolution) => (
                  <button
                    key={res.label}
                    onClick={() => setSelectedResolution(res)}
                    className={`rounded-full px-3.5 py-2 text-xs font-medium backdrop-blur-sm transition-colors ${
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

          {/* Capture zone */}
          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
            {!isRecording && (
              <EffectsTray
                trayState={trayState}
                setTrayState={setTrayState}
                activeTab={activeEffectsTab}
                setActiveTab={setActiveEffectsTab}
                cameraFilters={cameraFilters}
                activeFilter={activeFilter}
                filterIntensity={filterIntensity}
                filterValues={filterValues}
                selectFilter={selectFilter}
                setFilterIntensity={setFilterIntensity}
                setFilterParam={setFilterParam}
                faceEffects={faceEffects}
                activeFaceEffect={activeFaceEffect}
                selectFaceEffect={selectFaceEffect}
                faceEffectParams={faceEffectParams}
                setFaceEffectParam={setFaceEffectParam}
              />
            )}
            {!isRecording && (
              <ModeCarousel mode={mode} setMode={setMode} />
            )}
            <CameraControls
              onCapture={handleCapture}
              onGallery={() => navigate("/gallery")}
              onSwitchCamera={switchCamera}
              mode={mode}
              isRecording={isRecording}
              isReady={isReady}
              countdown={countdown}
            />
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
