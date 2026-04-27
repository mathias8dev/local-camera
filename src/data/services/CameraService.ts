export type FacingMode = "user" | "environment";

export class CameraService {
  private stream: MediaStream | null = null;
  private imageCapture: ImageCapture | null = null;

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
    }
    return this.stream;
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
      this.imageCapture = null;
    }
  }

  async capture(
    video: HTMLVideoElement,
  ): Promise<{ blob: Blob; width: number; height: number }> {
    if (this.imageCapture) {
      return this.captureFromSensor();
    }
    return this.captureFromVideo(video);
  }

  private async captureFromSensor(): Promise<{
    blob: Blob;
    width: number;
    height: number;
  }> {
    const capabilities = await this.imageCapture!.getPhotoCapabilities();
    const blob = await this.imageCapture!.takePhoto({
      imageWidth: capabilities.imageWidth?.max,
      imageHeight: capabilities.imageHeight?.max,
    });
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
