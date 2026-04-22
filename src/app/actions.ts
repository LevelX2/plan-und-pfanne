"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { regenerateCurrentWeekPlan, saveSettings } from "@/lib/store";

const settingsSchema = z.object({
  calorieTarget: z.coerce.number().int().min(1200).max(5000),
  macroCarbsPct: z.coerce.number().min(10).max(60),
  macroFatPct: z.coerce.number().min(10).max(50),
  macroProteinPct: z.coerce.number().min(20).max(60),
  mealsPerDay: z.coerce.number().int().min(3).max(4),
  vegetarian: z.boolean(),
  reduceMeat: z.boolean(),
  excludedIngredients: z.array(z.string()),
  maxRecipeRepeatsPerWeek: z.coerce.number().int().min(1).max(4),
});

export async function regenerateCurrentWeekAction() {
  regenerateCurrentWeekPlan();
}

export async function saveSettingsAction(formData: FormData) {
  const parsed = settingsSchema.parse({
    calorieTarget: formData.get("calorieTarget"),
    macroCarbsPct: formData.get("macroCarbsPct"),
    macroFatPct: formData.get("macroFatPct"),
    macroProteinPct: formData.get("macroProteinPct"),
    mealsPerDay: formData.get("mealsPerDay"),
    vegetarian: formData.get("vegetarian") === "on",
    reduceMeat: formData.get("reduceMeat") === "on",
    excludedIngredients: String(formData.get("excludedIngredients") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    maxRecipeRepeatsPerWeek: formData.get("maxRecipeRepeatsPerWeek"),
  });

  const macroSum = parsed.macroCarbsPct + parsed.macroFatPct + parsed.macroProteinPct;
  if (Math.round(macroSum) !== 100) {
    throw new Error("Die Makroverteilung muss in Summe 100 % ergeben.");
  }

  saveSettings({
    calorieTarget: parsed.calorieTarget,
    macroCarbsPct: parsed.macroCarbsPct,
    macroFatPct: parsed.macroFatPct,
    macroProteinPct: parsed.macroProteinPct,
    mealsPerDay: parsed.mealsPerDay,
    glutenFreeOnly: true,
    vegetarian: parsed.vegetarian,
    reduceMeat: parsed.reduceMeat,
    excludedIngredients: parsed.excludedIngredients,
    maxRecipeRepeatsPerWeek: parsed.maxRecipeRepeatsPerWeek,
  });

  regenerateCurrentWeekPlan();
  redirect("/einstellungen");
}
