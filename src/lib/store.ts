import "server-only";

import { revalidatePath } from "next/cache";
import { addDays, getCurrentWeekStart, getNextWeekStartFromSunday, getWeekStartForDate, isSunday, todayInBerlinIso } from "@/lib/date";
import { getDb } from "@/lib/db";
import { formatWeekdayLong } from "@/lib/format";
import { buildWeeklyPlan } from "@/lib/planner";
import { createEmptyRecipeMixCounts, getRecipeMixCategory, isRecipeMixControlledMeal } from "@/lib/recipe-mix";
import type {
  DayPlan,
  Ingredient,
  MealType,
  PlannedMeal,
  Recipe,
  RecipeMixCategory,
  ShoppingGroup,
  UserSettings,
  WeekPlan,
} from "@/lib/types";
import { buildShoppingListGroupsForWeekPlan } from "@/lib/week-plan-selection";

type RecipeRow = {
  id: string;
  name: string;
  description: string;
  meal_type: MealType;
  gluten_free: number;
  vegetarian: number;
  prep_time_minutes: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  ingredients_json: string;
  instructions_text: string;
  tags_json: string;
  protein_source: string;
};

type SettingsRow = {
  calorie_target: number;
  macro_carbs_pct: number;
  macro_fat_pct: number;
  macro_protein_pct: number;
  meals_per_day: number;
  gluten_free_only: number;
  vegetarian: number;
  reduce_meat: number;
  vegetarian_share_pct: number;
  fish_share_pct: number;
  meat_share_pct: number;
  excluded_ingredients_json: string;
  max_recipe_repeats_per_week: number;
};

type WeeklyPlanRow = {
  id: number;
  start_date: string;
  end_date: string;
};

type DailyPlanRow = {
  id: number;
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  score: number;
};

type MealRow = {
  daily_plan_id: number;
  recipe_id: string;
  meal_type: MealType;
  portion_factor: number;
};

function parseRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    mealType: row.meal_type,
    glutenFree: Boolean(row.gluten_free),
    vegetarian: Boolean(row.vegetarian),
    prepTimeMinutes: row.prep_time_minutes,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    ingredients: JSON.parse(row.ingredients_json) as Ingredient[],
    instructions: row.instructions_text.split("\n"),
    tags: JSON.parse(row.tags_json) as string[],
    proteinSource: row.protein_source,
  };
}

function parseSettings(row: SettingsRow): UserSettings {
  return {
    calorieTarget: row.calorie_target,
    macroCarbsPct: row.macro_carbs_pct,
    macroFatPct: row.macro_fat_pct,
    macroProteinPct: row.macro_protein_pct,
    mealsPerDay: row.meals_per_day,
    glutenFreeOnly: Boolean(row.gluten_free_only),
    vegetarianSharePct: row.vegetarian_share_pct,
    fishSharePct: row.fish_share_pct,
    meatSharePct: row.meat_share_pct,
    excludedIngredients: JSON.parse(row.excluded_ingredients_json) as string[],
    maxRecipeRepeatsPerWeek: row.max_recipe_repeats_per_week,
  };
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function targetsFromSettings(settings: UserSettings) {
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

function macroPercents(protein: number, carbs: number, fat: number) {
  const calories = protein * 4 + carbs * 4 + fat * 9 || 1;
  return {
    protein: Number(((protein * 4 * 100) / calories).toFixed(1)),
    carbs: Number(((carbs * 4 * 100) / calories).toFixed(1)),
    fat: Number(((fat * 9 * 100) / calories).toFixed(1)),
  };
}

export function getSettings() {
  const db = getDb();
  const row = db.prepare("SELECT * FROM user_settings WHERE id = 1").get() as SettingsRow | undefined;

  if (!row) {
    throw new Error("Einstellungen konnten nicht geladen werden.");
  }

  return parseSettings(row);
}

export function saveSettings(settings: UserSettings) {
  const db = getDb();
  db.prepare(`
    UPDATE user_settings
    SET
      calorie_target = @calorieTarget,
      macro_carbs_pct = @macroCarbsPct,
      macro_fat_pct = @macroFatPct,
      macro_protein_pct = @macroProteinPct,
      meals_per_day = @mealsPerDay,
      gluten_free_only = @glutenFreeOnly,
      vegetarian_share_pct = @vegetarianSharePct,
      fish_share_pct = @fishSharePct,
      meat_share_pct = @meatSharePct,
      excluded_ingredients_json = @excludedIngredients,
      max_recipe_repeats_per_week = @maxRecipeRepeatsPerWeek,
      updated_at = @updatedAt
    WHERE id = 1
  `).run({
    calorieTarget: settings.calorieTarget,
    macroCarbsPct: settings.macroCarbsPct,
    macroFatPct: settings.macroFatPct,
    macroProteinPct: settings.macroProteinPct,
    mealsPerDay: settings.mealsPerDay,
    glutenFreeOnly: settings.glutenFreeOnly ? 1 : 0,
    vegetarianSharePct: settings.vegetarianSharePct,
    fishSharePct: settings.fishSharePct,
    meatSharePct: settings.meatSharePct,
    excludedIngredients: JSON.stringify(settings.excludedIngredients),
    maxRecipeRepeatsPerWeek: settings.maxRecipeRepeatsPerWeek,
    updatedAt: new Date().toISOString(),
  });
}

function listAllRecipes() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM recipes ORDER BY meal_type, name").all() as RecipeRow[];
  return rows.map(parseRecipe);
}

function filterRecipes(recipes: Recipe[], settings: UserSettings) {
  const excluded = settings.excludedIngredients.map(normalize);

  return recipes
    .filter((recipe) => !settings.glutenFreeOnly || recipe.glutenFree)
    .filter((recipe) => {
      if (excluded.length === 0) {
        return true;
      }

      return !recipe.ingredients.some((ingredient) => excluded.includes(normalize(ingredient.name)));
    });
}

export function listRecipes() {
  return filterRecipes(listAllRecipes(), getSettings());
}

export function getRecipeMixPoolStats() {
  const recipes = listRecipes().filter(isRecipeMixControlledMeal);
  const counts = createEmptyRecipeMixCounts();

  for (const recipe of recipes) {
    counts[getRecipeMixCategory(recipe)] += 1;
  }

  return {
    total: recipes.length,
    counts,
  } satisfies {
    total: number;
    counts: Record<RecipeMixCategory, number>;
  };
}

export function getRecipeById(id: string) {
  return listAllRecipes().find((recipe) => recipe.id === id) ?? null;
}

function deleteStoredWeek(startDate: string) {
  const db = getDb();
  const plan = db.prepare("SELECT id FROM weekly_plans WHERE start_date = ?").get(startDate) as
    | { id: number }
    | undefined;

  if (!plan) {
    return;
  }

  const transaction = db.transaction(() => {
    const dailyPlanIds = db
      .prepare("SELECT id FROM daily_plans WHERE weekly_plan_id = ?")
      .all(plan.id) as { id: number }[];

    const deleteMeals = db.prepare("DELETE FROM meals WHERE daily_plan_id = ?");
    for (const item of dailyPlanIds) {
      deleteMeals.run(item.id);
    }

    db.prepare("DELETE FROM daily_plans WHERE weekly_plan_id = ?").run(plan.id);
    db.prepare("DELETE FROM weekly_plans WHERE id = ?").run(plan.id);
  });

  transaction();
}

function storeWeekPlan(plan: WeekPlan, generatedBy: string) {
  const db = getDb();
  deleteStoredWeek(plan.startDate);

  const transaction = db.transaction(() => {
    const weeklyPlanInsert = db.prepare(`
      INSERT INTO weekly_plans (user_id, start_date, end_date, created_at, generated_by)
      VALUES (1, @startDate, @endDate, @createdAt, @generatedBy)
    `).run({
      startDate: plan.startDate,
      endDate: plan.endDate,
      createdAt: new Date().toISOString(),
      generatedBy,
    });

    const weeklyPlanId = Number(weeklyPlanInsert.lastInsertRowid);

    const insertDay = db.prepare(`
      INSERT INTO daily_plans (
        weekly_plan_id,
        date,
        total_calories,
        total_protein_g,
        total_carbs_g,
        total_fat_g,
        score
      ) VALUES (
        @weeklyPlanId,
        @date,
        @totalCalories,
        @totalProtein,
        @totalCarbs,
        @totalFat,
        @score
      )
    `);

    const insertMeal = db.prepare(`
      INSERT INTO meals (daily_plan_id, recipe_id, meal_type, portion_factor)
      VALUES (@dailyPlanId, @recipeId, @mealType, @portionFactor)
    `);

    for (const day of plan.days) {
      const dailyInsert = insertDay.run({
        weeklyPlanId,
        date: day.date,
        totalCalories: day.totals.calories,
        totalProtein: day.totals.protein,
        totalCarbs: day.totals.carbs,
        totalFat: day.totals.fat,
        score: day.score,
      });

      const dailyPlanId = Number(dailyInsert.lastInsertRowid);

      for (const meal of day.meals) {
        insertMeal.run({
          dailyPlanId,
          recipeId: meal.recipe.id,
          mealType: meal.mealType,
          portionFactor: meal.portionFactor,
        });
      }
    }
  });

  transaction();
}

function hydrateStoredWeek(startDate: string) {
  const db = getDb();
  const weeklyPlan = db.prepare("SELECT * FROM weekly_plans WHERE start_date = ?").get(startDate) as WeeklyPlanRow | undefined;

  if (!weeklyPlan) {
    return null;
  }

  const settings = getSettings();
  const targets = targetsFromSettings(settings);
  const recipesById = new Map(listAllRecipes().map((recipe) => [recipe.id, recipe]));
  const dayRows = db
    .prepare("SELECT * FROM daily_plans WHERE weekly_plan_id = ? ORDER BY date")
    .all(weeklyPlan.id) as DailyPlanRow[];
  const mealRows = db
    .prepare("SELECT * FROM meals WHERE daily_plan_id IN (SELECT id FROM daily_plans WHERE weekly_plan_id = ?) ORDER BY id")
    .all(weeklyPlan.id) as MealRow[];

  const mealsByDay = new Map<number, PlannedMeal[]>();
  for (const meal of mealRows) {
    const recipe = recipesById.get(meal.recipe_id);
    if (!recipe) {
      continue;
    }

    const plannedMeal: PlannedMeal = {
      mealType: meal.meal_type,
      portionFactor: meal.portion_factor,
      recipe,
      calculated: {
        calories: Number((recipe.calories * meal.portion_factor).toFixed(1)),
        protein: Number((recipe.proteinG * meal.portion_factor).toFixed(1)),
        carbs: Number((recipe.carbsG * meal.portion_factor).toFixed(1)),
        fat: Number((recipe.fatG * meal.portion_factor).toFixed(1)),
      },
    };

    mealsByDay.set(meal.daily_plan_id, [...(mealsByDay.get(meal.daily_plan_id) ?? []), plannedMeal]);
  }

  const days: DayPlan[] = dayRows.map((day) => {
    const percents = macroPercents(day.total_protein_g, day.total_carbs_g, day.total_fat_g);
    return {
      date: day.date,
      weekdayLabel: formatWeekdayLong(day.date, true),
      totals: {
        calories: day.total_calories,
        protein: day.total_protein_g,
        carbs: day.total_carbs_g,
        fat: day.total_fat_g,
      },
      targets,
      macroPercents: percents,
      score: day.score,
      withinTolerance:
        Math.abs(percents.protein - targets.macroPercents.protein) <= 5 &&
        Math.abs(percents.carbs - targets.macroPercents.carbs) <= 5 &&
        Math.abs(percents.fat - targets.macroPercents.fat) <= 5,
      meals: mealsByDay.get(day.id) ?? [],
    };
  });

  return {
    startDate: weeklyPlan.start_date,
    endDate: weeklyPlan.end_date,
    averageScore: Number((days.reduce((sum, day) => sum + day.score, 0) / days.length).toFixed(2)),
    averageProteinPct: Number((days.reduce((sum, day) => sum + day.macroPercents.protein, 0) / days.length).toFixed(1)),
    averageCarbsPct: Number((days.reduce((sum, day) => sum + day.macroPercents.carbs, 0) / days.length).toFixed(1)),
    averageFatPct: Number((days.reduce((sum, day) => sum + day.macroPercents.fat, 0) / days.length).toFixed(1)),
    days,
  } satisfies WeekPlan;
}

export function generateWeekPlan(startDate: string, generatedBy = "manual") {
  const settings = getSettings();
  const recipes = filterRecipes(listAllRecipes(), settings);
  const plan = buildWeeklyPlan(startDate, recipes, settings);
  storeWeekPlan(plan, generatedBy);
  return hydrateStoredWeek(startDate);
}

export function getWeekPlan(startDate: string) {
  return hydrateStoredWeek(startDate);
}

export function getCurrentWeekPlan() {
  const startDate = getCurrentWeekStart();
  return getWeekPlan(startDate) ?? generateWeekPlan(startDate, "bootstrap");
}

export function regenerateCurrentWeekPlan() {
  const startDate = getCurrentWeekStart();
  const plan = generateWeekPlan(startDate, "manual");

  revalidatePath("/");
  revalidatePath("/rezepte");
  revalidatePath("/einstellungen");
  revalidatePath("/einkaufsliste");
  if (plan) {
    for (const day of plan.days) {
      revalidatePath(`/tage/${day.date}`);
    }
  }

  return plan;
}

export function getDayPlan(date: string) {
  const weekStart = getWeekStartForDate(date);
  const weekPlan = getWeekPlan(weekStart) ?? generateWeekPlan(weekStart, "day-bootstrap");
  return weekPlan?.days.find((day) => day.date === date) ?? null;
}

export function buildShoppingListForWeek(startDate: string): ShoppingGroup[] {
  const plan = getWeekPlan(startDate) ?? generateWeekPlan(startDate, "shopping-bootstrap");
  if (!plan) {
    return [];
  }

  return buildShoppingListGroupsForWeekPlan(plan, "all-planned", []);
}

export function generateScheduledWeekPlan(force = false) {
  const today = todayInBerlinIso();

  if (!force && !isSunday(today)) {
    return {
      skipped: true,
      today,
      targetWeekStart: getNextWeekStartFromSunday(today),
      reason: "Die automatische Erstellung läuft standardmäßig sonntags.",
    } as const;
  }

  const targetWeekStart = getNextWeekStartFromSunday(today);
  const plan = generateWeekPlan(targetWeekStart, "scheduler");

  return {
    skipped: false,
    today,
    targetWeekStart,
    plan,
  } as const;
}

export function weekDates(startDate: string) {
  return Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
}
