import { Photo } from "@/domain/entities/Photo";
import { PhotoRepository } from "@/domain/repositories/PhotoRepository";

const STORAGE_KEY = "local-camera-photos";

export class LocalPhotoRepository implements PhotoRepository {
  save(photo: Photo): void {
    const photos = this.getAll();
    photos.unshift(photo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  }

  getAll(): Photo[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((p: Record<string, unknown>) => ({
      ...p,
      createdAt: new Date(p.createdAt as string),
    }));
  }

  getById(id: string): Photo | null {
    return this.getAll().find((p) => p.id === id) ?? null;
  }

  delete(id: string): void {
    const photos = this.getAll().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  }
}
