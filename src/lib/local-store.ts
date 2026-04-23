"use client";

import { seedRecipes } from "@/lib/data/seed-recipes";
import { getCurrentWeekStart, getWeekStartForDate } from "@/lib/date";
import {
  LOCAL_APP_STORES,
  type LocalAppMetaRecord,
  type LocalHistoryRecord,
  type LocalRecipeRecord,
  type LocalRecipeSource,
  type LocalSettingsRecord,
  type LocalWeekPlanRecord,
  cloneLocalData,
  requestToPromise,
  runLocalTransaction,
} from "@/lib/local-db";
import { buildWeeklyPlan } from "@/lib/planner";
import {
  createEmptyRecipeMixCounts,
  getRecipeMixCategory,
  isRecipeMixControlledMeal,
} from "@/lib/recipe-mix";
import type { DayPlan, Recipe, RecipeMixCategory, UserSettings, WeekPlan } from "@/lib/types";

const APP_META_KEY = "app";
const CURRENT_SETTINGS_KEY = "current";
const SEED_RECIPE_SOURCE = "seed" satisfies LocalRecipeSource;

const MEAL_TYPE_ORDER = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
} as const satisfies Record<Recipe["mealType"], number>;

const APP_META_SCHEMA_VERSION = 1;

export const DEFAULT_LOCAL_SETTINGS: UserSettings = {
  calorieTarget: 2000,
  macroCarbsPct: 30,
  macroFatPct: 30,
  macroProteinPct: 40,
  mealsPerDay: 4,
  glutenFreeOnly: true,
  vegetarianSharePct: 40,
  fishSharePct: 20,
  meatSharePct: 40,
  excludedIngredients: [],
  maxRecipeRepeatsPerWeek: 2,
};

export type LocalWeekPlanGenerationReason =
  | "bootstrap"
  | "manual"
  | "day-bootstrap"
  | "settings-change"
  | string;

export type LocalRecipeMixPoolStats = {
  total: number;
  counts: Record<RecipeMixCategory, number>;
};

export type LocalHistoryEntry = LocalHistoryRecord;

export type LocalRecipeListOptions = {
  applySettings?: boolean;
};

export type SaveLocalSettingsOptions = {
  regenerateCurrentWeekPlan?: boolean;
  reason?: LocalWeekPlanGenerationReason;
};

const SEED_RECIPE_HASH = hashString(JSON.stringify(seedRecipes));

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
    hash |= 0;
  }

  return `seed-${(hash >>> 0).toString(16)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function toFiniteNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function clampMinimum(value: number, minimum: number) {
  return Math.max(minimum, value);
}

function sanitizeSettings(settings: UserSettings): UserSettings {
  return {
    calorieTarget: clampMinimum(Math.round(toFiniteNumber(settings.calorieTarget, DEFAULT_LOCAL_SETTINGS.calorieTarget)), 1),
    macroCarbsPct: clampMinimum(toFiniteNumber(settings.macroCarbsPct, DEFAULT_LOCAL_SETTINGS.macroCarbsPct), 0),
    macroFatPct: clampMinimum(toFiniteNumber(settings.macroFatPct, DEFAULT_LOCAL_SETTINGS.macroFatPct), 0),
    macroProteinPct: clampMinimum(
      toFiniteNumber(settings.macroProteinPct, DEFAULT_LOCAL_SETTINGS.macroProteinPct),
      0,
    ),
    mealsPerDay: settings.mealsPerDay >= 4 ? 4 : 3,
    glutenFreeOnly: Boolean(settings.glutenFreeOnly),
    vegetarianSharePct: clampMinimum(
      toFiniteNumber(settings.vegetarianSharePct, DEFAULT_LOCAL_SETTINGS.vegetarianSharePct),
      0,
    ),
    fishSharePct: clampMinimum(toFiniteNumber(settings.fishSharePct, DEFAULT_LOCAL_SETTINGS.fishSharePct), 0),
    meatSharePct: clampMinimum(toFiniteNumber(settings.meatSharePct, DEFAULT_LOCAL_SETTINGS.meatSharePct), 0),
    excludedIngredients: Array.from(
      new Set(
        settings.excludedIngredients
          .map((ingredient) => ingredient.trim())
          .filter(Boolean),
      ),
    ),
    maxRecipeRepeatsPerWeek: clampMinimum(
      Math.round(
        toFiniteNumber(settings.maxRecipeRepeatsPerWeek, DEFAULT_LOCAL_SETTINGS.maxRecipeRepeatsPerWeek),
      ),
      1,
    ),
  };
}

function sortRecipes(recipes: Recipe[]) {
  return [...recipes].sort((left, right) => {
    const mealTypeOrder = MEAL_TYPE_ORDER[left.mealType] - MEAL_TYPE_ORDER[right.mealType];
    if (mealTypeOrder !== 0) {
      return mealTypeOrder;
    }

    return left.name.localeCompare(right.name, "de-DE");
  });
}

function filterRecipesForSettings(recipes: Recipe[], settings: UserSettings) {
  const excludedIngredients = settings.excludedIngredients.map(normalize);

  return recipes
    .filter((recipe) => !settings.glutenFreeOnly || recipe.glutenFree)
    .filter((recipe) => {
      if (excludedIngredients.length === 0) {
        return true;
      }

      return !recipe.ingredients.some((ingredient) =>
        excludedIngredients.includes(normalize(ingredient.name))
      );
    });
}

function toRecipeRecord(
  recipe: Recipe,
  source: LocalRecipeSource,
  savedAt: string,
  existingRecord?: LocalRecipeRecord,
): LocalRecipeRecord {
  return {
    ...cloneLocalData(recipe),
    source,
    createdAt: existingRecord?.createdAt ?? savedAt,
    updatedAt: savedAt,
  };
}

function fromRecipeRecord(record: LocalRecipeRecord): Recipe {
  const recipe = cloneLocalData(record) as Partial<LocalRecipeRecord>;
  delete recipe.source;
  delete recipe.createdAt;
  delete recipe.updatedAt;
  return recipe as Recipe;
}

function createHistoryId(startDate: string, generatedAt: string) {
  const randomSuffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);

  return `${startDate}:${generatedAt}:${randomSuffix}`;
}

function createHistoryRecord(
  plan: WeekPlan,
  generatedBy: LocalWeekPlanGenerationReason,
  savedAt: string,
): LocalHistoryRecord {
  return {
    id: createHistoryId(plan.startDate, plan.generatedAt),
    startDate: plan.startDate,
    endDate: plan.endDate,
    generatedAt: plan.generatedAt,
    generatedBy,
    savedAt,
    averageScore: plan.averageScore,
    averageProteinPct: plan.averageProteinPct,
    averageCarbsPct: plan.averageCarbsPct,
    averageFatPct: plan.averageFatPct,
    dayCount: plan.days.length,
    mealsPerDay: Math.max(...plan.days.map((day) => day.meals.length), 0),
    recipeIds: plan.days.flatMap((day) => day.meals.map((meal) => meal.recipe.id)),
    plan: cloneLocalData(plan),
  };
}

async function readAppMetaRecord() {
  return runLocalTransaction(LOCAL_APP_STORES.meta, "readonly", async (transaction) => {
    const record = await requestToPromise(
      transaction.objectStore(LOCAL_APP_STORES.meta).get(APP_META_KEY),
    );

    return (record as LocalAppMetaRecord | undefined) ?? null;
  });
}

async function readSettingsRecord() {
  return runLocalTransaction(LOCAL_APP_STORES.settings, "readonly", async (transaction) => {
    const record = await requestToPromise(
      transaction.objectStore(LOCAL_APP_STORES.settings).get(CURRENT_SETTINGS_KEY),
    );

    return (record as LocalSettingsRecord | undefined) ?? null;
  });
}

async function readRecipeRecord(id: string) {
  return runLocalTransaction(LOCAL_APP_STORES.recipes, "readonly", async (transaction) => {
    const record = await requestToPromise(transaction.objectStore(LOCAL_APP_STORES.recipes).get(id));

    return (record as LocalRecipeRecord | undefined) ?? null;
  });
}

async function readAllRecipeRecords() {
  return runLocalTransaction(LOCAL_APP_STORES.recipes, "readonly", async (transaction) => {
    const records = await requestToPromise(transaction.objectStore(LOCAL_APP_STORES.recipes).getAll());
    return (records as LocalRecipeRecord[] | undefined) ?? [];
  });
}

async function readWeekPlanRecord(startDate: string) {
  return runLocalTransaction(LOCAL_APP_STORES.weekPlans, "readonly", async (transaction) => {
    const record = await requestToPromise(
      transaction.objectStore(LOCAL_APP_STORES.weekPlans).get(startDate),
    );

    return (record as LocalWeekPlanRecord | undefined) ?? null;
  });
}

async function readHistoryRecords() {
  return runLocalTransaction(LOCAL_APP_STORES.history, "readonly", async (transaction) => {
    const records = await requestToPromise(transaction.objectStore(LOCAL_APP_STORES.history).getAll());
    return (records as LocalHistoryRecord[] | undefined) ?? [];
  });
}

async function readCurrentSettingsValue() {
  const record = await readSettingsRecord();
  return sanitizeSettings(record?.value ?? DEFAULT_LOCAL_SETTINGS);
}

async function readFilteredRecipesForSettings(settings: UserSettings) {
  const records = await readAllRecipeRecords();
  const recipes = sortRecipes(records.map(fromRecipeRecord));
  return sortRecipes(filterRecipesForSettings(recipes, settings));
}

async function readAvailableRecipes(options: LocalRecipeListOptions = {}) {
  const recipes = sortRecipes((await readAllRecipeRecords()).map(fromRecipeRecord));

  if (options.applySettings === false) {
    return recipes;
  }

  return readFilteredRecipesForSettings(await readCurrentSettingsValue());
}

async function storeWeekPlan(plan: WeekPlan, generatedBy: LocalWeekPlanGenerationReason) {
  const savedAt = nowIso();
  const weekPlanRecord: LocalWeekPlanRecord = {
    startDate: plan.startDate,
    endDate: plan.endDate,
    generatedAt: plan.generatedAt,
    generatedBy,
    savedAt,
    plan: cloneLocalData(plan),
  };
  const historyRecord = createHistoryRecord(plan, generatedBy, savedAt);

  await runLocalTransaction(
    [LOCAL_APP_STORES.weekPlans, LOCAL_APP_STORES.history],
    "readwrite",
    async (transaction) => {
      await requestToPromise(
        transaction.objectStore(LOCAL_APP_STORES.weekPlans).put(weekPlanRecord),
      );
      await requestToPromise(transaction.objectStore(LOCAL_APP_STORES.history).put(historyRecord));
    },
  );

  return cloneLocalData(plan);
}

async function generateAndStoreWeekPlan(
  startDate: string,
  generatedBy: LocalWeekPlanGenerationReason,
) {
  await ensureLocalAppData();

  const settings = await readCurrentSettingsValue();
  const recipes = await readFilteredRecipesForSettings(settings);
  const plan = buildWeeklyPlan(startDate, recipes, settings);

  return storeWeekPlan(plan, generatedBy);
}

export async function ensureLocalAppData() {
  const savedAt = nowIso();

  await runLocalTransaction(
    [LOCAL_APP_STORES.meta, LOCAL_APP_STORES.settings, LOCAL_APP_STORES.recipes],
    "readwrite",
    async (transaction) => {
      const metaStore = transaction.objectStore(LOCAL_APP_STORES.meta);
      const settingsStore = transaction.objectStore(LOCAL_APP_STORES.settings);
      const recipesStore = transaction.objectStore(LOCAL_APP_STORES.recipes);

      const [existingMeta, existingSettings, existingSeedRecipes] = await Promise.all([
        requestToPromise(metaStore.get(APP_META_KEY)).then(
          (record) => (record as LocalAppMetaRecord | undefined) ?? null,
        ),
        requestToPromise(settingsStore.get(CURRENT_SETTINGS_KEY)).then(
          (record) => (record as LocalSettingsRecord | undefined) ?? null,
        ),
        requestToPromise(recipesStore.index("bySource").getAll(SEED_RECIPE_SOURCE)).then(
          (records) => (records as LocalRecipeRecord[] | undefined) ?? [],
        ),
      ]);

      if (!existingSettings) {
        const settingsRecord: LocalSettingsRecord = {
          key: "current",
          value: cloneLocalData(DEFAULT_LOCAL_SETTINGS),
          updatedAt: savedAt,
        };

        await requestToPromise(settingsStore.put(settingsRecord));
      }

      const shouldSyncSeedRecipes =
        !existingMeta ||
        existingMeta.currentSeedHash !== SEED_RECIPE_HASH ||
        existingSeedRecipes.length === 0;

      if (shouldSyncSeedRecipes) {
        const currentSeedRecipesById = new Map(
          existingSeedRecipes.map((recipe) => [recipe.id, recipe]),
        );
        const seedRecipeIds = new Set(seedRecipes.map((recipe) => recipe.id));

        for (const record of existingSeedRecipes) {
          if (!seedRecipeIds.has(record.id)) {
            await requestToPromise(recipesStore.delete(record.id));
          }
        }

        for (const recipe of seedRecipes) {
          await requestToPromise(
            recipesStore.put(
              toRecipeRecord(recipe, SEED_RECIPE_SOURCE, savedAt, currentSeedRecipesById.get(recipe.id)),
            ),
          );
        }
      }

      const nextMeta: LocalAppMetaRecord = {
        key: "app",
        schemaVersion: APP_META_SCHEMA_VERSION,
        initializedAt: existingMeta?.initializedAt ?? savedAt,
        lastOpenedAt: savedAt,
        currentSeedHash: SEED_RECIPE_HASH,
        lastSeedSyncAt:
          shouldSyncSeedRecipes ? savedAt : (existingMeta?.lastSeedSyncAt ?? savedAt),
      };

      await requestToPromise(metaStore.put(nextMeta));
    },
  );
}

export async function getLocalSettings() {
  await ensureLocalAppData();
  return cloneLocalData(await readCurrentSettingsValue());
}

export async function saveLocalSettings(
  settings: UserSettings,
  options: SaveLocalSettingsOptions = {},
) {
  await ensureLocalAppData();

  const nextSettings = sanitizeSettings(settings);
  const settingsRecord: LocalSettingsRecord = {
    key: "current",
    value: cloneLocalData(nextSettings),
    updatedAt: nowIso(),
  };

  await runLocalTransaction(LOCAL_APP_STORES.settings, "readwrite", async (transaction) => {
    await requestToPromise(transaction.objectStore(LOCAL_APP_STORES.settings).put(settingsRecord));
  });

  if (options.regenerateCurrentWeekPlan) {
    await regenerateCurrentLocalWeekPlan(options.reason ?? "settings-change");
  }

  return cloneLocalData(nextSettings);
}

export async function listLocalRecipes(options: LocalRecipeListOptions = {}) {
  await ensureLocalAppData();
  return cloneLocalData(await readAvailableRecipes(options));
}

export async function getLocalRecipeById(id: string) {
  await ensureLocalAppData();
  const recipeRecord = await readRecipeRecord(id);
  return recipeRecord ? fromRecipeRecord(recipeRecord) : null;
}

export async function getLocalWeekPlan(startDate: string) {
  await ensureLocalAppData();
  const record = await readWeekPlanRecord(startDate);
  return record ? cloneLocalData(record.plan) : null;
}

export async function getCurrentLocalWeekPlan() {
  const startDate = getCurrentWeekStart();
  const plan = await getLocalWeekPlan(startDate);
  return plan ?? generateAndStoreWeekPlan(startDate, "bootstrap");
}

export async function regenerateCurrentLocalWeekPlan(
  reason: LocalWeekPlanGenerationReason = "manual",
) {
  return generateAndStoreWeekPlan(getCurrentWeekStart(), reason);
}

export async function getLocalDayPlan(date: string) {
  await ensureLocalAppData();

  const weekStart = getWeekStartForDate(date);
  const weekPlan =
    (await getLocalWeekPlan(weekStart)) ??
    (await generateAndStoreWeekPlan(weekStart, "day-bootstrap"));

  return cloneLocalData(weekPlan.days.find((day) => day.date === date) ?? null) as DayPlan | null;
}

export async function getLocalRecipeMixPoolStats(): Promise<LocalRecipeMixPoolStats> {
  const recipes = (await listLocalRecipes()).filter(isRecipeMixControlledMeal);
  const counts = createEmptyRecipeMixCounts();

  for (const recipe of recipes) {
    counts[getRecipeMixCategory(recipe)] += 1;
  }

  return {
    total: recipes.length,
    counts,
  };
}

export async function listLocalHistoryEntries(limit?: number) {
  await ensureLocalAppData();

  const records = (await readHistoryRecords()).sort((left, right) =>
    right.generatedAt.localeCompare(left.generatedAt),
  );
  const slicedRecords = typeof limit === "number" ? records.slice(0, limit) : records;

  return cloneLocalData(slicedRecords);
}

export async function getLocalAppMeta() {
  await ensureLocalAppData();
  const meta = await readAppMetaRecord();
  return meta ? cloneLocalData(meta) : null;
}
