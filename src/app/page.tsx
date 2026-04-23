import { HomeClient } from "./home-client";
import { getCurrentWeekPlan, getSettings, listRecipes } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function Home() {
  const settings = getSettings();
  const weekPlan = getCurrentWeekPlan();
  const recipes = listRecipes();

  if (!weekPlan) {
    throw new Error("Der aktuelle Wochenplan konnte nicht geladen werden.");
  }

  const recipeCounts = {
    breakfast: recipes.filter((recipe) => recipe.mealType === "breakfast").length,
    lunch: recipes.filter((recipe) => recipe.mealType === "lunch").length,
    dinner: recipes.filter((recipe) => recipe.mealType === "dinner").length,
    snack: recipes.filter((recipe) => recipe.mealType === "snack").length,
  };

  return (
    <HomeClient
      initialSnapshot={{
        settings,
        weekPlan,
        recipeCounts,
        savedAt: new Date().toISOString(),
      }}
    />
  );
}
