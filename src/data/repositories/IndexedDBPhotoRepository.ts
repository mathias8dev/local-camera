import { Photo } from "@/domain/entities/Photo";
import { PhotoRepository } from "@/domain/repositories/PhotoRepository";
import { FileStorage } from "@/domain/storage/FileStorage";
import { withTransaction } from "@/data/storage/IndexedDBProvider";
import { generateThumbnail } from "@/data/services/ThumbnailService";

const STORE = "photos";
const THUMB_STORE = "thumbnails";

function toRecord(photo: Photo) {
  return { ...photo, createdAt: photo.createdAt.toISOString() };
}

function toPhoto(r: Record<string, unknown>): Photo {
  return { ...r, createdAt: new Date(r.createdAt as string) } as Photo;
}

export class IndexedDBPhotoRepository implements PhotoRepository {
  constructor(private fileStorage: FileStorage) {}

  async save(photo: Photo, imageData: Blob): Promise<void> {
    await this.fileStorage.save(photo.id, imageData);
    const thumb = await generateThumbnail(imageData);
    await withTransaction(THUMB_STORE, "readwrite", (store) =>
      store.put(thumb, photo.id),
    );
    return withTransaction(STORE, "readwrite", (store) =>
      store.put(toRecord(photo)),
    );
  }

  async getAll(): Promise<Photo[]> {
    const results = await withTransaction<unknown[]>(
      STORE,
      "readonly",
      (store) => store.getAll(),
    );
    return results
      .map((r) => toPhoto(r as Record<string, unknown>))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getById(id: string): Promise<Photo | null> {
    const r = await withTransaction<Record<string, unknown> | undefined>(
      STORE,
      "readonly",
      (store) => store.get(id),
    );
    return r ? toPhoto(r) : null;
  }

  getImageBlob(id: string): Promise<Blob | null> {
    return this.fileStorage.get(id);
  }

  async getThumbnail(id: string): Promise<Blob | null> {
    return withTransaction<Blob | null>(THUMB_STORE, "readonly", (store) =>
      store.get(id),
    );
  }

  async delete(id: string): Promise<void> {
    await this.fileStorage.delete(id);
    await withTransaction(THUMB_STORE, "readwrite", (store) =>
      store.delete(id),
    );
    return withTransaction(STORE, "readwrite", (store) => store.delete(id));
  }
}
