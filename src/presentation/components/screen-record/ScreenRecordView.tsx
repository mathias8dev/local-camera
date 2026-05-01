"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
    router.push("/gallery");
  }, [clearResult, router]);

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
          onClick={() => router.push("/gallery")}
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
            <p className="text-sm text-zinc-400">Enregistrement en cours…</p>
            <div className="flex items-center gap-4">
              <button
                onClick={togglePause}
                className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white text-white transition-colors active:bg-white/10"
              >
                {isPaused ? (
                  <Play className="h-6 w-6" />
                ) : (
                  <Pause className="h-6 w-6" />
                )}
              </button>
              <button
                onClick={stopRecording}
                className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-red-500 transition-colors active:bg-red-500/20"
              >
                <Square className="h-7 w-7 fill-red-500 text-red-500" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Bottom bar */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/60 to-transparent px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-20">
        <div className="mx-auto flex max-w-xs items-center justify-between">
          {!isRecording ? (
            <button
              onClick={() => router.push("/gallery")}
              aria-label="Galerie"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors active:scale-90"
            >
              <Images className="h-5 w-5" />
            </button>
          ) : (
            <div className="h-12 w-12" />
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
        </div>
      </div>
    </div>
  );
}
