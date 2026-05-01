export interface PostProcessorConfig {
  enabled: boolean;
  sharpenStrength: number;
  contrastStrength: number;
  exposure: number;
  toneMapStrength: number;
  filterBrightness: number;
  filterSaturation: number;
  filterWarmth: number;
  filterSepia: number;
  filterVignette: number;
  filterFisheye: number;
  filterKaleidoscope: number;
  filterGlitch: number;
  filterPixelate: number;
  filterMirror: number;
}

export const DEFAULT_POST_PROCESSOR_CONFIG: PostProcessorConfig = {
  enabled: true,
  sharpenStrength: 0.8,
  contrastStrength: 0.3,
  exposure: 1.2,
  toneMapStrength: 0.5,
  filterBrightness: 1.0,
  filterSaturation: 1.0,
  filterWarmth: 0.0,
  filterSepia: 0.0,
  filterVignette: 0.0,
  filterFisheye: 0.0,
  filterKaleidoscope: 0.0,
  filterGlitch: 0.0,
  filterPixelate: 0.0,
  filterMirror: 0.0,
};
