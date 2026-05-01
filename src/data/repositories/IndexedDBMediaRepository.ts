import { MediaItem } from "@/domain/entities/MediaItem";
import { MediaRepository } from "@/domain/repositories/MediaRepository";
import { FileStorage } from "@/domain/storage/FileStorage";
import { withTransaction } from "@/data/storage/IndexedDBProvider";
import { generateThumbnail, generateVideoThumbnail } from "@/data/services/ThumbnailService";

const STORE = "photos";
const THUMB_STORE = "thumbnails";

function toRecord(item: MediaItem) {
  return { ...item, createdAt: item.createdAt.toISOString() };
}

function toMediaItem(r: Record<string, unknown>): MediaItem {
  const type = (r.type as string) ?? "photo";
  const mimeType = (r.mimeType as string) ?? "image/jpeg";
  if (type === "video") {
    return {
      ...r,
      type: "video",
      mimeType,
      duration: (r.duration as number) ?? 0,
      createdAt: new Date(r.createdAt as string),
    } as MediaItem;
  }
  if (type === "screen") {
    return {
      ...r,
      type: "screen",
      mimeType,
      duration: (r.duration as number) ?? 0,
      createdAt: new Date(r.createdAt as string),
    } as MediaItem;
  }
  return {
    ...r,
    type: "photo",
    mimeType,
    createdAt: new Date(r.createdAt as string),
  } as MediaItem;
}

export class IndexedDBMediaRepository implements MediaRepository {
  constructor(private fileStorage: FileStorage) {}

  async save(item: MediaItem, data: Blob): Promise<void> {
    await this.fileStorage.save(item.id, data);
    const thumb =
      item.type === "video" || item.type === "screen"
        ? await generateVideoThumbnail(data)
        : await generateThumbnail(data);
    await withTransaction(THUMB_STORE, "readwrite", (store) =>
      store.put(thumb, item.id),
    );
    return withTransaction(STORE, "readwrite", (store) =>
      store.put(toRecord(item)),
    );
  }

  async getAll(): Promise<MediaItem[]> {
    const results = await withTransaction<unknown[]>(
      STORE,
      "readonly",
      (store) => store.getAll(),
    );
    return results
      .map((r) => toMediaItem(r as Record<string, unknown>))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getById(id: string): Promise<MediaItem | null> {
    const r = await withTransaction<Record<string, unknown> | undefined>(
      STORE,
      "readonly",
      (store) => store.get(id),
    );
    return r ? toMediaItem(r) : null;
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
