import type { DayPlan, MealType, PlannedMeal, Recipe, ShoppingCategory, ShoppingGroup, WeekPlan } from "@/lib/types";

export type PlannedMealKey = string;
export type ShoppingListMode = "active-only" | "all-planned";

export type WeekSelectionSnapshot = {
  planSignature: string;
  selectedMealKeys: PlannedMealKey[];
  shoppingMode: ShoppingListMode;
  savedAt: string;
};

type ShoppingIngredientEntry = {
  category: ShoppingCategory;
  name: string;
  unit: string;
  amount: number;
};

type WeekMealEntry = {
  date: string;
  meal: PlannedMeal;
};

const EGG_WHITE_GRAMS_PER_EGG = 30;

function normalizeIngredientName(value: string) {
  return value.trim().toLocaleLowerCase("de-DE");
}

function normalizeShoppingIngredientEntry(ingredient: ShoppingIngredientEntry): ShoppingIngredientEntry {
  const normalizedName = normalizeIngredientName(ingredient.name);
  const normalizedUnit = ingredient.unit.trim().toLocaleLowerCase("de-DE");

  if (ingredient.category === "Eier" && (normalizedName === "ei" || normalizedName === "eier")) {
    return {
      ...ingredient,
      name: "Eier",
      unit: "Stk",
    };
  }

  if (ingredient.category === "Eier" && normalizedName === "eiweiß") {
    const amount =
      normalizedUnit === "g"
        ? ingredient.amount / EGG_WHITE_GRAMS_PER_EGG
        : ingredient.amount;

    return {
      category: "Eier",
      name: "Eier",
      unit: "Stk",
      amount: Number(amount.toFixed(2)),
    };
  }

  return ingredient;
}

function ingredientScaleForMeal(meal: PlannedMeal, scalePeopleCount = false) {
  if (!scalePeopleCount) {
    return meal.portionFactor;
  }

  const baseServings = meal.recipe.baseServings && meal.recipe.baseServings > 0 ? meal.recipe.baseServings : 1;
  return ((meal.peopleCount ?? 1) / baseServings) * meal.portionFactor;
}

function ingredientEntriesForMeal(meal: PlannedMeal, scalePeopleCount = false): ShoppingIngredientEntry[] {
  const scale = ingredientScaleForMeal(meal, scalePeopleCount);

  return meal.recipe.ingredients.map((ingredient) => ({
    category: ingredient.category,
    name: ingredient.name,
    unit: ingredient.unit,
    amount: Number((ingredient.amount * scale).toFixed(1)),
  }));
}

function shoppingEntriesFromMeals(meals: PlannedMeal[], scalePeopleCount = false): ShoppingIngredientEntry[] {
  return meals.flatMap((meal) => ingredientEntriesForMeal(meal, scalePeopleCount));
}

export function buildPlannedMealKey(input: {
  date: string;
  mealType: MealType;
  recipeId: string;
}) {
  return `${input.date}::${input.mealType}::${input.recipeId}`;
}

export function plannedMealKeyForMeal(date: string, meal: Pick<PlannedMeal, "mealType" | "recipe">) {
  return buildPlannedMealKey({
    date,
    mealType: meal.mealType,
    recipeId: meal.recipe.id,
  });
}

export function listWeekMealEntries(weekPlan: WeekPlan): WeekMealEntry[] {
  return weekPlan.days.flatMap((day) =>
    day.meals.map((meal) => ({
      date: day.date,
      meal,
    })),
  );
}

export function listWeekMealKeys(weekPlan: WeekPlan): PlannedMealKey[] {
  return listWeekMealEntries(weekPlan).map(({ date, meal }) => plannedMealKeyForMeal(date, meal));
}

export function createWeekPlanSignature(weekPlan: WeekPlan) {
  return listWeekMealKeys(weekPlan).join("|");
}

export function createWeekSelectionStorageKey(storageNamespace: string, startDate: string) {
  return `${storageNamespace}:week-selection:${startDate}`;
}

export function createShoppingChecksStorageKey(input: {
  storageNamespace: string;
  startDate: string;
  mode: ShoppingListMode;
  planSignature: string;
  selectedMealKeys: PlannedMealKey[];
}) {
  const selectionSignature =
    input.mode === "active-only"
      ? [...input.selectedMealKeys].sort().join("|") || "none"
      : "all-planned";

  return (
    `${input.storageNamespace}:shopping-checks:${input.startDate}:` +
    `${input.mode}:${input.planSignature}:${selectionSignature}`
  );
}

export function normalizeSelectedMealKeys(weekPlan: WeekPlan, selectedMealKeys: PlannedMealKey[]) {
  const allowedKeys = new Set(listWeekMealKeys(weekPlan));
  return [...new Set(selectedMealKeys)].filter((mealKey) => allowedKeys.has(mealKey));
}

export function buildShoppingListGroups(entries: ShoppingIngredientEntry[]): ShoppingGroup[] {
  const grouped = new Map<ShoppingCategory, Map<string, { name: string; unit: string; totalAmount: number }>>();

  for (const ingredient of entries) {
    const normalizedIngredient = normalizeShoppingIngredientEntry(ingredient);
    const categoryMap =
      grouped.get(normalizedIngredient.category) ?? new Map<string, { name: string; unit: string; totalAmount: number }>();
    const itemKey = `${normalizedIngredient.name}::${normalizedIngredient.unit}`;
    const current = categoryMap.get(itemKey);

    if (current) {
      current.totalAmount = Number((current.totalAmount + normalizedIngredient.amount).toFixed(1));
    } else {
      categoryMap.set(itemKey, {
        name: normalizedIngredient.name,
        unit: normalizedIngredient.unit,
        totalAmount: normalizedIngredient.amount,
      });
    }

    grouped.set(normalizedIngredient.category, categoryMap);
  }

  return [...grouped.entries()]
    .map(([category, items]) => ({
      category,
      items: [...items.entries()]
        .map(([, item]) => ({
          name: item.name,
          unit: item.unit,
          totalAmount: item.totalAmount,
        }))
        .sort((left, right) => left.name.localeCompare(right.name, "de")),
    }))
    .sort((left, right) => left.category.localeCompare(right.category, "de"));
}

export function buildShoppingListGroupsForRecipes(recipes: Recipe[]): ShoppingGroup[] {
  const entries = recipes.flatMap((recipe) =>
    recipe.ingredients.map((ingredient) => ({
      category: ingredient.category,
      name: ingredient.name,
      unit: ingredient.unit,
      amount: ingredient.amount,
    })),
  );

  return buildShoppingListGroups(entries);
}

export function buildShoppingListGroupsForWeekPlan(
  weekPlan: WeekPlan,
  mode: ShoppingListMode,
  selectedMealKeys: PlannedMealKey[],
) {
  const selectedSet = new Set(selectedMealKeys);
  const meals =
    mode === "all-planned"
      ? listWeekMealEntries(weekPlan).map(({ meal }) => meal)
      : listWeekMealEntries(weekPlan)
          .filter(({ date, meal }) => selectedSet.has(plannedMealKeyForMeal(date, meal)))
          .map(({ meal }) => meal);

  return buildShoppingListGroups(shoppingEntriesFromMeals(meals));
}

export function buildShoppingListGroupsForPlannedDays(days: DayPlan[]) {
  const meals = days.flatMap((day) =>
    day.meals.filter(
      (meal) => meal.isEnabled !== false && meal.includeInShoppingList !== false,
    ),
  );

  return buildShoppingListGroups(shoppingEntriesFromMeals(meals, true));
}

export function countShoppingItems(groups: ShoppingGroup[]) {
  return groups.reduce((sum, group) => sum + group.items.length, 0);
}
