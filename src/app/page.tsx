import { HomeClient } from "./home-client";
import { requireUser } from "@/lib/auth";
import { getCurrentWeekPlan, getSettings, listRecipes } from "@/lib/store";
import { createUserStorageNamespace } from "@/lib/user-storage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser("/");
  const settings = getSettings(user.id);
  const weekPlan = getCurrentWeekPlan(user.id);
  const recipes = listRecipes(user.id);

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
      storageNamespace={createUserStorageNamespace(user.id)}
      user={{
        email: user.email,
        displayName: user.displayName,
      }}
    />
  );
}
