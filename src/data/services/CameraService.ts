export type FacingMode = "user" | "environment";

export class CameraService {
  private stream: MediaStream | null = null;

  async start(facingMode: FacingMode = "environment"): Promise<MediaStream> {
    this.stop();
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });
    return this.stream;
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  capture(video: HTMLVideoElement, mirrored: boolean): Promise<{ blob: Blob; width: number; height: number }> {
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
        (b) => (b ? resolve({ blob: b, width: canvas.width, height: canvas.height }) : reject(new Error("Capture failed"))),
        "image/png",
      );
    });
  }
}
