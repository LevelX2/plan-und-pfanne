import { listRecipes } from "@/lib/store";
import { RecipesClient } from "./recipes-client";

export const dynamic = "force-dynamic";

export default function RecipesPage() {
  const recipes = listRecipes();
  return <RecipesClient initialRecipes={recipes} />;
}
