import { IndexedDBFileStorage } from "@/data/storage/IndexedDBFileStorage";
import { IndexedDBPhotoRepository } from "@/data/repositories/IndexedDBPhotoRepository";

export const fileStorage = new IndexedDBFileStorage();
export const photoRepository = new IndexedDBPhotoRepository(fileStorage);
