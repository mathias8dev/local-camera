const DB_NAME = "local-camera";
const DB_VERSION = 2;

const STORES = [
  { name: "files" },
  { name: "photos", options: { keyPath: "id" } as IDBObjectStoreParameters },
  { name: "thumbnails" },
];

let dbPromise: Promise<IDBDatabase> | null = null;

export async function withTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const request = callback(tx.objectStore(storeName));
    if (mode === "readonly") {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } else {
      tx.oncomplete = () => resolve(request?.result);
      tx.onerror = () => reject(tx.error);
    }
  });
}

function getDatabase(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store.name)) {
            db.createObjectStore(store.name, store.options);
          }
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }
  return dbPromise;
}
