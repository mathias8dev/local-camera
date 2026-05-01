export type FaceEffectType = "distortion" | "overlay";

export interface OverlayLayer {
  imageSrc: string;
  anchorLandmarks: number[];
  offsetX: number;
  offsetY: number;
  scaleReference: [number, number];
  scaleFactor: number;
}

interface BaseFaceEffect {
  id: string;
  label: string;
  type: FaceEffectType;
}

export interface OverlayEffect extends BaseFaceEffect {
  type: "overlay";
  layers: OverlayLayer[];
}

export interface DistortionParam {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export interface DistortionEffect extends BaseFaceEffect {
  type: "distortion";
  distortionFn: string;
  params: DistortionParam[];
}

export type FaceEffect = OverlayEffect | DistortionEffect;

export interface FaceLandmarks {
  landmarks: { x: number; y: number; z: number }[];
  faceWidth: number;
  faceHeight: number;
}

export const LANDMARK = {
  FOREHEAD: 10,
  CHIN: 152,
  NOSE_TIP: 1,
  NOSE_BRIDGE: 6,
  LEFT_EAR: 234,
  RIGHT_EAR: 454,
  LEFT_EYE_INNER: 133,
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOTTOM: 145,
  RIGHT_EYE_INNER: 362,
  RIGHT_EYE_OUTER: 263,
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOTTOM: 374,
  MOUTH_LEFT: 61,
  MOUTH_RIGHT: 291,
  MOUTH_TOP: 0,
  MOUTH_BOTTOM: 17,
  LEFT_CHEEK: 123,
  RIGHT_CHEEK: 352,
  LEFT_FOREHEAD: 67,
  RIGHT_FOREHEAD: 297,
} as const;
