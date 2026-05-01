const MAX_SIZE = 300;

export async function generateThumbnail(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const scale = MAX_SIZE / Math.max(bitmap.width, bitmap.height);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.convertToBlob({ type: "image/jpeg", quality: 0.7 });
}

const VIDEO_THUMB_TIMEOUT_MS = 10_000;

function blankThumbnail(): Promise<Blob> {
  const canvas = new OffscreenCanvas(MAX_SIZE, MAX_SIZE);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#18181b";
  ctx.fillRect(0, 0, MAX_SIZE, MAX_SIZE);
  return canvas.convertToBlob({ type: "image/jpeg", quality: 0.7 });
}

export async function generateVideoThumbnail(blob: Blob): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  try {
    const result = await Promise.race([
      extractVideoFrame(url),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), VIDEO_THUMB_TIMEOUT_MS),
      ),
    ]);
    return result as Blob;
  } catch {
    return blankThumbnail();
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function extractVideoFrame(url: string): Promise<Blob> {
  const video = document.createElement("video");
  video.muted = true;
  video.preload = "auto";
  video.src = url;

  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error("Failed to load video"));
  });

  const seekTarget = Math.min(1, video.duration);
  video.currentTime = seekTarget;
  await new Promise<void>((resolve) => {
    video.onseeked = () => resolve();
  });

  const scale = MAX_SIZE / Math.max(video.videoWidth, video.videoHeight);
  const width = Math.round(video.videoWidth * scale);
  const height = Math.round(video.videoHeight * scale);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0, width, height);

  return canvas.convertToBlob({ type: "image/jpeg", quality: 0.7 });
}
