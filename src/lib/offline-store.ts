"use client";

import { LOCAL_APP_STORES, requestToPromise, runLocalTransaction } from "@/lib/local-db";

export function loadOfflineSnapshot<T>(key: string): Promise<T | null> {
  return runLocalTransaction(LOCAL_APP_STORES.snapshots, "readonly", async (transaction) => {
    const result = await requestToPromise(transaction.objectStore(LOCAL_APP_STORES.snapshots).get(key));
    return (result as T | undefined) ?? null;
  });
}

export function saveOfflineSnapshot<T>(key: string, value: T): Promise<void> {
  return runLocalTransaction(LOCAL_APP_STORES.snapshots, "readwrite", async (transaction) => {
    await requestToPromise(transaction.objectStore(LOCAL_APP_STORES.snapshots).put(value, key));
  });
}

export function clearOfflineSnapshotsByPrefixes(prefixes: string[]): Promise<void> {
  if (prefixes.length === 0) {
    return Promise.resolve();
  }

  return runLocalTransaction(LOCAL_APP_STORES.snapshots, "readwrite", async (transaction) => {
    const store = transaction.objectStore(LOCAL_APP_STORES.snapshots);
    const keys = await requestToPromise(store.getAllKeys());

    for (const key of keys) {
      const normalizedKey = String(key);
      if (prefixes.some((prefix) => normalizedKey.startsWith(prefix))) {
        await requestToPromise(store.delete(key));
      }
    }
  });
}

export async function requestPersistentStorage() {
  if (!globalThis.isSecureContext || !globalThis.navigator?.storage?.persist) {
    return false;
  }

  try {
    return await globalThis.navigator.storage.persist();
  } catch {
    return false;
  }
}
