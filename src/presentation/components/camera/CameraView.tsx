"use client";

import { useRouter } from "next/navigation";
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
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-16 w-16 text-zinc-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
          />
        </svg>
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedData={onVideoReady}
        className={`flex-1 object-cover ${isMirrored ? "scale-x-[-1]" : ""}`}
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
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-6 bg-gradient-to-t from-black/60 to-transparent px-6 pb-10 pt-16">
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={toggleMirror}
              aria-label="Activer/désactiver le miroir"
              className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${isMirrored ? "bg-white text-black" : "bg-white/20 text-white hover:bg-white/30"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                />
              </svg>
            </button>
            <CaptureButton onCapture={capture} disabled={!isReady} />
            <button
              onClick={switchCamera}
              aria-label="Changer de caméra"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 19.644l3.181-3.18"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
