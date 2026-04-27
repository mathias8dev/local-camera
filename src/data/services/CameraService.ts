export type FacingMode = "user" | "environment";

export class CameraService {
  private stream: MediaStream | null = null;
  private imageCapture: ImageCapture | null = null;

  async start(facingMode: FacingMode = "environment"): Promise<MediaStream> {
    this.stop();
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
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
    mirrored: boolean,
  ): Promise<{ blob: Blob; width: number; height: number }> {
    if (this.imageCapture) {
      return this.captureFromSensor(mirrored);
    }
    return this.captureFromVideo(video, mirrored);
  }

  private async captureFromSensor(
    mirrored: boolean,
  ): Promise<{ blob: Blob; width: number; height: number }> {
    const blob = await this.imageCapture!.takePhoto();
    const bitmap = await createImageBitmap(blob);
    const { width, height } = bitmap;

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d")!;
    if (mirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const result = await canvas.convertToBlob({ type: "image/png" });
    return { blob: result, width, height };
  }

  private captureFromVideo(
    video: HTMLVideoElement,
    mirrored: boolean,
  ): Promise<{ blob: Blob; width: number; height: number }> {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) =>
          b
            ? resolve({ blob: b, width: canvas.width, height: canvas.height })
            : reject(new Error("Capture failed")),
        "image/png",
      );
    });
  }
}
