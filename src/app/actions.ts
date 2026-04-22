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

type SettingsFieldErrors = Partial<
  Record<
    | "calorieTarget"
    | "macroCarbsPct"
    | "macroFatPct"
    | "macroProteinPct"
    | "mealsPerDay"
    | "excludedIngredients"
    | "maxRecipeRepeatsPerWeek",
    string[]
  >
>;

export type SettingsFormState = {
  status: "idle" | "error";
  message: string;
  fieldErrors: SettingsFieldErrors;
};

export async function regenerateCurrentWeekAction() {
  regenerateCurrentWeekPlan();
}

export async function saveSettingsAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const parsed = settingsSchema.safeParse({
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

  if (!parsed.success) {
    return {
      status: "error",
      message: "Bitte prüfe deine Eingaben und korrigiere die markierten Felder.",
      fieldErrors: parsed.error.flatten().fieldErrors as SettingsFieldErrors,
    };
  }

  const macroSum = parsed.data.macroCarbsPct + parsed.data.macroFatPct + parsed.data.macroProteinPct;
  if (Math.round(macroSum) !== 100) {
    return {
      status: "error",
      message: "Die Makroverteilung muss zusammen genau 100 % ergeben.",
      fieldErrors: {
        macroProteinPct: ["Zusammen mit Kohlenhydraten und Fett müssen es 100 % sein."],
        macroCarbsPct: ["Zusammen mit Protein und Fett müssen es 100 % sein."],
        macroFatPct: ["Zusammen mit Protein und Kohlenhydraten müssen es 100 % sein."],
      },
    };
  }

  try {
    saveSettings({
      calorieTarget: parsed.data.calorieTarget,
      macroCarbsPct: parsed.data.macroCarbsPct,
      macroFatPct: parsed.data.macroFatPct,
      macroProteinPct: parsed.data.macroProteinPct,
      mealsPerDay: parsed.data.mealsPerDay,
      glutenFreeOnly: true,
      vegetarian: parsed.data.vegetarian,
      reduceMeat: parsed.data.reduceMeat,
      excludedIngredients: parsed.data.excludedIngredients,
      maxRecipeRepeatsPerWeek: parsed.data.maxRecipeRepeatsPerWeek,
    });

    regenerateCurrentWeekPlan();
  } catch {
    return {
      status: "error",
      message:
        "Deine Einstellungen konnten gerade nicht gespeichert werden. Bitte versuche es noch einmal.",
      fieldErrors: {},
    };
  }

  redirect("/einstellungen?status=gespeichert");
}
