interface BaseMedia {
  id: string;
  name: string;
  width: number;
  height: number;
  createdAt: Date;
  mimeType: string;
}

export interface PhotoMedia extends BaseMedia {
  type: "photo";
}

export interface VideoMedia extends BaseMedia {
  type: "video";
  duration: number;
}

export interface ScreenRecordingMedia extends BaseMedia {
  type: "screen";
  duration: number;
}

export type MediaItem = PhotoMedia | VideoMedia | ScreenRecordingMedia;
