import { additionalRecipes } from "@/lib/data/additional-recipes";
import { demoRecipes } from "@/lib/data/demo-recipes";
import { withDetailedInstructions } from "@/lib/data/detailed-instructions";
import { importedRecipes } from "@/lib/data/imported-recipes";

export const seedRecipes = withDetailedInstructions([
  ...demoRecipes,
  ...importedRecipes,
  ...additionalRecipes,
]);
