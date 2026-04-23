import type { Recipe, RecipeMixCategory } from "@/lib/types";

const MIX_CATEGORIES = ["vegetarian", "fish", "meat"] as const satisfies RecipeMixCategory[];

export function recipeMixCategories() {
  return MIX_CATEGORIES;
}

export function getRecipeMixCategory(recipe: Recipe): RecipeMixCategory {
  if (recipe.vegetarian) {
    return "vegetarian";
  }

  if (recipe.proteinSource === "Fisch") {
    return "fish";
  }

  return "meat";
}

export function createEmptyRecipeMixCounts() {
  return {
    vegetarian: 0,
    fish: 0,
    meat: 0,
  } satisfies Record<RecipeMixCategory, number>;
}

export function getRecipeMixTargets(totalSlots: number, settings: {
  vegetarianSharePct: number;
  fishSharePct: number;
  meatSharePct: number;
}) {
  return {
    vegetarian: (totalSlots * settings.vegetarianSharePct) / 100,
    fish: (totalSlots * settings.fishSharePct) / 100,
    meat: (totalSlots * settings.meatSharePct) / 100,
  } satisfies Record<RecipeMixCategory, number>;
}

export function isRecipeMixControlledMeal(recipe: Recipe) {
  return recipe.mealType === "lunch" || recipe.mealType === "dinner";
}
