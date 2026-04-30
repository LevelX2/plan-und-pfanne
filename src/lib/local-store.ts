"use client";

import { seedRecipes } from "@/lib/data/seed-recipes";
import { addDays, listDatesInRange, todayInBerlinIso, tomorrowInBerlinIso } from "@/lib/date";
import {
  LOCAL_APP_STORES,
  type LocalAppMetaRecord,
  type LocalMealTypeRecord,
  type LocalPlannedDayRecord,
  type LocalPlannedMealRecord,
  type LocalRecipeDefaultMealTypeAssignmentRecord,
  type LocalRecipeFavoriteRecord,
  type LocalRecipeMealTypePreferenceRecord,
  type LocalRecipeRecord,
  type LocalRecipeSource,
  type LocalSettingsRecord,
  cloneLocalData,
  requestToPromise,
  runLocalTransaction,
} from "@/lib/local-db";
import { buildDayPlanRange, calculateTargets, evaluateMeals, multiplyRecipe } from "@/lib/planner";
import { createDefaultProteinTargets, normalizeProteinTargets } from "@/lib/protein-targets";
import {
  createEmptyRecipeMixCounts,
  getRecipeMixCategory,
  isRecipeMixControlledMeal,
} from "@/lib/recipe-mix";
import type {
  DayPlan,
  EffectiveRecipeMealTypePreference,
  FrequencyWeight,
  MealType,
  PlannedDayRecord,
  PlannedDaySourceType,
  PlannedMeal,
  PlannedMealRecord,
  Recipe,
  RecipeFavorite,
  RecipeMealTypePreference,
  RecipeMixCategory,
  UserSettings,
  WeekPlan,
} from "@/lib/types";

const APP_META_KEY = "app";
const CURRENT_SETTINGS_KEY = "current";
const SEED_RECIPE_SOURCE = "seed" satisfies LocalRecipeSource;
const LOCAL_USER_ID = "local";
const APP_META_SCHEMA_VERSION = 2;

const mealTypes = [
  { id: "meal-type-breakfast", key: "breakfast", label: "Frühstück", sortOrder: 0 },
  { id: "meal-type-lunch", key: "lunch", label: "Mittagessen", sortOrder: 1 },
  { id: "meal-type-dinner", key: "dinner", label: "Abendessen", sortOrder: 2 },
  { id: "meal-type-snack", key: "snack", label: "Snack", sortOrder: 3 },
] as const satisfies LocalMealTypeRecord[];

const mealTypeOrder = mealTypes.map((mealType) => mealType.key);

const MEAL_TYPE_ORDER = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
} as const satisfies Record<MealType, number>;

export const DEFAULT_LOCAL_SETTINGS: UserSettings = {
  calorieTarget: 2000,
  macroCarbsPct: 30,
  macroFatPct: 30,
  macroProteinPct: 40,
  defaultPeopleCount: 2,
  proteinTargets: createDefaultProteinTargets(),
  includeSnackByDefault: true,
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

export type LocalHistoryEntry = DayPlan;

export type LocalRecipeListOptions = {
  applySettings?: boolean;
};

export type SaveLocalSettingsOptions = {
  regenerateCurrentWeekPlan?: boolean;
  reason?: LocalWeekPlanGenerationReason;
};

export type GenerateLocalPlanRangeInput = {
  startDate: string;
  endDate: string;
  peopleCount: number;
  overwrite?: boolean;
  sourceType?: PlannedDaySourceType;
};

export type CopyLocalPlannedDaysInput = {
  sourceStartDate: string;
  sourceEndDate: string;
  targetStartDate: string;
  targetEndDate: string;
  overwrite?: boolean;
};

export type DeleteOldPlansInput = {
  olderThanDate: string;
};

export class LocalPlanOverlapError extends Error {
  dates: string[];

  constructor(dates: string[]) {
    super(`Für ${dates.length} Tage im gewählten Zeitraum existieren bereits geplante Mahlzeiten.`);
    this.name = "LocalPlanOverlapError";
    this.dates = dates;
  }
}

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

function newId(prefix: string) {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 12);

  return `${prefix}-${suffix}`;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function toFiniteNumber(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function clampMinimum(value: number, minimum: number) {
  return Math.max(minimum, value);
}

function sanitizeSettings(settings: Partial<UserSettings> | UserSettings): UserSettings {
  const defaultPeopleCount = clamp(
    Math.round(toFiniteNumber(settings.defaultPeopleCount, DEFAULT_LOCAL_SETTINGS.defaultPeopleCount)),
    1,
    12,
  );
  const includeSnackByDefault = settings.includeSnackByDefault ?? settings.mealsPerDay === 4;

  return {
    calorieTarget: clampMinimum(
      Math.round(toFiniteNumber(settings.calorieTarget, DEFAULT_LOCAL_SETTINGS.calorieTarget)),
      1,
    ),
    macroCarbsPct: clampMinimum(toFiniteNumber(settings.macroCarbsPct, DEFAULT_LOCAL_SETTINGS.macroCarbsPct), 0),
    macroFatPct: clampMinimum(toFiniteNumber(settings.macroFatPct, DEFAULT_LOCAL_SETTINGS.macroFatPct), 0),
    macroProteinPct: clampMinimum(
      toFiniteNumber(settings.macroProteinPct, DEFAULT_LOCAL_SETTINGS.macroProteinPct),
      0,
    ),
    defaultPeopleCount,
    proteinTargets: normalizeProteinTargets(settings.proteinTargets, DEFAULT_LOCAL_SETTINGS.proteinTargets.length),
    includeSnackByDefault,
    mealsPerDay: includeSnackByDefault ? 4 : 3,
    glutenFreeOnly: settings.glutenFreeOnly ?? true,
    vegetarianSharePct: clampMinimum(
      toFiniteNumber(settings.vegetarianSharePct, DEFAULT_LOCAL_SETTINGS.vegetarianSharePct),
      0,
    ),
    fishSharePct: clampMinimum(toFiniteNumber(settings.fishSharePct, DEFAULT_LOCAL_SETTINGS.fishSharePct), 0),
    meatSharePct: clampMinimum(toFiniteNumber(settings.meatSharePct, DEFAULT_LOCAL_SETTINGS.meatSharePct), 0),
    excludedIngredients: Array.from(
      new Set(
        (settings.excludedIngredients ?? [])
          .map((ingredient) => ingredient.trim())
          .filter(Boolean),
      ),
    ),
    maxRecipeRepeatsPerWeek: clamp(
      Math.round(
        toFiniteNumber(settings.maxRecipeRepeatsPerWeek, DEFAULT_LOCAL_SETTINGS.maxRecipeRepeatsPerWeek),
      ),
      1,
      7,
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
        excludedIngredients.includes(normalize(ingredient.name)),
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

function defaultAssignmentId(recipeId: string, mealType: MealType) {
  return `${recipeId}:${mealType}`;
}

function preferenceId(recipeId: string, mealType: MealType) {
  return `${LOCAL_USER_ID}:${recipeId}:${mealType}`;
}

function favoriteId(recipeId: string) {
  return `${LOCAL_USER_ID}:${recipeId}`;
}

function isDefaultMealTypeEnabled(recipe: Recipe, mealType: MealType) {
  const lunchOrDinnerRecipe = recipe.mealType === "lunch" || recipe.mealType === "dinner";
  return recipe.mealType === mealType || (lunchOrDinnerRecipe && (mealType === "lunch" || mealType === "dinner"));
}

function toDefaultAssignment(recipe: Recipe, mealType: MealType): LocalRecipeDefaultMealTypeAssignmentRecord {
  return {
    id: defaultAssignmentId(recipe.id, mealType),
    recipeId: recipe.id,
    mealType,
    defaultEnabled: isDefaultMealTypeEnabled(recipe, mealType),
  };
}

function createPlannedDayId(date: string) {
  return `planned-day:${date}`;
}

function createPlannedMealId(date: string, mealType: MealType, sortOrder: number) {
  return `planned-meal:${date}:${mealType}:${sortOrder}:${newId("slot")}`;
}

function formatDateRangePlan(startDate: string, endDate: string, days: DayPlan[], generatedAt = nowIso()): WeekPlan {
  const averageScore = days.length
    ? Number((days.reduce((sum, day) => sum + day.score, 0) / days.length).toFixed(2))
    : 0;

  return {
    startDate,
    endDate,
    generatedAt,
    averageScore,
    averageProteinPct: days.length
      ? Number((days.reduce((sum, day) => sum + day.macroPercents.protein, 0) / days.length).toFixed(1))
      : 0,
    averageCarbsPct: days.length
      ? Number((days.reduce((sum, day) => sum + day.macroPercents.carbs, 0) / days.length).toFixed(1))
      : 0,
    averageFatPct: days.length
      ? Number((days.reduce((sum, day) => sum + day.macroPercents.fat, 0) / days.length).toFixed(1))
      : 0,
    days,
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

async function readDefaultAssignments() {
  return runLocalTransaction(
    LOCAL_APP_STORES.recipeDefaultMealTypeAssignments,
    "readonly",
    async (transaction) => {
      const records = await requestToPromise(
        transaction.objectStore(LOCAL_APP_STORES.recipeDefaultMealTypeAssignments).getAll(),
      );
      return (records as LocalRecipeDefaultMealTypeAssignmentRecord[] | undefined) ?? [];
    },
  );
}

async function readUserRecipePreferences() {
  return runLocalTransaction(
    LOCAL_APP_STORES.userRecipeMealTypePreferences,
    "readonly",
    async (transaction) => {
      const records = await requestToPromise(
        transaction.objectStore(LOCAL_APP_STORES.userRecipeMealTypePreferences).getAll(),
      );
      return (records as LocalRecipeMealTypePreferenceRecord[] | undefined) ?? [];
    },
  );
}

async function readUserRecipeFavorites() {
  return runLocalTransaction(LOCAL_APP_STORES.userRecipeFavorites, "readonly", async (transaction) => {
    const records = await requestToPromise(
      transaction.objectStore(LOCAL_APP_STORES.userRecipeFavorites).getAll(),
    );
    return (records as LocalRecipeFavoriteRecord[] | undefined) ?? [];
  });
}

async function readPlannedDayRecords(startDate?: string, endDate?: string) {
  return runLocalTransaction(LOCAL_APP_STORES.plannedDays, "readonly", async (transaction) => {
    const store = transaction.objectStore(LOCAL_APP_STORES.plannedDays);
    const request =
      startDate && endDate
        ? store.getAll(IDBKeyRange.bound(startDate, endDate))
        : store.getAll();
    const records = await requestToPromise(request);
    return ((records as LocalPlannedDayRecord[] | undefined) ?? []).sort((left, right) =>
      left.date.localeCompare(right.date),
    );
  });
}

async function readPlannedMealRecordsForDates(dates: string[]) {
  if (dates.length === 0) {
    return [];
  }

  return runLocalTransaction(LOCAL_APP_STORES.plannedMeals, "readonly", async (transaction) => {
    const index = transaction.objectStore(LOCAL_APP_STORES.plannedMeals).index("byDate");
    const nestedRecords = await Promise.all(
      dates.map((date) =>
        requestToPromise(index.getAll(date)).then(
          (records) => (records as LocalPlannedMealRecord[] | undefined) ?? [],
        ),
      ),
    );

    return nestedRecords.flat();
  });
}

async function readPlannedMealRecord(id: string) {
  return runLocalTransaction(LOCAL_APP_STORES.plannedMeals, "readonly", async (transaction) => {
    const record = await requestToPromise(transaction.objectStore(LOCAL_APP_STORES.plannedMeals).get(id));
    return (record as LocalPlannedMealRecord | undefined) ?? null;
  });
}

async function readCurrentSettingsValue() {
  const record = await readSettingsRecord();
  return sanitizeSettings(record?.value ?? DEFAULT_LOCAL_SETTINGS);
}

async function readAvailableRecipes(options: LocalRecipeListOptions = {}) {
  const recipes = sortRecipes((await readAllRecipeRecords()).map(fromRecipeRecord));

  if (options.applySettings === false) {
    return recipes;
  }

  return sortRecipes(filterRecipesForSettings(recipes, await readCurrentSettingsValue()));
}

async function readEffectiveRecipeMealTypePreferences() {
  await ensureLocalAppData();

  const [recipes, defaults, userPreferences] = await Promise.all([
    readAvailableRecipes({ applySettings: false }),
    readDefaultAssignments(),
    readUserRecipePreferences(),
  ]);
  const defaultsById = new Map(defaults.map((entry) => [entry.id, entry]));
  const userPreferencesById = new Map(userPreferences.map((entry) => [entry.id, entry]));

  return recipes.flatMap((recipe) =>
    mealTypeOrder.map((mealType) => {
      const assignment = defaultsById.get(defaultAssignmentId(recipe.id, mealType));
      const userPreference = userPreferencesById.get(preferenceId(recipe.id, mealType));
      const defaultEnabled = assignment?.defaultEnabled ?? isDefaultMealTypeEnabled(recipe, mealType);

      return {
        recipe,
        mealType,
        defaultEnabled,
        enabledForPlanning: userPreference?.enabledForPlanning ?? defaultEnabled,
        frequencyWeight: userPreference?.frequencyWeight ?? "normal",
        updatedAt: userPreference?.updatedAt ?? null,
      } satisfies EffectiveRecipeMealTypePreference;
    }),
  );
}

function hydratePlannedDay(
  dayRecord: PlannedDayRecord,
  mealRecords: PlannedMealRecord[],
  recipesById: Map<string, Recipe>,
  settings: UserSettings,
): DayPlan {
  const meals = mealRecords
    .filter((meal) => meal.date === dayRecord.date)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((meal): PlannedMeal | null => {
      const recipe = recipesById.get(meal.recipeId);
      if (!recipe) {
        return null;
      }

      return {
        id: meal.id,
        plannedDayId: meal.plannedDayId,
        date: meal.date,
        mealType: meal.mealType,
        recipe,
        portionFactor: 1,
        calculated: multiplyRecipe(recipe, 1),
        peopleCount: meal.peopleCount,
        isEnabled: meal.isEnabled,
        includeInShoppingList: meal.includeInShoppingList,
        sortOrder: meal.sortOrder,
        createdAt: meal.createdAt,
        updatedAt: meal.updatedAt,
      };
    })
    .filter((meal): meal is PlannedMeal => Boolean(meal));
  const evaluation = evaluateMeals(meals, settings);

  return {
    id: dayRecord.id,
    date: dayRecord.date,
    weekdayLabel: new Intl.DateTimeFormat("de-DE", {
      weekday: "long",
      timeZone: "UTC",
    })
      .format(new Date(`${dayRecord.date}T00:00:00.000Z`))
      .replace(/^./, (match) => match.toLocaleUpperCase("de-DE")),
    meals,
    totals: evaluation.totals,
    targets: evaluation.targets,
    macroPercents: evaluation.macroPercents,
    score: evaluation.score,
    withinTolerance: evaluation.withinTolerance,
    sourceType: dayRecord.sourceType,
    sourcePeriodStart: dayRecord.sourcePeriodStart,
    sourcePeriodEnd: dayRecord.sourcePeriodEnd,
    copiedFromStart: dayRecord.copiedFromStart,
    copiedFromEnd: dayRecord.copiedFromEnd,
    createdAt: dayRecord.createdAt,
    updatedAt: dayRecord.updatedAt,
  };
}

async function hydratePlannedDays(dayRecords: PlannedDayRecord[]) {
  if (dayRecords.length === 0) {
    return [];
  }

  const [settings, recipes, mealRecords] = await Promise.all([
    readCurrentSettingsValue(),
    readAvailableRecipes({ applySettings: false }),
    readPlannedMealRecordsForDates(dayRecords.map((day) => day.date)),
  ]);
  const recipesById = new Map(recipes.map((recipe) => [recipe.id, recipe]));

  return dayRecords.map((day) => hydratePlannedDay(day, mealRecords, recipesById, settings));
}

async function deleteMealsForDatesInTransaction(transaction: IDBTransaction, dates: string[]) {
  const mealsStore = transaction.objectStore(LOCAL_APP_STORES.plannedMeals);
  const byDate = mealsStore.index("byDate");

  for (const date of dates) {
    const records = await requestToPromise(byDate.getAll(date));
    for (const record of (records as LocalPlannedMealRecord[] | undefined) ?? []) {
      await requestToPromise(mealsStore.delete(record.id));
    }
  }
}

async function storeGeneratedDayPlans(input: {
  days: DayPlan[];
  sourceType: PlannedDaySourceType;
  sourcePeriodStart: string;
  sourcePeriodEnd: string;
  copiedFromStart?: string | null;
  copiedFromEnd?: string | null;
  peopleCount: number;
}) {
  const savedAt = nowIso();
  const dates = input.days.map((day) => day.date);

  await runLocalTransaction(
    [LOCAL_APP_STORES.plannedDays, LOCAL_APP_STORES.plannedMeals],
    "readwrite",
    async (transaction) => {
      const daysStore = transaction.objectStore(LOCAL_APP_STORES.plannedDays);
      const mealsStore = transaction.objectStore(LOCAL_APP_STORES.plannedMeals);

      await deleteMealsForDatesInTransaction(transaction, dates);

      for (const date of dates) {
        await requestToPromise(daysStore.delete(date));
      }

      for (const day of input.days) {
        const plannedDayId = createPlannedDayId(day.date);
        const dayRecord: LocalPlannedDayRecord = {
          id: plannedDayId,
          date: day.date,
          sourceType: input.sourceType,
          sourcePeriodStart: input.sourcePeriodStart,
          sourcePeriodEnd: input.sourcePeriodEnd,
          copiedFromStart: input.copiedFromStart ?? null,
          copiedFromEnd: input.copiedFromEnd ?? null,
          createdAt: savedAt,
          updatedAt: savedAt,
        };

        await requestToPromise(daysStore.put(dayRecord));

        for (const [index, meal] of day.meals.entries()) {
          const mealRecord: LocalPlannedMealRecord = {
            id: createPlannedMealId(day.date, meal.mealType, index),
            plannedDayId,
            date: day.date,
            mealType: meal.mealType,
            recipeId: meal.recipe.id,
            peopleCount: input.peopleCount,
            isEnabled: true,
            includeInShoppingList: true,
            sortOrder: index,
            createdAt: savedAt,
            updatedAt: savedAt,
          };

          await requestToPromise(mealsStore.put(mealRecord));
        }
      }
    },
  );

  return listLocalPlannedDays(input.sourcePeriodStart, input.sourcePeriodEnd);
}

async function createCopiedDayPlans(input: CopyLocalPlannedDaysInput) {
  const [settings, recipes, preferences, sourceDays] = await Promise.all([
    readCurrentSettingsValue(),
    readAvailableRecipes(),
    readEffectiveRecipeMealTypePreferences(),
    listLocalPlannedDays(input.sourceStartDate, input.sourceEndDate),
  ]);
  const recipesById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const targetDates = listDatesInRange(input.targetStartDate, input.targetEndDate);
  const generatedFallbackDays = buildDayPlanRange({
    startDate: input.targetStartDate,
    endDate: input.targetEndDate,
    recipes,
    preferences,
    settings,
  });

  return targetDates.map((targetDate, index) => {
    const sourceDay = sourceDays[index] ?? null;

    if (!sourceDay) {
      return generatedFallbackDays[index];
    }

    const meals = sourceDay.meals
      .map((sourceMeal, mealIndex): PlannedMeal | null => {
        const recipe = recipesById.get(sourceMeal.recipe.id);
        if (!recipe) {
          return null;
        }

        return {
          mealType: sourceMeal.mealType,
          portionFactor: 1,
          recipe,
          calculated: multiplyRecipe(recipe, 1),
          peopleCount: settings.defaultPeopleCount,
          isEnabled: true,
          includeInShoppingList: true,
          sortOrder: mealIndex,
        };
      })
      .filter((meal): meal is PlannedMeal => Boolean(meal));
    const evaluation = evaluateMeals(meals, settings);

    return {
      date: targetDate,
      weekdayLabel: new Intl.DateTimeFormat("de-DE", {
        weekday: "long",
        timeZone: "UTC",
      })
        .format(new Date(`${targetDate}T00:00:00.000Z`))
        .replace(/^./, (match) => match.toLocaleUpperCase("de-DE")),
      meals,
      targets: evaluation.targets,
      totals: evaluation.totals,
      macroPercents: evaluation.macroPercents,
      score: evaluation.score,
      withinTolerance: evaluation.withinTolerance,
    } satisfies DayPlan;
  });
}

export async function ensureLocalAppData() {
  const savedAt = nowIso();

  await runLocalTransaction(
    [
      LOCAL_APP_STORES.meta,
      LOCAL_APP_STORES.settings,
      LOCAL_APP_STORES.recipes,
      LOCAL_APP_STORES.mealTypes,
      LOCAL_APP_STORES.recipeDefaultMealTypeAssignments,
    ],
    "readwrite",
    async (transaction) => {
      const metaStore = transaction.objectStore(LOCAL_APP_STORES.meta);
      const settingsStore = transaction.objectStore(LOCAL_APP_STORES.settings);
      const recipesStore = transaction.objectStore(LOCAL_APP_STORES.recipes);
      const mealTypesStore = transaction.objectStore(LOCAL_APP_STORES.mealTypes);
      const defaultsStore = transaction.objectStore(LOCAL_APP_STORES.recipeDefaultMealTypeAssignments);

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

      for (const mealType of mealTypes) {
        await requestToPromise(mealTypesStore.put(mealType));
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

      for (const recipe of seedRecipes) {
        for (const mealType of mealTypeOrder) {
          await requestToPromise(defaultsStore.put(toDefaultAssignment(recipe, mealType)));
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

export async function listLocalRecipeMealTypePreferences() {
  return cloneLocalData(await readEffectiveRecipeMealTypePreferences());
}

export async function listLocalRecipeFavorites() {
  await ensureLocalAppData();
  const favorites = await readUserRecipeFavorites();
  const recipeIds = favorites
    .filter((favorite) => favorite.isFavorite)
    .map((favorite) => favorite.recipeId);

  return cloneLocalData(recipeIds);
}

export async function saveLocalRecipeFavorite(recipeId: string, isFavorite: boolean) {
  await ensureLocalAppData();

  const record: RecipeFavorite = {
    id: favoriteId(recipeId),
    recipeId,
    isFavorite,
    updatedAt: nowIso(),
  };

  await runLocalTransaction(LOCAL_APP_STORES.userRecipeFavorites, "readwrite", async (transaction) => {
    await requestToPromise(transaction.objectStore(LOCAL_APP_STORES.userRecipeFavorites).put(record));
  });

  return cloneLocalData(record);
}

export async function saveLocalRecipeMealTypePreference(input: {
  recipeId: string;
  mealType: MealType;
  enabledForPlanning: boolean;
  frequencyWeight: FrequencyWeight;
}) {
  await ensureLocalAppData();

  const record: RecipeMealTypePreference = {
    id: preferenceId(input.recipeId, input.mealType),
    recipeId: input.recipeId,
    mealType: input.mealType,
    enabledForPlanning: input.enabledForPlanning,
    frequencyWeight: input.frequencyWeight,
    updatedAt: nowIso(),
  };

  await runLocalTransaction(
    LOCAL_APP_STORES.userRecipeMealTypePreferences,
    "readwrite",
    async (transaction) => {
      await requestToPromise(
        transaction.objectStore(LOCAL_APP_STORES.userRecipeMealTypePreferences).put(record),
      );
    },
  );

  return cloneLocalData(record);
}

export async function findLocalPlanOverlaps(startDate: string, endDate: string) {
  await ensureLocalAppData();
  const records = await readPlannedDayRecords(startDate, endDate);
  return records.map((record) => record.date);
}

export async function generateLocalPlanRange(input: GenerateLocalPlanRangeInput) {
  await ensureLocalAppData();

  const overlaps = await findLocalPlanOverlaps(input.startDate, input.endDate);
  if (overlaps.length > 0 && !input.overwrite) {
    throw new LocalPlanOverlapError(overlaps);
  }

  const [settings, recipes, preferences] = await Promise.all([
    readCurrentSettingsValue(),
    readAvailableRecipes(),
    readEffectiveRecipeMealTypePreferences(),
  ]);
  const peopleCount = clamp(Math.round(input.peopleCount), 1, 12);
  const days = buildDayPlanRange({
    startDate: input.startDate,
    endDate: input.endDate,
    recipes,
    preferences,
    settings: {
      ...settings,
      defaultPeopleCount: peopleCount,
    },
  });

  return storeGeneratedDayPlans({
    days,
    sourceType: input.sourceType ?? "generated",
    sourcePeriodStart: input.startDate,
    sourcePeriodEnd: input.endDate,
    peopleCount,
  });
}

export async function listLocalPlannedDays(startDate?: string, endDate?: string) {
  await ensureLocalAppData();
  const records = await readPlannedDayRecords(startDate, endDate);
  return cloneLocalData(await hydratePlannedDays(records));
}

export async function getLocalPlannedDay(date: string) {
  const days = await listLocalPlannedDays(date, date);
  return days[0] ?? null;
}

export async function getLocalDayPlan(date: string) {
  return getLocalPlannedDay(date);
}

export async function getLocalPlanRange(startDate: string, endDate: string) {
  const days = await listLocalPlannedDays(startDate, endDate);
  return formatDateRangePlan(startDate, endDate, days, days[0]?.createdAt ?? nowIso());
}

export async function updateLocalPlannedMeal(
  mealId: string,
  patch: Partial<Pick<PlannedMealRecord, "peopleCount" | "isEnabled" | "includeInShoppingList">>,
) {
  await ensureLocalAppData();
  const existing = await readPlannedMealRecord(mealId);
  if (!existing) {
    throw new Error("Die geplante Mahlzeit wurde nicht gefunden.");
  }

  const nextRecord: LocalPlannedMealRecord = {
    ...existing,
    peopleCount:
      typeof patch.peopleCount === "number"
        ? clamp(Math.round(patch.peopleCount), 1, 12)
        : existing.peopleCount,
    isEnabled: typeof patch.isEnabled === "boolean" ? patch.isEnabled : existing.isEnabled,
    includeInShoppingList:
      typeof patch.includeInShoppingList === "boolean"
        ? patch.includeInShoppingList
        : existing.includeInShoppingList,
    updatedAt: nowIso(),
  };

  await runLocalTransaction(
    [LOCAL_APP_STORES.plannedMeals, LOCAL_APP_STORES.plannedDays],
    "readwrite",
    async (transaction) => {
      await requestToPromise(transaction.objectStore(LOCAL_APP_STORES.plannedMeals).put(nextRecord));
      const dayRecord = (await requestToPromise(
        transaction.objectStore(LOCAL_APP_STORES.plannedDays).get(existing.date),
      )) as LocalPlannedDayRecord | undefined;
      if (dayRecord) {
        await requestToPromise(
          transaction.objectStore(LOCAL_APP_STORES.plannedDays).put({
            ...dayRecord,
            sourceType: "manual",
            updatedAt: nowIso(),
          } satisfies LocalPlannedDayRecord),
        );
      }
    },
  );

  return getLocalPlannedDay(existing.date);
}

export async function replaceLocalPlannedMealRecipe(mealId: string, recipeId: string) {
  await ensureLocalAppData();
  const [existing, recipe] = await Promise.all([readPlannedMealRecord(mealId), getLocalRecipeById(recipeId)]);
  if (!existing) {
    throw new Error("Die geplante Mahlzeit wurde nicht gefunden.");
  }
  if (!recipe) {
    throw new Error("Das gewählte Rezept wurde nicht gefunden.");
  }

  const nextRecord: LocalPlannedMealRecord = {
    ...existing,
    recipeId: recipe.id,
    isEnabled: true,
    updatedAt: nowIso(),
  };

  await runLocalTransaction(
    [LOCAL_APP_STORES.plannedMeals, LOCAL_APP_STORES.plannedDays],
    "readwrite",
    async (transaction) => {
      await requestToPromise(transaction.objectStore(LOCAL_APP_STORES.plannedMeals).put(nextRecord));
      const dayRecord = (await requestToPromise(
        transaction.objectStore(LOCAL_APP_STORES.plannedDays).get(existing.date),
      )) as LocalPlannedDayRecord | undefined;
      if (dayRecord) {
        await requestToPromise(
          transaction.objectStore(LOCAL_APP_STORES.plannedDays).put({
            ...dayRecord,
            sourceType: "manual",
            updatedAt: nowIso(),
          } satisfies LocalPlannedDayRecord),
        );
      }
    },
  );

  return getLocalPlannedDay(existing.date);
}

export async function addLocalSnackToDay(date: string, recipeId?: string) {
  await ensureLocalAppData();
  const [day, settings, recipes, preferences] = await Promise.all([
    getLocalPlannedDay(date),
    readCurrentSettingsValue(),
    readAvailableRecipes(),
    readEffectiveRecipeMealTypePreferences(),
  ]);
  if (!day?.id) {
    throw new Error("Für diesen Tag existiert noch kein Plan.");
  }

  const allowedSnackIds = new Set(
    preferences
      .filter((preference) => preference.mealType === "snack" && preference.enabledForPlanning)
      .map((preference) => preference.recipe.id),
  );
  const snackRecipe =
    (recipeId ? recipes.find((recipe) => recipe.id === recipeId && allowedSnackIds.has(recipe.id)) : null) ??
    recipes.find((recipe) => allowedSnackIds.has(recipe.id));

  if (!snackRecipe) {
    throw new Error("Es ist kein freigegebener Snack verfügbar.");
  }

  const savedAt = nowIso();
  const maxSortOrder = day.meals.reduce((max, meal) => Math.max(max, meal.sortOrder ?? 0), 0);
  const mealRecord: LocalPlannedMealRecord = {
    id: createPlannedMealId(date, "snack", maxSortOrder + 1),
    plannedDayId: day.id,
    date,
    mealType: "snack",
    recipeId: snackRecipe.id,
    peopleCount: settings.defaultPeopleCount,
    isEnabled: true,
    includeInShoppingList: true,
    sortOrder: maxSortOrder + 1,
    createdAt: savedAt,
    updatedAt: savedAt,
  };

  await runLocalTransaction(
    [LOCAL_APP_STORES.plannedMeals, LOCAL_APP_STORES.plannedDays],
    "readwrite",
    async (transaction) => {
      await requestToPromise(transaction.objectStore(LOCAL_APP_STORES.plannedMeals).put(mealRecord));
      const dayRecord = (await requestToPromise(
        transaction.objectStore(LOCAL_APP_STORES.plannedDays).get(date),
      )) as LocalPlannedDayRecord | undefined;
      if (dayRecord) {
        await requestToPromise(
          transaction.objectStore(LOCAL_APP_STORES.plannedDays).put({
            ...dayRecord,
            sourceType: "manual",
            updatedAt: savedAt,
          } satisfies LocalPlannedDayRecord),
        );
      }
    },
  );

  return getLocalPlannedDay(date);
}

export async function deleteLocalPlannedMeal(mealId: string) {
  await ensureLocalAppData();
  const existing = await readPlannedMealRecord(mealId);
  if (!existing) {
    return null;
  }

  await runLocalTransaction(
    [LOCAL_APP_STORES.plannedMeals, LOCAL_APP_STORES.plannedDays],
    "readwrite",
    async (transaction) => {
      await requestToPromise(transaction.objectStore(LOCAL_APP_STORES.plannedMeals).delete(mealId));
      const dayRecord = (await requestToPromise(
        transaction.objectStore(LOCAL_APP_STORES.plannedDays).get(existing.date),
      )) as LocalPlannedDayRecord | undefined;
      if (dayRecord) {
        await requestToPromise(
          transaction.objectStore(LOCAL_APP_STORES.plannedDays).put({
            ...dayRecord,
            sourceType: "manual",
            updatedAt: nowIso(),
          } satisfies LocalPlannedDayRecord),
        );
      }
    },
  );

  return getLocalPlannedDay(existing.date);
}

export async function getLocalPlannedMealForCooking(mealId: string) {
  await ensureLocalAppData();
  const mealRecord = await readPlannedMealRecord(mealId);
  if (!mealRecord) {
    return null;
  }

  const day = await getLocalPlannedDay(mealRecord.date);
  const meal = day?.meals.find((entry) => entry.id === mealId) ?? null;

  return day && meal && meal.isEnabled !== false ? { day, meal } : null;
}

export async function copyLocalPlannedDays(input: CopyLocalPlannedDaysInput) {
  await ensureLocalAppData();

  const overlaps = await findLocalPlanOverlaps(input.targetStartDate, input.targetEndDate);
  if (overlaps.length > 0 && !input.overwrite) {
    throw new LocalPlanOverlapError(overlaps);
  }

  const settings = await readCurrentSettingsValue();
  const days = await createCopiedDayPlans(input);

  return storeGeneratedDayPlans({
    days,
    sourceType: "copied",
    sourcePeriodStart: input.targetStartDate,
    sourcePeriodEnd: input.targetEndDate,
    copiedFromStart: input.sourceStartDate,
    copiedFromEnd: input.sourceEndDate,
    peopleCount: settings.defaultPeopleCount,
  });
}

export async function deleteLocalPlansOlderThan(input: DeleteOldPlansInput) {
  await ensureLocalAppData();
  const records = (await readPlannedDayRecords()).filter((record) => record.date < input.olderThanDate);
  const dates = records.map((record) => record.date);

  await runLocalTransaction(
    [LOCAL_APP_STORES.plannedDays, LOCAL_APP_STORES.plannedMeals],
    "readwrite",
    async (transaction) => {
      const daysStore = transaction.objectStore(LOCAL_APP_STORES.plannedDays);
      await deleteMealsForDatesInTransaction(transaction, dates);

      for (const date of dates) {
        await requestToPromise(daysStore.delete(date));
      }
    },
  );

  return dates.length;
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
  const records = (await listLocalPlannedDays()).sort((left, right) => right.date.localeCompare(left.date));
  return typeof limit === "number" ? records.slice(0, limit) : records;
}

export async function getLocalAppMeta() {
  await ensureLocalAppData();
  const meta = await readAppMetaRecord();
  return meta ? cloneLocalData(meta) : null;
}

export async function getLocalWeekPlan(startDate: string) {
  const endDate = addDays(startDate, 6);
  const days = await listLocalPlannedDays(startDate, endDate);
  return days.length ? formatDateRangePlan(startDate, endDate, days, days[0]?.createdAt ?? nowIso()) : null;
}

export async function getCurrentLocalWeekPlan() {
  const startDate = todayInBerlinIso();
  return getLocalWeekPlan(startDate);
}

export async function regenerateCurrentLocalWeekPlan(
  reason: LocalWeekPlanGenerationReason = "manual",
) {
  const startDate = tomorrowInBerlinIso();
  const endDate = addDays(startDate, 4);
  const settings = await readCurrentSettingsValue();

  await generateLocalPlanRange({
    startDate,
    endDate,
    peopleCount: settings.defaultPeopleCount,
    overwrite: true,
    sourceType: reason === "settings-change" ? "manual" : "generated",
  });

  return getLocalPlanRange(startDate, endDate);
}

export function getDefaultPlanStartDate() {
  return tomorrowInBerlinIso();
}

export function getDefaultPlanEndDate() {
  return addDays(tomorrowInBerlinIso(), 4);
}

export function getDefaultShoppingStartDate() {
  return todayInBerlinIso();
}

export function getDefaultShoppingEndDate() {
  return addDays(todayInBerlinIso(), 6);
}

export function getMealTypeDefinitions() {
  return cloneLocalData(mealTypes);
}

export function getScaledIngredientAmount(recipe: Recipe, peopleCount: number, amount: number) {
  const baseServings = recipe.baseServings && recipe.baseServings > 0 ? recipe.baseServings : 1;
  return Number(((amount * peopleCount) / baseServings).toFixed(1));
}

export function getMealTargets(settings: UserSettings) {
  return calculateTargets(settings);
}
