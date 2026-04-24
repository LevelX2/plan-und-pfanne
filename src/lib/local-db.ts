"use client";

import type {
  MealTypeDefinition,
  PlannedDayRecord,
  PlannedMealRecord,
  Recipe,
  RecipeMealTypeDefaultAssignment,
  RecipeMealTypePreference,
  UserSettings,
} from "@/lib/types";

export const LOCAL_APP_DB_NAME = "gf-wochenplan-offline";
export const LOCAL_APP_DB_VERSION = 3;

export const LOCAL_APP_STORES = {
  snapshots: "snapshots",
  meta: "meta",
  settings: "settings",
  recipes: "recipes",
  mealTypes: "mealTypes",
  recipeDefaultMealTypeAssignments: "recipeDefaultMealTypeAssignments",
  userRecipeMealTypePreferences: "userRecipeMealTypePreferences",
  plannedDays: "plannedDays",
  plannedMeals: "plannedMeals",
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

export type LocalMealTypeRecord = MealTypeDefinition;
export type LocalRecipeDefaultMealTypeAssignmentRecord = RecipeMealTypeDefaultAssignment;
export type LocalRecipeMealTypePreferenceRecord = RecipeMealTypePreference;
export type LocalPlannedDayRecord = PlannedDayRecord;
export type LocalPlannedMealRecord = PlannedMealRecord;

function getIndexedDb() {
  if (typeof globalThis === "undefined" || !("indexedDB" in globalThis) || !globalThis.indexedDB) {
    throw new Error("IndexedDB ist in dieser Umgebung nicht verfügbar.");
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

function deleteStoreIfPresent(database: IDBDatabase, storeName: string) {
  if (database.objectStoreNames.contains(storeName)) {
    database.deleteObjectStore(storeName);
  }
}

function configureUpgrade(database: IDBDatabase, transaction: IDBTransaction, oldVersion: number) {
  if (oldVersion < 3) {
    for (const storeName of [
      "snapshots",
      "meta",
      "settings",
      "recipes",
      "weekPlans",
      "history",
      "mealTypes",
      "recipeDefaultMealTypeAssignments",
      "userRecipeMealTypePreferences",
      "plannedDays",
      "plannedMeals",
    ]) {
      deleteStoreIfPresent(database, storeName);
    }
  }

  getOrCreateStore(database, transaction, LOCAL_APP_STORES.snapshots);
  getOrCreateStore(database, transaction, LOCAL_APP_STORES.meta, { keyPath: "key" });
  getOrCreateStore(database, transaction, LOCAL_APP_STORES.settings, { keyPath: "key" });

  const recipesStore = getOrCreateStore(database, transaction, LOCAL_APP_STORES.recipes, {
    keyPath: "id",
  });
  ensureIndex(recipesStore, "bySource", "source");
  ensureIndex(recipesStore, "byMealType", "mealType");

  const mealTypesStore = getOrCreateStore(database, transaction, LOCAL_APP_STORES.mealTypes, {
    keyPath: "key",
  });
  ensureIndex(mealTypesStore, "bySortOrder", "sortOrder");

  const defaultAssignmentsStore = getOrCreateStore(
    database,
    transaction,
    LOCAL_APP_STORES.recipeDefaultMealTypeAssignments,
    { keyPath: "id" },
  );
  ensureIndex(defaultAssignmentsStore, "byRecipe", "recipeId");
  ensureIndex(defaultAssignmentsStore, "byMealType", "mealType");

  const userPreferencesStore = getOrCreateStore(
    database,
    transaction,
    LOCAL_APP_STORES.userRecipeMealTypePreferences,
    { keyPath: "id" },
  );
  ensureIndex(userPreferencesStore, "byRecipe", "recipeId");
  ensureIndex(userPreferencesStore, "byMealType", "mealType");

  const plannedDaysStore = getOrCreateStore(database, transaction, LOCAL_APP_STORES.plannedDays, {
    keyPath: "date",
  });
  ensureIndex(plannedDaysStore, "byCreatedAt", "createdAt");
  ensureIndex(plannedDaysStore, "bySourcePeriod", ["sourcePeriodStart", "sourcePeriodEnd"]);

  const plannedMealsStore = getOrCreateStore(database, transaction, LOCAL_APP_STORES.plannedMeals, {
    keyPath: "id",
  });
  ensureIndex(plannedMealsStore, "byPlannedDayId", "plannedDayId");
  ensureIndex(plannedMealsStore, "byDate", "date");
  ensureIndex(plannedMealsStore, "byMealType", "mealType");
}

export function openLocalAppDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = getIndexedDb().open(LOCAL_APP_DB_NAME, LOCAL_APP_DB_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error("Lokale Datenbank konnte nicht geöffnet werden."));
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
