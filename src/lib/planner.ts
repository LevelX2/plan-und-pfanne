import { getWeekDates } from "@/lib/date";
import { formatWeekdayLong } from "@/lib/format";
import {
  createEmptyRecipeMixCounts,
  getRecipeMixCategory,
  getRecipeMixTargets,
  recipeMixCategories,
} from "@/lib/recipe-mix";
import type {
  DailyTargets,
  MacroTotals,
  MealType,
  PlannedMeal,
  Recipe,
  RecipeMixCategory,
  UserSettings,
  WeekPlan,
} from "@/lib/types";

type RecipePools = ReturnType<typeof buildPools>;
type RecipeMixCounts = Record<RecipeMixCategory, number>;

function calculateTargets(settings: UserSettings): DailyTargets {
  return {
    calories: settings.calorieTarget,
    protein: Number(((settings.calorieTarget * settings.macroProteinPct) / 100 / 4).toFixed(1)),
    carbs: Number(((settings.calorieTarget * settings.macroCarbsPct) / 100 / 4).toFixed(1)),
    fat: Number(((settings.calorieTarget * settings.macroFatPct) / 100 / 9).toFixed(1)),
    macroPercents: {
      protein: settings.macroProteinPct,
      carbs: settings.macroCarbsPct,
      fat: settings.macroFatPct,
    },
  };
}

function sumTotals(items: MacroTotals[]) {
  return items.reduce<MacroTotals>(
    (accumulator, current) => ({
      calories: accumulator.calories + current.calories,
      protein: accumulator.protein + current.protein,
      carbs: accumulator.carbs + current.carbs,
      fat: accumulator.fat + current.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

function toMacroPercents(totals: MacroTotals) {
  const macroCalories = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9 || totals.calories || 1;

  return {
    protein: Number(((totals.protein * 4 * 100) / macroCalories).toFixed(1)),
    carbs: Number(((totals.carbs * 4 * 100) / macroCalories).toFixed(1)),
    fat: Number(((totals.fat * 9 * 100) / macroCalories).toFixed(1)),
  };
}

function multiplyRecipe(recipe: Recipe, portionFactor: number): MacroTotals {
  return {
    calories: Number((recipe.calories * portionFactor).toFixed(1)),
    protein: Number((recipe.proteinG * portionFactor).toFixed(1)),
    carbs: Number((recipe.carbsG * portionFactor).toFixed(1)),
    fat: Number((recipe.fatG * portionFactor).toFixed(1)),
  };
}

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function choosePortionFactor(mealType: MealType) {
  return mealType === "snack" ? randomItem([0.5, 0.75, 1, 1.25]) : randomItem([0.9, 1, 1.1]);
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

function buildPools(recipes: Recipe[]) {
  const pools = {
    breakfast: recipes.filter((recipe) => recipe.mealType === "breakfast"),
    lunch: recipes.filter((recipe) => recipe.mealType === "lunch"),
    dinner: recipes.filter((recipe) => recipe.mealType === "dinner"),
    snack: recipes.filter((recipe) => recipe.mealType === "snack"),
  };

  if (!pools.breakfast.length || !pools.lunch.length || !pools.dinner.length) {
    throw new Error("Nicht genug Rezepte vorhanden, um einen kompletten Wochenplan zu erzeugen.");
  }

  return pools;
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

function pickRecipe(
  pool: Recipe[],
  usageCount: Map<string, number>,
  previousDayMeals: Map<MealType, string>,
  mealType: MealType,
  mixCounts: RecipeMixCounts,
  settings: UserSettings,
  totalControlledSlots: number,
) {
  const recipeScores = pool.map((recipe) => {
    const repeats = usageCount.get(recipe.id) ?? 0;
    const previousPenalty = previousDayMeals.get(mealType) === recipe.id ? 10 : 0;
    const mixPenalty = mixProgressPenalty(recipe, mealType, mixCounts, settings, totalControlledSlots) * 14;

    return {
      recipe,
      score: repeats + previousPenalty + mixPenalty,
    };
  });

  recipeScores.sort((left, right) => left.score - right.score);
  const bestBucketScore = recipeScores[0]?.score ?? 0;
  const candidates = recipeScores
    .filter((item) => item.score <= bestBucketScore + 1.8)
    .map((item) => item.recipe);

  return randomItem(candidates.length ? candidates : recipeScores.map((item) => item.recipe));
}

function scoreDay(
  meals: PlannedMeal[],
  targets: DailyTargets,
  usageCount: Map<string, number>,
  previousDayMeals: Map<MealType, string>,
  settings: UserSettings,
) {
  const totals = sumTotals(meals.map((meal) => meal.calculated));
  const macroPercents = toMacroPercents(totals);

  let score = 0;
  score += (Math.abs(totals.calories - targets.calories) / targets.calories) * 120;
  score += (Math.abs(totals.protein - targets.protein) / targets.protein) * 150;
  score += (Math.abs(totals.carbs - targets.carbs) / targets.carbs) * 110;
  score += (Math.abs(totals.fat - targets.fat) / targets.fat) * 120;
  score += Math.abs(macroPercents.protein - targets.macroPercents.protein) * 1.7;
  score += Math.abs(macroPercents.carbs - targets.macroPercents.carbs) * 1.25;
  score += Math.abs(macroPercents.fat - targets.macroPercents.fat) * 1.45;

  for (const meal of meals) {
    const repeats = usageCount.get(meal.recipe.id) ?? 0;
    score += repeats * 13;

    if (repeats >= settings.maxRecipeRepeatsPerWeek) {
      score += 36;
    }

    if (previousDayMeals.get(meal.mealType) === meal.recipe.id) {
      score += 45;
    }
  }

  const lunch = meals.find((meal) => meal.mealType === "lunch");
  const dinner = meals.find((meal) => meal.mealType === "dinner");
  if (lunch && dinner && lunch.recipe.proteinSource === dinner.recipe.proteinSource) {
    score += 10;
  }

  return {
    totals,
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
  const targets = calculateTargets(settings);
  const mealTypes: MealType[] = settings.mealsPerDay >= 4
    ? ["breakfast", "lunch", "dinner", "snack"]
    : ["breakfast", "lunch", "dinner"];

  const candidateMixCounts = cloneMixCounts(recipeMixCounts);

  const meals: PlannedMeal[] = mealTypes.map((mealType) => {
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

    const portionFactor = choosePortionFactor(mealType);

    return {
      mealType,
      portionFactor,
      recipe,
      calculated: multiplyRecipe(recipe, portionFactor),
    };
  });

  const evaluation = scoreDay(meals, targets, usageCount, previousDayMeals, settings);

  return {
    date,
    weekdayLabel: formatWeekdayLong(date, true),
    meals,
    targets,
    totals: evaluation.totals,
    macroPercents: evaluation.macroPercents,
    score: evaluation.score,
    withinTolerance: evaluation.withinTolerance,
  };
}

function getWeekMixPenalty(days: WeekPlan["days"], settings: UserSettings) {
  const counts = createEmptyRecipeMixCounts();

  for (const day of days) {
    for (const meal of day.meals) {
      if (!isMixControlledMealType(meal.mealType)) {
        continue;
      }

      counts[getRecipeMixCategory(meal.recipe)] += 1;
    }
  }

  const totalControlledSlots = countMixControlledSlots(counts);
  if (totalControlledSlots === 0) {
    return 0;
  }

  const targets = getRecipeMixTargets(totalControlledSlots, settings);
  const deviation = recipeMixCategories().reduce(
    (sum, category) => sum + Math.abs(counts[category] - targets[category]),
    0,
  );

  return Number((deviation * 8).toFixed(2));
}

export function buildWeeklyPlan(startDate: string, recipes: Recipe[], settings: UserSettings): WeekPlan {
  const pools = buildPools(recipes);
  const weekDates = getWeekDates(startDate);
  const totalControlledSlots = weekDates.length * 2;
  const generatedAt = new Date().toISOString();
  let bestWeek: WeekPlan | null = null;
  let bestSelectionScore = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const usageCount = new Map<string, number>();
    const previousDayMeals = new Map<MealType, string>();
    const recipeMixCounts = createEmptyRecipeMixCounts();
    const days = [];
    let totalScore = 0;

    for (const date of weekDates) {
      let bestDay = buildCandidateDay(
        date,
        pools,
        usageCount,
        previousDayMeals,
        recipeMixCounts,
        settings,
        totalControlledSlots,
      );

      for (let candidateIndex = 0; candidateIndex < 160; candidateIndex += 1) {
        const candidate = buildCandidateDay(
          date,
          pools,
          usageCount,
          previousDayMeals,
          recipeMixCounts,
          settings,
          totalControlledSlots,
        );
        if (candidate.score < bestDay.score) {
          bestDay = candidate;
        }
      }

      days.push(bestDay);
      totalScore += bestDay.score;

      for (const meal of bestDay.meals) {
        usageCount.set(meal.recipe.id, (usageCount.get(meal.recipe.id) ?? 0) + 1);
        previousDayMeals.set(meal.mealType, meal.recipe.id);

        if (isMixControlledMealType(meal.mealType)) {
          recipeMixCounts[getRecipeMixCategory(meal.recipe)] += 1;
        }
      }
    }

    const averageScore = Number((totalScore / days.length).toFixed(2));
    const averageProteinPct = Number(
      (days.reduce((sum, day) => sum + day.macroPercents.protein, 0) / days.length).toFixed(1),
    );
    const averageCarbsPct = Number(
      (days.reduce((sum, day) => sum + day.macroPercents.carbs, 0) / days.length).toFixed(1),
    );
    const averageFatPct = Number(
      (days.reduce((sum, day) => sum + day.macroPercents.fat, 0) / days.length).toFixed(1),
    );

    const candidateWeek: WeekPlan = {
      startDate,
      endDate: weekDates.at(-1) ?? startDate,
      generatedAt,
      averageScore,
      averageProteinPct,
      averageCarbsPct,
      averageFatPct,
      days,
    };

    const selectionScore = averageScore + getWeekMixPenalty(candidateWeek.days, settings);

    if (selectionScore < bestSelectionScore) {
      bestWeek = candidateWeek;
      bestSelectionScore = selectionScore;
    }
  }

  if (!bestWeek) {
    throw new Error("Wochenplan konnte nicht erzeugt werden.");
  }

  return bestWeek;
}
