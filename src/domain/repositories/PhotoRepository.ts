import { Photo } from "@/domain/entities/Photo";

export interface PhotoRepository {
  save(photo: Photo): void;
  getAll(): Photo[];
  getById(id: string): Photo | null;
  delete(id: string): void;
}
