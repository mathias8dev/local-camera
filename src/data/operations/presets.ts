import { OperationValues } from "@/domain/entities/EditorOperation";

export interface Preset {
  id: string;
  label: string;
  /** Partial values — only keys that differ from defaults need to be specified. */
  values: Partial<OperationValues>;
}

export const presets: Preset[] = [
  {
    id: "original",
    label: "Original",
    values: {},
  },
  {
    id: "vivid",
    label: "Vivid",
    values: {
      brightness: { value: 110 },
      contrast: { value: 120 },
      saturate: { value: 160 },
    },
  },
  {
    id: "noir",
    label: "Noir",
    values: {
      grayscale: { value: 100 },
      contrast: { value: 130 },
      brightness: { value: 95 },
    },
  },
  {
    id: "vintage",
    label: "Vintage",
    values: {
      sepia: { value: 60 },
      contrast: { value: 90 },
      brightness: { value: 105 },
      saturate: { value: 80 },
    },
  },
  {
    id: "cool",
    label: "Cool",
    values: {
      "hue-rotate": { value: 200 },
      saturate: { value: 120 },
      brightness: { value: 105 },
    },
  },
  {
    id: "warm",
    label: "Warm",
    values: {
      "hue-rotate": { value: 20 },
      saturate: { value: 130 },
      brightness: { value: 108 },
      contrast: { value: 105 },
    },
  },
  {
    id: "dramatic",
    label: "Dramatic",
    values: {
      contrast: { value: 160 },
      brightness: { value: 90 },
      saturate: { value: 80 },
    },
  },
  {
    id: "soft",
    label: "Soft",
    values: {
      contrast: { value: 85 },
      brightness: { value: 112 },
      saturate: { value: 90 },
      blur: { value: 0.5 },
    },
  },
];
