"use client";

const DB_NAME = "gf-wochenplan-offline";
const DB_VERSION = 1;
const SNAPSHOT_STORE = "snapshots";

function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB konnte nicht geoeffnet werden."));
    };

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(SNAPSHOT_STORE)) {
        database.createObjectStore(SNAPSHOT_STORE);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

export function loadOfflineSnapshot<T>(key: string): Promise<T | null> {
  return openOfflineDb().then(
    (database) =>
      new Promise<T | null>((resolve, reject) => {
        const transaction = database.transaction(SNAPSHOT_STORE, "readonly");
        const store = transaction.objectStore(SNAPSHOT_STORE);
        const request = store.get(key);

        request.onerror = () => {
          reject(request.error ?? new Error("Offline-Daten konnten nicht gelesen werden."));
        };

        request.onsuccess = () => {
          resolve((request.result as T | undefined) ?? null);
        };

        transaction.oncomplete = () => {
          database.close();
        };

        transaction.onerror = () => {
          database.close();
        };
      }),
  );
}

export function saveOfflineSnapshot<T>(key: string, value: T): Promise<void> {
  return openOfflineDb().then(
    (database) =>
      new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(SNAPSHOT_STORE, "readwrite");
        const store = transaction.objectStore(SNAPSHOT_STORE);
        const request = store.put(value, key);

        request.onerror = () => {
          reject(request.error ?? new Error("Offline-Daten konnten nicht gespeichert werden."));
        };

        transaction.oncomplete = () => {
          database.close();
          resolve();
        };

        transaction.onerror = () => {
          database.close();
          reject(transaction.error ?? new Error("Offline-Daten konnten nicht gespeichert werden."));
        };
      }),
  );
}

export async function requestPersistentStorage() {
  if (!window.isSecureContext || !navigator.storage?.persist) {
    return false;
  }

  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
