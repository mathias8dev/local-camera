export interface VideoRecordingResult {
  blob: Blob;
  duration: number;
  width: number;
  height: number;
  mimeType: string;
}

export const CODEC_CANDIDATES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
];

export function pickMimeType(): string {
  for (const candidate of CODEC_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }
  return "";
}
