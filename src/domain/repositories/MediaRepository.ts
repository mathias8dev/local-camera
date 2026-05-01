import { MediaItem } from "@/domain/entities/MediaItem";

export interface MediaRepository {
  save(item: MediaItem, data: Blob): Promise<void>;
  getAll(): Promise<MediaItem[]>;
  getById(id: string): Promise<MediaItem | null>;
  getImageBlob(id: string): Promise<Blob | null>;
  getThumbnail(id: string): Promise<Blob | null>;
  delete(id: string): Promise<void>;
}
