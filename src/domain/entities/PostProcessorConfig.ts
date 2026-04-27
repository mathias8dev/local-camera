export interface PostProcessorConfig {
  enabled: boolean;
  sharpenStrength: number;
  contrastStrength: number;
  exposure: number;
  toneMapStrength: number;
}

export const DEFAULT_POST_PROCESSOR_CONFIG: PostProcessorConfig = {
  enabled: true,
  sharpenStrength: 0.8,
  contrastStrength: 0.3,
  exposure: 1.2,
  toneMapStrength: 0.5,
};
