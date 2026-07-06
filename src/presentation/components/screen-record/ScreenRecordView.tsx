
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Monitor, Mic, MicOff, Images, Pause, Play, Square } from "lucide-react";
import { useScreenRecorder } from "@/presentation/hooks/useScreenRecorder";
import { VideoPreview } from "@/presentation/components/camera/VideoPreview";
import { mediaRepository } from "@/data/instances";
import type { ScreenRecordingMedia } from "@/domain/entities/MediaItem";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ScreenRecordView() {
  const navigate = useNavigate();
  const {
    isSupported,
    isRecording,
    isPaused,
    elapsed,
    micEnabled,
    result,
    startRecording,
    stopRecording,
    togglePause,
    toggleMic,
    clearResult,
    error,
  } = useScreenRecorder();

  const handleSave = useCallback(
    async (name: string) => {
      if (!result) return;
      const item: ScreenRecordingMedia = {
        id: crypto.randomUUID(),
        name,
        width: result.width,
        height: result.height,
        createdAt: new Date(),
        type: "screen",
        duration: result.duration,
        mimeType: result.mimeType,
      };
      await mediaRepository.save(item, result.blob);
    },
    [result],
  );

  const handleDone = useCallback(() => {
    clearResult();
    navigate("/gallery");
  }, [clearResult, navigate]);

  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        togglePause();
      } else if (event.key === "Escape") {
        event.preventDefault();
        stopRecording();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRecording, stopRecording, togglePause]);

  if (result) {
    return (
      <VideoPreview
        blob={result.blob}
        onRetake={clearResult}
        onSave={handleSave}
        onDone={handleDone}
      />
    );
  }

  if (!isSupported) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <Monitor className="h-16 w-16 text-zinc-400" />
        <p className="text-lg">
          L&apos;enregistrement d&apos;écran n&apos;est pas supporté par ce navigateur.
        </p>
        <button
          onClick={() => navigate("/gallery")}
          className="mt-4 rounded-full border-2 border-white px-6 py-3 text-sm font-medium text-white transition-colors active:bg-white/10"
        >
          Retour à la galerie
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-black">
      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute inset-x-0 top-0 z-30 flex justify-center pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm">
            {isPaused ? (
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
            ) : (
              <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            )}
            <span className="text-sm font-semibold text-white tabular-nums">
              {formatElapsed(elapsed)}
            </span>
            {isPaused && (
              <span className="text-xs text-yellow-400">En pause</span>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-x-0 top-0 z-30 flex justify-center pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="rounded-xl bg-red-600/90 px-4 py-2 text-sm text-white backdrop-blur-sm">
            {error}
          </div>
        </div>
      )}

      {/* Center area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        {!isRecording ? (
          <>
            <Monitor className="h-24 w-24 text-zinc-600" />
            <button
              onClick={startRecording}
              className="rounded-full bg-white px-8 py-3.5 text-base font-semibold text-black transition-colors active:bg-zinc-300"
            >
              Enregistrer l&apos;écran
            </button>
          </>
        ) : (
          <>
            <Monitor className="h-20 w-20 text-zinc-500" />
            <p className="text-sm text-zinc-400">
              {isPaused ? "Enregistrement en pause" : "Enregistrement en cours..."}
            </p>
          </>
        )}
      </div>

      {/* Bottom bar */}
      <div className="absolute inset-x-0 bottom-0 z-30 bg-linear-to-t from-black/80 to-transparent px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-20">
        <div className="mx-auto flex max-w-xs items-center justify-between">
          {!isRecording ? (
            <button
              onClick={() => navigate("/gallery")}
              aria-label="Galerie"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors active:scale-90"
            >
              <Images className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={togglePause}
              aria-label={isPaused ? "Reprendre l'enregistrement" : "Mettre l'enregistrement en pause"}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-black/50 text-white backdrop-blur-sm transition-colors active:scale-90 active:bg-white/10"
            >
              {isPaused ? (
                <Play className="h-5 w-5" />
              ) : (
                <Pause className="h-5 w-5" />
              )}
            </button>
          )}

          <button
            onClick={toggleMic}
            disabled={isRecording}
            aria-label={micEnabled ? "Désactiver le microphone" : "Activer le microphone"}
            className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 disabled:opacity-40 ${
              micEnabled ? "bg-white text-black" : "bg-white/20 text-white"
            }`}
          >
            {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          {isRecording && (
            <button
              onClick={stopRecording}
              aria-label="Arrêter l'enregistrement"
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-500 bg-black/50 text-red-500 backdrop-blur-sm transition-colors active:scale-90 active:bg-red-500/20"
            >
              <Square className="h-5 w-5 fill-red-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
