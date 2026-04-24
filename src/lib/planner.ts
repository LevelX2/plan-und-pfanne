import { getWeekDates, listDatesInRange } from "@/lib/date";
import { formatWeekdayLong } from "@/lib/format";
import { averageActiveProteinTargetGrams } from "@/lib/protein-targets";
import {
  createEmptyRecipeMixCounts,
  getRecipeMixCategory,
  getRecipeMixTargets,
  recipeMixCategories,
} from "@/lib/recipe-mix";
import type {
  DailyTargets,
  EffectiveRecipeMealTypePreference,
  FrequencyWeight,
  MacroTotals,
  MealType,
  PlannedMeal,
  Recipe,
  RecipeMixCategory,
  UserSettings,
  WeekPlan,
} from "@/lib/types";

type RecipePools = Record<MealType, Array<{ recipe: Recipe; weight: number }>>;
type RecipeMixCounts = Record<RecipeMixCategory, number>;

const mealTypeOrder: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export function calculateTargets(settings: UserSettings): DailyTargets {
  const proteinTarget = averageActiveProteinTargetGrams(settings);

  return {
    calories: settings.calorieTarget,
    protein:
      proteinTarget > 0
        ? proteinTarget
        : Number(((settings.calorieTarget * settings.macroProteinPct) / 100 / 4).toFixed(1)),
    carbs: Number(((settings.calorieTarget * settings.macroCarbsPct) / 100 / 4).toFixed(1)),
    fat: Number(((settings.calorieTarget * settings.macroFatPct) / 100 / 9).toFixed(1)),
    macroPercents: {
      protein: settings.macroProteinPct,
      carbs: settings.macroCarbsPct,
      fat: settings.macroFatPct,
    },
  };
}

export function sumTotals(items: MacroTotals[]) {
  return items.reduce<MacroTotals>(
    (accumulator, current) => ({
      calories: accumulator.calories + current.calories,
      protein: accumulator.protein + current.protein,
      carbs: accumulator.carbs + current.carbs,
      fat: accumulator.fat + current.fat,
    }),
    { calories: 0, carbs: 0, fat: 0, protein: 0 },
  );
}

export function toMacroPercents(totals: MacroTotals) {
  const macroCalories = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9 || totals.calories || 1;

  return {
    protein: Number(((totals.protein * 4 * 100) / macroCalories).toFixed(1)),
    carbs: Number(((totals.carbs * 4 * 100) / macroCalories).toFixed(1)),
    fat: Number(((totals.fat * 9 * 100) / macroCalories).toFixed(1)),
  };
}

export function multiplyRecipe(recipe: Recipe, portionFactor = 1): MacroTotals {
  return {
    calories: Number((recipe.calories * portionFactor).toFixed(1)),
    protein: Number((recipe.proteinG * portionFactor).toFixed(1)),
    carbs: Number((recipe.carbsG * portionFactor).toFixed(1)),
    fat: Number((recipe.fatG * portionFactor).toFixed(1)),
  };
}

export function mealTypesForSettings(settings: UserSettings): MealType[] {
  return settings.includeSnackByDefault || settings.mealsPerDay >= 4
    ? ["breakfast", "lunch", "dinner", "snack"]
    : ["breakfast", "lunch", "dinner"];
}

export function frequencyWeightValue(weight: FrequencyWeight) {
  switch (weight) {
    case "rare":
      return 0.5;
    case "often":
      return 2;
    case "normal":
      return 1;
  }
}

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function isWithinTolerance(
  actual: { protein: number; carbs: number; fat: number },
  target: DailyTargets,
) {
  return (
    Math.abs(actual.protein - target.macroPercents.protein) <= 5 &&
    Math.abs(actual.carbs - target.macroPercents.carbs) <= 5 &&
    Math.abs(actual.fat - target.macroPercents.fat) <= 5
  );
}

function isMixControlledMealType(mealType: MealType) {
  return mealType === "lunch" || mealType === "dinner";
}

function countMixControlledSlots(counts: RecipeMixCounts) {
  return recipeMixCategories().reduce((sum, category) => sum + counts[category], 0);
}

function cloneMixCounts(counts: RecipeMixCounts) {
  return {
    vegetarian: counts.vegetarian,
    fish: counts.fish,
    meat: counts.meat,
  } satisfies RecipeMixCounts;
}

function mixProgressPenalty(
  recipe: Recipe,
  mealType: MealType,
  mixCounts: RecipeMixCounts,
  settings: UserSettings,
  totalControlledSlots: number,
) {
  if (!isMixControlledMealType(mealType)) {
    return 0;
  }

  const nextCounts = cloneMixCounts(mixCounts);
  nextCounts[getRecipeMixCategory(recipe)] += 1;
  const nextTargets = getRecipeMixTargets(countMixControlledSlots(nextCounts), settings);

  return recipeMixCategories().reduce((sum, category) => {
    return sum + Math.abs(nextCounts[category] - nextTargets[category]);
  }, 0) / Math.max(1, totalControlledSlots);
}

function buildPools(
  recipes: Recipe[],
  preferences: EffectiveRecipeMealTypePreference[],
  settings: UserSettings,
) {
  const allowedByKey = new Map<string, EffectiveRecipeMealTypePreference>();

  for (const preference of preferences) {
    allowedByKey.set(`${preference.recipe.id}:${preference.mealType}`, preference);
  }

  const filteredRecipes = recipes
    .filter((recipe) => !settings.glutenFreeOnly || recipe.glutenFree)
    .filter((recipe) => {
      const excluded = settings.excludedIngredients.map((item) => item.trim().toLocaleLowerCase("de-DE"));
      return !recipe.ingredients.some((ingredient) =>
        excluded.includes(ingredient.name.trim().toLocaleLowerCase("de-DE")),
      );
    });

  const pools = mealTypeOrder.reduce<RecipePools>((accumulator, mealType) => {
    accumulator[mealType] = filteredRecipes
      .map((recipe) => {
        const preference = allowedByKey.get(`${recipe.id}:${mealType}`);
        if (!preference?.enabledForPlanning) {
          return null;
        }

        return {
          recipe,
          weight: frequencyWeightValue(preference.frequencyWeight),
        };
      })
      .filter((entry): entry is { recipe: Recipe; weight: number } => Boolean(entry));

    return accumulator;
  }, {} as RecipePools);

  if (!pools.breakfast.length || !pools.lunch.length || !pools.dinner.length) {
    throw new Error("Nicht genug freigegebene Rezepte für Frühstück, Mittagessen und Abendessen vorhanden.");
  }

  return pools;
}

function pickRecipe(
  pool: Array<{ recipe: Recipe; weight: number }>,
  usageCount: Map<string, number>,
  previousDayMeals: Map<MealType, string>,
  mealType: MealType,
  mixCounts: RecipeMixCounts,
  settings: UserSettings,
  totalControlledSlots: number,
) {
  const recipeScores = pool.map((entry) => {
    const repeats = usageCount.get(entry.recipe.id) ?? 0;
    const previousPenalty = previousDayMeals.get(mealType) === entry.recipe.id ? 10 : 0;
    const mixPenalty = mixProgressPenalty(entry.recipe, mealType, mixCounts, settings, totalControlledSlots) * 14;
    const weightBonus = Math.log2(Math.max(entry.weight, 0.1)) * 3;

    return {
      recipe: entry.recipe,
      score: repeats * 4 + previousPenalty + mixPenalty - weightBonus + Math.random() * 1.6,
    };
  });

  recipeScores.sort((left, right) => left.score - right.score);
  const bestBucketScore = recipeScores[0]?.score ?? 0;
  const candidates = recipeScores
    .filter((item) => item.score <= bestBucketScore + 2)
    .map((item) => item.recipe);

  return randomItem(candidates.length ? candidates : recipeScores.map((item) => item.recipe));
}

export function evaluateMeals(meals: PlannedMeal[], settings: UserSettings) {
  const targets = calculateTargets(settings);
  const activeMeals = meals.filter((meal) => meal.isEnabled !== false);
  const totals = sumTotals(activeMeals.map((meal) => meal.calculated));
  const macroPercents = toMacroPercents(totals);

  let score = 0;
  score += (Math.abs(totals.calories - targets.calories) / targets.calories) * 120;
  score += (Math.abs(totals.protein - targets.protein) / Math.max(targets.protein, 1)) * 150;
  score += (Math.abs(totals.carbs - targets.carbs) / Math.max(targets.carbs, 1)) * 110;
  score += (Math.abs(totals.fat - targets.fat) / Math.max(targets.fat, 1)) * 120;
  score += Math.abs(macroPercents.protein - targets.macroPercents.protein) * 1.7;
  score += Math.abs(macroPercents.carbs - targets.macroPercents.carbs) * 1.25;
  score += Math.abs(macroPercents.fat - targets.macroPercents.fat) * 1.45;

  return {
    totals,
    targets,
    macroPercents,
    score: Number(score.toFixed(2)),
    withinTolerance: isWithinTolerance(macroPercents, targets),
  };
}

function buildCandidateDay(
  date: string,
  pools: RecipePools,
  usageCount: Map<string, number>,
  previousDayMeals: Map<MealType, string>,
  recipeMixCounts: RecipeMixCounts,
  settings: UserSettings,
  totalControlledSlots: number,
) {
  const candidateMixCounts = cloneMixCounts(recipeMixCounts);
  const meals: PlannedMeal[] = mealTypesForSettings(settings).map((mealType, index) => {
    const recipe = pickRecipe(
      pools[mealType],
      usageCount,
      previousDayMeals,
      mealType,
      candidateMixCounts,
      settings,
      totalControlledSlots,
    );

    if (isMixControlledMealType(mealType)) {
      candidateMixCounts[getRecipeMixCategory(recipe)] += 1;
    }

    return {
      mealType,
      portionFactor: 1,
      recipe,
      calculated: multiplyRecipe(recipe, 1),
      peopleCount: settings.defaultPeopleCount,
      isEnabled: true,
      includeInShoppingList: true,
      sortOrder: index,
    };
  });

  const evaluation = evaluateMeals(meals, settings);

  return {
    date,
    weekdayLabel: formatWeekdayLong(date, true),
    meals,
    targets: evaluation.targets,
    totals: evaluation.totals,
    macroPercents: evaluation.macroPercents,
    score: evaluation.score,
    withinTolerance: evaluation.withinTolerance,
  };
}

export function buildDayPlanRange(input: {
  startDate: string;
  endDate: string;
  recipes: Recipe[];
  preferences: EffectiveRecipeMealTypePreference[];
  settings: UserSettings;
}) {
  const dates = listDatesInRange(input.startDate, input.endDate);
  const pools = buildPools(input.recipes, input.preferences, input.settings);
  const totalControlledSlots = dates.length * 2;
  const usageCount = new Map<string, number>();
  const previousDayMeals = new Map<MealType, string>();
  const recipeMixCounts = createEmptyRecipeMixCounts();

  return dates.map((date) => {
    let bestDay = buildCandidateDay(
      date,
      pools,
      usageCount,
      previousDayMeals,
      recipeMixCounts,
      input.settings,
      totalControlledSlots,
    );

    for (let candidateIndex = 0; candidateIndex < 90; candidateIndex += 1) {
      const candidate = buildCandidateDay(
        date,
        pools,
        usageCount,
        previousDayMeals,
        recipeMixCounts,
        input.settings,
        totalControlledSlots,
      );
      if (candidate.score < bestDay.score) {
        bestDay = candidate;
      }
    }

    for (const meal of bestDay.meals) {
      usageCount.set(meal.recipe.id, (usageCount.get(meal.recipe.id) ?? 0) + 1);
      previousDayMeals.set(meal.mealType, meal.recipe.id);

      if (isMixControlledMealType(meal.mealType)) {
        recipeMixCounts[getRecipeMixCategory(meal.recipe)] += 1;
      }
    }

    return bestDay;
  });
}

export function buildWeeklyPlan(startDate: string, recipes: Recipe[], settings: UserSettings): WeekPlan {
  const defaultPreferences = recipes.flatMap((recipe) =>
    mealTypeOrder.map((mealType) => {
      const lunchDinner = recipe.mealType === "lunch" || recipe.mealType === "dinner";
      const enabled =
        recipe.mealType === mealType ||
        (lunchDinner && (mealType === "lunch" || mealType === "dinner"));

      return {
        recipe,
        mealType,
        defaultEnabled: enabled,
        enabledForPlanning: enabled,
        frequencyWeight: "normal",
        updatedAt: null,
      } satisfies EffectiveRecipeMealTypePreference;
    }),
  );
  const dates = getWeekDates(startDate);
  const days = buildDayPlanRange({
    startDate,
    endDate: dates.at(-1) ?? startDate,
    recipes,
    preferences: defaultPreferences,
    settings,
  });
  const generatedAt = new Date().toISOString();
  const averageScore = Number((days.reduce((sum, day) => sum + day.score, 0) / days.length).toFixed(2));

  return {
    startDate,
    endDate: dates.at(-1) ?? startDate,
    generatedAt,
    averageScore,
    averageProteinPct: Number((days.reduce((sum, day) => sum + day.macroPercents.protein, 0) / days.length).toFixed(1)),
    averageCarbsPct: Number((days.reduce((sum, day) => sum + day.macroPercents.carbs, 0) / days.length).toFixed(1)),
    averageFatPct: Number((days.reduce((sum, day) => sum + day.macroPercents.fat, 0) / days.length).toFixed(1)),
    days,
  };
}
