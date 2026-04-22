import { HomeClient } from "./home-client";
import { buildShoppingListForWeek, getCurrentWeekPlan, getSettings, listRecipes } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function Home() {
  const settings = getSettings();
  const weekPlan = getCurrentWeekPlan();
  const recipes = listRecipes();

  if (!weekPlan) {
    throw new Error("Der aktuelle Wochenplan konnte nicht geladen werden.");
  }

  const shoppingGroups = buildShoppingListForWeek(weekPlan.startDate);

  const recipeCounts = {
    breakfast: recipes.filter((recipe) => recipe.mealType === "breakfast").length,
    lunch: recipes.filter((recipe) => recipe.mealType === "lunch").length,
    dinner: recipes.filter((recipe) => recipe.mealType === "dinner").length,
    snack: recipes.filter((recipe) => recipe.mealType === "snack").length,
  };

  const shoppingItemCount = shoppingGroups.reduce((sum, group) => sum + group.items.length, 0);
  return (
    <HomeClient
      initialSnapshot={{
        settings,
        weekPlan,
        recipeCounts,
        shoppingItemCount,
        savedAt: new Date().toISOString(),
      }}
    />
  );
}
