import { getWeekDates } from "@/lib/date";
import { formatWeekdayLong } from "@/lib/format";
import type { DailyTargets, MacroTotals, MealType, PlannedMeal, Recipe, UserSettings, WeekPlan } from "@/lib/types";

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

function pickRecipe(
  pool: Recipe[],
  usageCount: Map<string, number>,
  previousDayMeals: Map<MealType, string>,
  mealType: MealType,
) {
  const ranked = [...pool].sort((left, right) => {
    const leftUsage = usageCount.get(left.id) ?? 0;
    const rightUsage = usageCount.get(right.id) ?? 0;
    const leftPenalty = previousDayMeals.get(mealType) === left.id ? 10 : 0;
    const rightPenalty = previousDayMeals.get(mealType) === right.id ? 10 : 0;
    return leftUsage + leftPenalty - (rightUsage + rightPenalty);
  });

  const bestBucketScore =
    (usageCount.get(ranked[0]?.id ?? "") ?? 0) + (previousDayMeals.get(mealType) === ranked[0]?.id ? 10 : 0);
  const candidates = ranked.filter((recipe) => {
    const score = (usageCount.get(recipe.id) ?? 0) + (previousDayMeals.get(mealType) === recipe.id ? 10 : 0);
    return score <= bestBucketScore + 1;
  });

  return randomItem(candidates.length ? candidates : ranked);
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

  if (settings.reduceMeat) {
    for (const meal of meals) {
      if (["Huhn", "Pute", "Rind"].includes(meal.recipe.proteinSource)) {
        score += 5;
      }
    }
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
  pools: ReturnType<typeof buildPools>,
  usageCount: Map<string, number>,
  previousDayMeals: Map<MealType, string>,
  settings: UserSettings,
) {
  const targets = calculateTargets(settings);
  const mealTypes: MealType[] = settings.mealsPerDay >= 4
    ? ["breakfast", "lunch", "dinner", "snack"]
    : ["breakfast", "lunch", "dinner"];

  const meals: PlannedMeal[] = mealTypes.map((mealType) => {
    const recipe = pickRecipe(pools[mealType], usageCount, previousDayMeals, mealType);
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

export function buildWeeklyPlan(startDate: string, recipes: Recipe[], settings: UserSettings): WeekPlan {
  const pools = buildPools(recipes);
  const weekDates = getWeekDates(startDate);
  let bestWeek: WeekPlan | null = null;

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const usageCount = new Map<string, number>();
    const previousDayMeals = new Map<MealType, string>();
    const days = [];
    let totalScore = 0;

    for (const date of weekDates) {
      let bestDay = buildCandidateDay(date, pools, usageCount, previousDayMeals, settings);

      for (let candidateIndex = 0; candidateIndex < 160; candidateIndex += 1) {
        const candidate = buildCandidateDay(date, pools, usageCount, previousDayMeals, settings);
        if (candidate.score < bestDay.score) {
          bestDay = candidate;
        }
      }

      days.push(bestDay);
      totalScore += bestDay.score;

      for (const meal of bestDay.meals) {
        usageCount.set(meal.recipe.id, (usageCount.get(meal.recipe.id) ?? 0) + 1);
        previousDayMeals.set(meal.mealType, meal.recipe.id);
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
      averageScore,
      averageProteinPct,
      averageCarbsPct,
      averageFatPct,
      days,
    };

    if (!bestWeek || candidateWeek.averageScore < bestWeek.averageScore) {
      bestWeek = candidateWeek;
    }
  }

  if (!bestWeek) {
    throw new Error("Wochenplan konnte nicht erzeugt werden.");
  }

  return bestWeek;
}
