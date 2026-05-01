import type { PostProcessorConfig } from "@/domain/entities/PostProcessorConfig";

export interface CameraFilter {
  id: string;
  label: string;
  values: Partial<
    Pick<
      PostProcessorConfig,
      | "filterBrightness"
      | "filterSaturation"
      | "filterWarmth"
      | "filterSepia"
      | "filterVignette"
      | "filterFisheye"
      | "filterKaleidoscope"
      | "filterGlitch"
      | "filterPixelate"
      | "filterMirror"
    >
  >;
}

export const cameraFilters: CameraFilter[] = [
  { id: "none", label: "Aucun", values: {} },
  {
    id: "vivid",
    label: "Vivid",
    values: { filterBrightness: 1.08, filterSaturation: 1.5 },
  },
  {
    id: "noir",
    label: "Noir",
    values: { filterSaturation: 0.0, filterBrightness: 0.95, filterVignette: 1.5 },
  },
  {
    id: "vintage",
    label: "Vintage",
    values: { filterSepia: 0.5, filterSaturation: 0.8, filterWarmth: 0.5, filterVignette: 0.8 },
  },
  {
    id: "cool",
    label: "Cool",
    values: { filterWarmth: -0.6, filterSaturation: 1.1 },
  },
  {
    id: "warm",
    label: "Warm",
    values: { filterWarmth: 0.6, filterSaturation: 1.2, filterBrightness: 1.05 },
  },
  {
    id: "dramatic",
    label: "Drama",
    values: { filterSaturation: 0.7, filterBrightness: 0.9, filterVignette: 1.2 },
  },
  {
    id: "soft",
    label: "Soft",
    values: { filterSaturation: 0.9, filterBrightness: 1.1 },
  },
  {
    id: "fisheye",
    label: "Fisheye",
    values: { filterFisheye: 0.8 },
  },
  {
    id: "kaleidoscope",
    label: "Kaléido",
    values: { filterKaleidoscope: 0.5 },
  },
  {
    id: "glitch",
    label: "Glitch",
    values: { filterGlitch: 1.0, filterSaturation: 1.3 },
  },
  {
    id: "pixel",
    label: "Pixel",
    values: { filterPixelate: 0.3 },
  },
  {
    id: "mirror",
    label: "Miroir",
    values: { filterMirror: 1.0 },
  },
];
