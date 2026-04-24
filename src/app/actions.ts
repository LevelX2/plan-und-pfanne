import { z } from "zod";

const settingsSchema = z.object({
  calorieTarget: z.coerce.number().int().min(1200).max(5000),
  macroCarbsPct: z.coerce.number().min(10).max(60),
  macroFatPct: z.coerce.number().min(10).max(50),
  macroProteinPct: z.coerce.number().min(20).max(60),
  mealsPerDay: z.coerce.number().int().min(3).max(4),
  vegetarianSharePct: z.coerce.number().int().min(0).max(100),
  fishSharePct: z.coerce.number().int().min(0).max(100),
  meatSharePct: z.coerce.number().int().min(0).max(100),
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
    | "vegetarianSharePct"
    | "fishSharePct"
    | "meatSharePct"
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

export type RegenerateWeekFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function regenerateCurrentWeekAction(): Promise<RegenerateWeekFormState> {
  return {
    status: "success",
    message:
      "Diese Aktion wird hier nicht mehr verwendet. Nutze stattdessen die direkte Tagesplanung in der App.",
  };
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
    vegetarianSharePct: formData.get("vegetarianSharePct"),
    fishSharePct: formData.get("fishSharePct"),
    meatSharePct: formData.get("meatSharePct"),
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

  const recipeMixSum =
    parsed.data.vegetarianSharePct + parsed.data.fishSharePct + parsed.data.meatSharePct;
  if (recipeMixSum !== 100) {
    return {
      status: "error",
      message: "Der Zielmix für vegetarisch, Fisch und Fleisch muss zusammen genau 100 % ergeben.",
      fieldErrors: {
        vegetarianSharePct: ["Zusammen mit Fisch und Fleisch müssen es 100 % sein."],
        fishSharePct: ["Zusammen mit vegetarisch und Fleisch müssen es 100 % sein."],
        meatSharePct: ["Zusammen mit vegetarisch und Fisch müssen es 100 % sein."],
      },
    };
  }

  return {
    status: "error",
    message:
      "Dieses Formular wird hier nicht mehr verwendet. Änderungen speicherst du direkt in der aktuellen Einstellungsseite der App.",
    fieldErrors: {},
  };
}
