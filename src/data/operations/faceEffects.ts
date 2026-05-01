import type { FaceEffect } from "@/domain/entities/FaceEffect";
import { LANDMARK } from "@/domain/entities/FaceEffect";

export const faceEffects: FaceEffect[] = [
  { id: "none", label: "Aucun", type: "overlay", layers: [] },
  {
    id: "big-eyes",
    label: "Gros yeux",
    type: "distortion",
    distortionFn: "bigEyes",
    params: [
      { key: "scale", label: "Taille", min: 1.0, max: 2.5, step: 0.1, defaultValue: 1.8 },
    ],
  },
  {
    id: "slim-face",
    label: "Visage fin",
    type: "distortion",
    distortionFn: "slimFace",
    params: [
      { key: "amount", label: "Intensité", min: 0, max: 1, step: 0.05, defaultValue: 0.5 },
    ],
  },
  {
    id: "dog",
    label: "Chien",
    type: "overlay",
    layers: [
      {
        imageSrc: "/face-effects/dog-ears.svg",
        anchorLandmarks: [LANDMARK.FOREHEAD],
        offsetX: 0,
        offsetY: -0.12,
        scaleReference: [LANDMARK.LEFT_EYE_OUTER, LANDMARK.RIGHT_EYE_OUTER],
        scaleFactor: 1.6,
      },
      {
        imageSrc: "/face-effects/dog-nose.svg",
        anchorLandmarks: [LANDMARK.NOSE_TIP],
        offsetX: 0,
        offsetY: 0,
        scaleReference: [LANDMARK.LEFT_EYE_OUTER, LANDMARK.RIGHT_EYE_OUTER],
        scaleFactor: 0.3,
      },
      {
        imageSrc: "/face-effects/dog-tongue.svg",
        anchorLandmarks: [LANDMARK.MOUTH_BOTTOM],
        offsetX: 0,
        offsetY: 0.02,
        scaleReference: [LANDMARK.MOUTH_LEFT, LANDMARK.MOUTH_RIGHT],
        scaleFactor: 1.2,
      },
    ],
  },
  {
    id: "glasses",
    label: "Lunettes",
    type: "overlay",
    layers: [
      {
        imageSrc: "/face-effects/glasses.svg",
        anchorLandmarks: [LANDMARK.NOSE_BRIDGE],
        offsetX: 0,
        offsetY: 0,
        scaleReference: [LANDMARK.LEFT_EYE_OUTER, LANDMARK.RIGHT_EYE_OUTER],
        scaleFactor: 1.5,
      },
    ],
  },
  {
    id: "crown",
    label: "Couronne",
    type: "overlay",
    layers: [
      {
        imageSrc: "/face-effects/crown.svg",
        anchorLandmarks: [LANDMARK.FOREHEAD],
        offsetX: 0,
        offsetY: -0.1,
        scaleReference: [LANDMARK.LEFT_EYE_OUTER, LANDMARK.RIGHT_EYE_OUTER],
        scaleFactor: 1.6,
      },
    ],
  },
  {
    id: "mustache",
    label: "Moustache",
    type: "overlay",
    layers: [
      {
        imageSrc: "/face-effects/mustache.svg",
        anchorLandmarks: [LANDMARK.NOSE_TIP, LANDMARK.MOUTH_TOP],
        offsetX: 0,
        offsetY: 0,
        scaleReference: [LANDMARK.MOUTH_LEFT, LANDMARK.MOUTH_RIGHT],
        scaleFactor: 2.0,
      },
    ],
  },
];
