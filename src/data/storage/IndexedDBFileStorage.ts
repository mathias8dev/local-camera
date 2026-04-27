import { FileStorage } from "@/domain/storage/FileStorage";
import { withTransaction } from "./IndexedDBProvider";

const STORE = "files";

export class IndexedDBFileStorage implements FileStorage {
  save(key: string, data: Blob): Promise<void> {
    return withTransaction(STORE, "readwrite", (store) => store.put(data, key));
  }

  get(key: string): Promise<Blob | null> {
    return withTransaction(STORE, "readonly", (store) => store.get(key));
  }

  delete(key: string): Promise<void> {
    return withTransaction(STORE, "readwrite", (store) => store.delete(key));
  }
}
