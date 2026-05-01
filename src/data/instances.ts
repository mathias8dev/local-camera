import { IndexedDBFileStorage } from "@/data/storage/IndexedDBFileStorage";
import { IndexedDBMediaRepository } from "@/data/repositories/IndexedDBMediaRepository";

export const fileStorage = new IndexedDBFileStorage();
export const mediaRepository = new IndexedDBMediaRepository(fileStorage);
