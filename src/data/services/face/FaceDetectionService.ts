import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { FaceLandmarks } from "@/domain/entities/FaceEffect";
import { LANDMARK } from "@/domain/entities/FaceEffect";

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export class FaceDetectionService {
  private faceLandmarker: FaceLandmarker | null = null;
  private loadingPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.faceLandmarker) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
    })();

    return this.loadingPromise;
  }

  detect(
    video: HTMLVideoElement,
    timestamp: number,
  ): FaceLandmarks | null {
    if (!this.faceLandmarker) return null;
    if (video.readyState < video.HAVE_CURRENT_DATA) return null;

    const result = this.faceLandmarker.detectForVideo(video, timestamp);
    if (!result.faceLandmarks || result.faceLandmarks.length === 0) return null;

    const landmarks = result.faceLandmarks[0];
    const leftEar = landmarks[LANDMARK.LEFT_EAR];
    const rightEar = landmarks[LANDMARK.RIGHT_EAR];
    const forehead = landmarks[LANDMARK.FOREHEAD];
    const chin = landmarks[LANDMARK.CHIN];

    const faceWidth = Math.hypot(
      rightEar.x - leftEar.x,
      rightEar.y - leftEar.y,
    );
    const faceHeight = Math.hypot(
      chin.x - forehead.x,
      chin.y - forehead.y,
    );

    return { landmarks, faceWidth, faceHeight };
  }

  dispose(): void {
    this.faceLandmarker?.close();
    this.faceLandmarker = null;
    this.loadingPromise = null;
  }
}
