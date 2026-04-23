"use client";

import type { Recipe, UserSettings, WeekPlan } from "@/lib/types";

export const LOCAL_APP_DB_NAME = "gf-wochenplan-offline";
export const LOCAL_APP_DB_VERSION = 2;

export const LOCAL_APP_STORES = {
  snapshots: "snapshots",
  meta: "meta",
  settings: "settings",
  recipes: "recipes",
  weekPlans: "weekPlans",
  history: "history",
} as const;

export type LocalAppStoreName = (typeof LOCAL_APP_STORES)[keyof typeof LOCAL_APP_STORES];
export type LocalRecipeSource = "seed" | "import";

export type LocalAppMetaRecord = {
  key: "app";
  schemaVersion: number;
  initializedAt: string;
  lastOpenedAt: string;
  currentSeedHash: string | null;
  lastSeedSyncAt: string | null;
};

export type LocalSettingsRecord = {
  key: "current";
  value: UserSettings;
  updatedAt: string;
};

export type LocalRecipeRecord = Recipe & {
  source: LocalRecipeSource;
  createdAt: string;
  updatedAt: string;
};

export type LocalWeekPlanRecord = {
  startDate: string;
  endDate: string;
  generatedAt: string;
  generatedBy: string;
  savedAt: string;
  plan: WeekPlan;
};

export type LocalHistoryRecord = {
  id: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  generatedBy: string;
  savedAt: string;
  averageScore: number;
  averageProteinPct: number;
  averageCarbsPct: number;
  averageFatPct: number;
  dayCount: number;
  mealsPerDay: number;
  recipeIds: string[];
  plan: WeekPlan;
};

function getIndexedDb() {
  if (typeof globalThis === "undefined" || !("indexedDB" in globalThis) || !globalThis.indexedDB) {
    throw new Error("IndexedDB ist in dieser Umgebung nicht verfuegbar.");
  }

  return globalThis.indexedDB;
}

function getOrCreateStore(
  database: IDBDatabase,
  transaction: IDBTransaction,
  storeName: LocalAppStoreName,
  options?: IDBObjectStoreParameters,
) {
  if (database.objectStoreNames.contains(storeName)) {
    return transaction.objectStore(storeName);
  }

  return database.createObjectStore(storeName, options);
}

function ensureIndex(
  store: IDBObjectStore,
  indexName: string,
  keyPath: string | string[],
  options?: IDBIndexParameters,
) {
  if (!store.indexNames.contains(indexName)) {
    store.createIndex(indexName, keyPath, options);
  }
}

function configureUpgrade(database: IDBDatabase, transaction: IDBTransaction, oldVersion: number) {
  if (oldVersion < 1 || !database.objectStoreNames.contains(LOCAL_APP_STORES.snapshots)) {
    getOrCreateStore(database, transaction, LOCAL_APP_STORES.snapshots);
  }

  if (oldVersion < 2) {
    getOrCreateStore(database, transaction, LOCAL_APP_STORES.meta, { keyPath: "key" });
    getOrCreateStore(database, transaction, LOCAL_APP_STORES.settings, { keyPath: "key" });

    const recipesStore = getOrCreateStore(database, transaction, LOCAL_APP_STORES.recipes, {
      keyPath: "id",
    });
    ensureIndex(recipesStore, "bySource", "source");
    ensureIndex(recipesStore, "byMealType", "mealType");

    const weekPlansStore = getOrCreateStore(database, transaction, LOCAL_APP_STORES.weekPlans, {
      keyPath: "startDate",
    });
    ensureIndex(weekPlansStore, "byGeneratedAt", "generatedAt");

    const historyStore = getOrCreateStore(database, transaction, LOCAL_APP_STORES.history, {
      keyPath: "id",
    });
    ensureIndex(historyStore, "byGeneratedAt", "generatedAt");
    ensureIndex(historyStore, "byStartDate", "startDate");
  }
}

export function openLocalAppDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = getIndexedDb().open(LOCAL_APP_DB_NAME, LOCAL_APP_DB_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error("Lokale Datenbank konnte nicht geoeffnet werden."));
    };

    request.onblocked = () => {
      reject(new Error("Lokale Datenbank ist blockiert und muss erst freigegeben werden."));
    };

    request.onupgradeneeded = (event) => {
      const transaction = request.transaction;
      if (!transaction) {
        return;
      }

      configureUpgrade(request.result, transaction, event.oldVersion);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB-Request ist fehlgeschlagen."));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

export function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error ?? new Error("IndexedDB-Transaktion ist fehlgeschlagen."));
    };

    transaction.onabort = () => {
      reject(transaction.error ?? new Error("IndexedDB-Transaktion wurde abgebrochen."));
    };
  });
}

export async function runLocalTransaction<T>(
  storeNames: LocalAppStoreName | LocalAppStoreName[],
  mode: IDBTransactionMode,
  callback: (transaction: IDBTransaction) => Promise<T> | T,
): Promise<T> {
  const database = await openLocalAppDb();
  const transaction = database.transaction(storeNames, mode);
  const completion = waitForTransaction(transaction);

  try {
    const result = await callback(transaction);
    await completion;
    return result;
  } catch (error) {
    try {
      transaction.abort();
    } catch {
      // Ignore abort errors when the transaction has already finished.
    }

    await completion.catch(() => undefined);
    throw error;
  } finally {
    database.close();
  }
}

export function cloneLocalData<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}
