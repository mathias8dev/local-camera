import { Photo } from "@/domain/entities/Photo";

export interface PhotoRepository {
  save(photo: Photo, imageData: Blob): Promise<void>;
  getAll(): Promise<Photo[]>;
  getById(id: string): Promise<Photo | null>;
  getImageBlob(id: string): Promise<Blob | null>;
  getThumbnail(id: string): Promise<Blob | null>;
  delete(id: string): Promise<void>;
}
