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
      | "filterSketch"
      | "filterCartoon"
      | "filterInk"
      | "filterNeon"
      | "filterEmboss"
      | "filterHatching"
      | "filterPointillism"
    >
  >;
}

export type FilterKey = keyof CameraFilter["values"];

export interface FilterParamMeta {
  label: string;
  min: number;
  max: number;
  step: number;
}

export const FILTER_PARAM_META: Record<FilterKey, FilterParamMeta> = {
  filterBrightness:    { label: "Luminosité",    min: 0.5, max: 2.0, step: 0.05 },
  filterSaturation:    { label: "Saturation",    min: 0.0, max: 2.0, step: 0.05 },
  filterWarmth:        { label: "Chaleur",       min: -1.0, max: 1.0, step: 0.05 },
  filterSepia:         { label: "Sépia",         min: 0.0, max: 1.0, step: 0.05 },
  filterVignette:      { label: "Vignette",      min: 0.0, max: 2.0, step: 0.05 },
  filterFisheye:       { label: "Fisheye",       min: 0.0, max: 1.0, step: 0.05 },
  filterKaleidoscope:  { label: "Kaléidoscope",  min: 0.0, max: 1.0, step: 0.05 },
  filterGlitch:        { label: "Glitch",        min: 0.0, max: 1.0, step: 0.05 },
  filterPixelate:      { label: "Pixelisation",  min: 0.0, max: 1.0, step: 0.05 },
  filterMirror:        { label: "Miroir",        min: 0.0, max: 1.0, step: 0.05 },
  filterSketch:        { label: "Crayon",        min: 0.0, max: 1.0, step: 0.05 },
  filterCartoon:       { label: "Cartoon",       min: 0.0, max: 1.0, step: 0.05 },
  filterInk:           { label: "Encre",         min: 0.0, max: 1.0, step: 0.05 },
  filterNeon:          { label: "Néon",          min: 0.0, max: 1.0, step: 0.05 },
  filterEmboss:        { label: "Relief",        min: 0.0, max: 1.0, step: 0.05 },
  filterHatching:      { label: "Hachures",      min: 0.0, max: 1.0, step: 0.05 },
  filterPointillism:   { label: "Pointillisme",  min: 0.0, max: 1.0, step: 0.05 },
};

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
  {
    id: "sketch",
    label: "Crayon",
    values: { filterSketch: 1.0 },
  },
  {
    id: "cartoon",
    label: "Cartoon",
    values: { filterCartoon: 1.0, filterSaturation: 1.4 },
  },
  {
    id: "ink",
    label: "Encre",
    values: { filterInk: 1.0 },
  },
  {
    id: "neon",
    label: "Néon",
    values: { filterNeon: 1.0, filterSaturation: 1.3 },
  },
  {
    id: "emboss",
    label: "Relief",
    values: { filterEmboss: 0.8 },
  },
  {
    id: "hatching",
    label: "Hachures",
    values: { filterHatching: 1.0 },
  },
  {
    id: "pointillism",
    label: "Pointillisme",
    values: { filterPointillism: 0.5 },
  },
];
