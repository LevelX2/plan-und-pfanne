import { additionalRecipes } from "@/lib/data/additional-recipes";
import { demoRecipes } from "@/lib/data/demo-recipes";
import { importedRecipes } from "@/lib/data/imported-recipes";

export const seedRecipes = [
  ...demoRecipes,
  ...importedRecipes,
  ...additionalRecipes,
];
