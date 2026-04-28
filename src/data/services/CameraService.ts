import type { Resolution } from "@/domain/entities/Resolution";

export type FacingMode = "user" | "environment";

const MEGAPIXEL_TARGETS = [16, 12, 8, 5, 3];

function buildResolutions(maxW: number, maxH: number): Resolution[] {
  const aspect = maxW / maxH;
  const maxMp = (maxW * maxH) / 1e6;
  const results: Resolution[] = [
    {
      label: `${maxMp.toFixed(1)} MP`,
      width: maxW,
      height: maxH,
      megapixels: maxMp,
    },
  ];

  for (const mp of MEGAPIXEL_TARGETS) {
    if (mp >= maxMp) continue;
    const h = Math.round(Math.sqrt((mp * 1e6) / aspect));
    const w = Math.round(h * aspect);
    results.push({ label: `${mp} MP`, width: w, height: h, megapixels: mp });
  }

  return results;
}

export class CameraService {
  private stream: MediaStream | null = null;
  private imageCapture: ImageCapture | null = null;
  private resolutions: Resolution[] = [];

  async start(facingMode: FacingMode = "environment"): Promise<MediaStream> {
    this.stop();
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 4096 },
        height: { ideal: 2160 },
      },
      audio: false,
    });
    const track = this.stream.getVideoTracks()[0];
    if (typeof ImageCapture !== "undefined") {
      this.imageCapture = new ImageCapture(track);
      try {
        const caps = await this.imageCapture.getPhotoCapabilities();
        const maxW = caps.imageWidth?.max ?? 0;
        const maxH = caps.imageHeight?.max ?? 0;
        this.resolutions = maxW > 0 ? buildResolutions(maxW, maxH) : [];
      } catch {
        this.resolutions = [];
      }
    } else {
      this.resolutions = [];
    }
    return this.stream;
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
      this.imageCapture = null;
      this.resolutions = [];
    }
  }

  getResolutions(): Resolution[] {
    return this.resolutions;
  }

  async capture(
    video: HTMLVideoElement,
    resolution?: Resolution,
  ): Promise<{ blob: Blob; width: number; height: number }> {
    if (this.imageCapture) {
      return this.captureFromSensor(resolution);
    }
    return this.captureFromVideo(video);
  }

  private async captureFromSensor(resolution?: Resolution): Promise<{
    blob: Blob;
    width: number;
    height: number;
  }> {
    const photoOptions: ImageCapturePhotoOptions = {};
    if (resolution) {
      photoOptions.imageWidth = resolution.width;
      photoOptions.imageHeight = resolution.height;
    } else {
      const caps = await this.imageCapture!.getPhotoCapabilities();
      photoOptions.imageWidth = caps.imageWidth?.max;
      photoOptions.imageHeight = caps.imageHeight?.max;
    }
    const blob = await this.imageCapture!.takePhoto(photoOptions);
    const bitmap = await createImageBitmap(blob);
    const { width, height } = bitmap;
    bitmap.close();
    return { blob, width, height };
  }

  private captureFromVideo(
    video: HTMLVideoElement,
  ): Promise<{ blob: Blob; width: number; height: number }> {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) =>
          b
            ? resolve({ blob: b, width: canvas.width, height: canvas.height })
            : reject(new Error("Capture failed")),
        "image/jpeg",
        0.95,
      );
    });
  }

  static async applyMirror(
    blob: Blob,
    width: number,
    height: number,
  ): Promise<Blob> {
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d")!;
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas.convertToBlob({ type: "image/jpeg", quality: 0.95 });
  }
}

type ImageCapturePhotoOptions = {
  imageWidth?: number;
  imageHeight?: number;
};
