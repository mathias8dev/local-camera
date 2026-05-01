import type {
  FaceEffect,
  FaceLandmarks,
  OverlayEffect,
  DistortionEffect,
  OverlayLayer,
} from "@/domain/entities/FaceEffect";
import { LANDMARK } from "@/domain/entities/FaceEffect";

export class FaceEffectRenderer {
  private imageCache = new Map<string, HTMLImageElement>();

  async preloadAssets(effect: FaceEffect): Promise<void> {
    if (effect.type !== "overlay") return;
    const loads: Promise<void>[] = [];
    for (const layer of effect.layers) {
      if (this.imageCache.has(layer.imageSrc)) continue;
      loads.push(
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            this.imageCache.set(layer.imageSrc, img);
            resolve();
          };
          img.onerror = reject;
          img.src = layer.imageSrc;
        }),
      );
    }
    await Promise.all(loads);
  }

  render(
    ctx: CanvasRenderingContext2D,
    landmarks: FaceLandmarks,
    effect: FaceEffect,
    width: number,
    height: number,
    videoSource: HTMLVideoElement | null,
    params?: Record<string, number>,
  ): void {
    ctx.clearRect(0, 0, width, height);
    if (effect.type === "overlay") {
      this.renderOverlay(ctx, landmarks, effect, width, height);
    } else {
      this.renderDistortion(ctx, landmarks, effect, width, height, videoSource, params);
    }
  }

  private renderOverlay(
    ctx: CanvasRenderingContext2D,
    face: FaceLandmarks,
    effect: OverlayEffect,
    w: number,
    h: number,
  ): void {
    for (const layer of effect.layers) {
      const img = this.imageCache.get(layer.imageSrc);
      if (!img) continue;
      this.drawLayer(ctx, face, layer, img, w, h);
    }
  }

  private drawLayer(
    ctx: CanvasRenderingContext2D,
    face: FaceLandmarks,
    layer: OverlayLayer,
    img: HTMLImageElement,
    w: number,
    h: number,
  ): void {
    let ax = 0;
    let ay = 0;
    for (const idx of layer.anchorLandmarks) {
      ax += face.landmarks[idx].x;
      ay += face.landmarks[idx].y;
    }
    ax = (ax / layer.anchorLandmarks.length) * w;
    ay = (ay / layer.anchorLandmarks.length) * h;

    const ref0 = face.landmarks[layer.scaleReference[0]];
    const ref1 = face.landmarks[layer.scaleReference[1]];
    const refDist =
      Math.hypot((ref1.x - ref0.x) * w, (ref1.y - ref0.y) * h) *
      layer.scaleFactor;

    const aspect = img.naturalHeight / img.naturalWidth;
    const drawW = refDist;
    const drawH = refDist * aspect;

    const angle = Math.atan2(
      (ref1.y - ref0.y) * h,
      (ref1.x - ref0.x) * w,
    );

    ctx.save();
    ctx.translate(ax + layer.offsetX * w, ay + layer.offsetY * h);
    ctx.rotate(angle);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  private renderDistortion(
    ctx: CanvasRenderingContext2D,
    face: FaceLandmarks,
    effect: DistortionEffect,
    w: number,
    h: number,
    videoSource: HTMLVideoElement | null,
    params?: Record<string, number>,
  ): void {
    if (!videoSource) return;
    const fn = effect.distortionFn;
    if (fn === "bigEyes") {
      this.bigEyes(ctx, face, w, h, videoSource, params?.scale ?? 1.8);
    } else if (fn === "slimFace") {
      this.slimFace(ctx, face, w, h, videoSource, params?.amount ?? 0.5);
    }
  }

  private bigEyes(
    ctx: CanvasRenderingContext2D,
    face: FaceLandmarks,
    w: number,
    h: number,
    video: HTMLVideoElement,
    scale: number,
  ): void {
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    const eyes = [
      {
        cx: (face.landmarks[LANDMARK.LEFT_EYE_INNER].x + face.landmarks[LANDMARK.LEFT_EYE_OUTER].x) / 2,
        cy: (face.landmarks[LANDMARK.LEFT_EYE_TOP].y + face.landmarks[LANDMARK.LEFT_EYE_BOTTOM].y) / 2,
        rx: Math.abs(face.landmarks[LANDMARK.LEFT_EYE_OUTER].x - face.landmarks[LANDMARK.LEFT_EYE_INNER].x) / 2,
      },
      {
        cx: (face.landmarks[LANDMARK.RIGHT_EYE_INNER].x + face.landmarks[LANDMARK.RIGHT_EYE_OUTER].x) / 2,
        cy: (face.landmarks[LANDMARK.RIGHT_EYE_TOP].y + face.landmarks[LANDMARK.RIGHT_EYE_BOTTOM].y) / 2,
        rx: Math.abs(face.landmarks[LANDMARK.RIGHT_EYE_OUTER].x - face.landmarks[LANDMARK.RIGHT_EYE_INNER].x) / 2,
      },
    ];

    for (const eye of eyes) {
      const eyeCX = eye.cx * w;
      const eyeCY = eye.cy * h;
      const radius = eye.rx * w * scale;

      const srcX = eye.cx * vw - (eye.rx * vw);
      const srcY = eye.cy * vh - (eye.rx * vh);
      const srcSize = eye.rx * 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(eyeCX, eyeCY, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        video,
        srcX, srcY, srcSize * vw, srcSize * vh,
        eyeCX - radius, eyeCY - radius, radius * 2, radius * 2,
      );
      ctx.restore();
    }
  }

  private slimFace(
    ctx: CanvasRenderingContext2D,
    face: FaceLandmarks,
    w: number,
    h: number,
    video: HTMLVideoElement,
    amount: number,
  ): void {
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    const cheeks = [
      { landmark: LANDMARK.LEFT_CHEEK, dir: 1 },
      { landmark: LANDMARK.RIGHT_CHEEK, dir: -1 },
    ];

    const noseBridge = face.landmarks[LANDMARK.NOSE_BRIDGE];
    const inwardShift = amount * face.faceWidth * 0.15;

    for (const cheek of cheeks) {
      const lm = face.landmarks[cheek.landmark];
      const cx = lm.x * w;
      const cy = lm.y * h;
      const radius = face.faceWidth * w * 0.2;

      const srcCX = lm.x * vw;
      const srcCY = lm.y * vh;
      const srcR = radius * (vw / w);

      const shiftX = cheek.dir * inwardShift * (noseBridge.x * w > cx ? -1 : 1);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx + shiftX, cy, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        video,
        srcCX - srcR, srcCY - srcR, srcR * 2, srcR * 2,
        cx + shiftX - radius, cy - radius, radius * 2, radius * 2,
      );
      ctx.restore();
    }
  }

  dispose(): void {
    this.imageCache.clear();
  }
}
