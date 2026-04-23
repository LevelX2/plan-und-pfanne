"use client";

import { useState } from "react";
import { z } from "zod";
import styles from "./settings.module.css";
import { saveLocalSettings } from "@/lib/local-store";
import type { UserSettings } from "@/lib/types";

type SettingsFormProps = {
  onSaved?: (message: string) => Promise<void> | void;
  settings: UserSettings;
};

type MixKey = "vegetarianSharePct" | "fishSharePct" | "meatSharePct";
type MixState = Record<MixKey, number>;

type SettingsFieldKey =
  | "calorieTarget"
  | "mealsPerDay"
  | "macroProteinPct"
  | "macroCarbsPct"
  | "macroFatPct"
  | "maxRecipeRepeatsPerWeek"
  | "vegetarianSharePct"
  | "fishSharePct"
  | "meatSharePct"
  | "excludedIngredients";

type SettingsFieldErrors = Partial<Record<SettingsFieldKey, string>>;

type SettingsFormState = {
  fieldErrors: SettingsFieldErrors;
  message: string;
  status: "idle" | "success" | "error";
};

const initialSettingsFormState: SettingsFormState = {
  fieldErrors: {},
  message: "",
  status: "idle",
};

const mixKeys: MixKey[] = ["vegetarianSharePct", "fishSharePct", "meatSharePct"];

const mixContent: Record<MixKey, { title: string; copy: string }> = {
  vegetarianSharePct: {
    title: "Vegetarisch",
    copy: "Zum Beispiel Hülsenfrüchte, Tofu, Eier oder Milchprodukte.",
  },
  fishSharePct: {
    title: "Fisch",
    copy: "Für Fischgerichte wie Lachs, Thunfisch, Kabeljau oder Garnelen.",
  },
  meatSharePct: {
    title: "Fleisch",
    copy: "Für Gerichte mit Huhn, Pute, Rind oder ähnlichen Fleischquellen.",
  },
};

function parseExcludedIngredients(value: string) {
  const seen = new Set<string>();

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => {
      const normalized = entry.toLocaleLowerCase("de-DE");
      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
}

const settingsInputSchema = z
  .object({
    calorieTarget: z.coerce.number().int().min(1200, "Bitte mindestens 1200 kcal wählen.").max(5000, "Bitte höchstens 5000 kcal wählen."),
    mealsPerDay: z.coerce
      .number()
      .int()
      .refine((value) => value === 3 || value === 4, "Bitte 3 oder 4 Mahlzeiten wählen."),
    macroProteinPct: z.coerce.number().int().min(20, "Bitte mindestens 20 % Protein wählen.").max(60, "Bitte höchstens 60 % Protein wählen."),
    macroCarbsPct: z.coerce.number().int().min(10, "Bitte mindestens 10 % Kohlenhydrate wählen.").max(60, "Bitte höchstens 60 % Kohlenhydrate wählen."),
    macroFatPct: z.coerce.number().int().min(10, "Bitte mindestens 10 % Fett wählen.").max(50, "Bitte höchstens 50 % Fett wählen."),
    maxRecipeRepeatsPerWeek: z.coerce.number().int().min(1, "Bitte mindestens 1 Wiederholung zulassen.").max(4, "Bitte höchstens 4 Wiederholungen zulassen."),
    vegetarianSharePct: z.coerce.number().int().min(0, "Nicht unter 0 % möglich.").max(100, "Nicht über 100 % möglich."),
    fishSharePct: z.coerce.number().int().min(0, "Nicht unter 0 % möglich.").max(100, "Nicht über 100 % möglich."),
    meatSharePct: z.coerce.number().int().min(0, "Nicht unter 0 % möglich.").max(100, "Nicht über 100 % möglich."),
    excludedIngredients: z
      .string()
      .max(500, "Bitte die Liste der Ausschlüsse kürzer halten.")
      .transform(parseExcludedIngredients),
  })
  .superRefine((value, context) => {
    const macroSum = value.macroProteinPct + value.macroCarbsPct + value.macroFatPct;
    if (macroSum !== 100) {
      for (const key of ["macroProteinPct", "macroCarbsPct", "macroFatPct"] as const) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Protein, Kohlenhydrate und Fett müssen zusammen 100 % ergeben.",
          path: [key],
        });
      }
    }

    const mixSum = value.vegetarianSharePct + value.fishSharePct + value.meatSharePct;
    if (mixSum !== 100) {
      for (const key of mixKeys) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vegetarisch, Fisch und Fleisch müssen zusammen 100 % ergeben.",
          path: [key],
        });
      }
    }
  });

function fieldError(state: SettingsFormState, key: SettingsFieldKey) {
  return state.fieldErrors[key];
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function distributeWeighted(values: Array<{ key: MixKey; weight: number }>, total: number) {
  if (values.length === 0) {
    return {} as Record<MixKey, number>;
  }

  const safeWeights = values.some((item) => item.weight > 0)
    ? values
    : values.map((item) => ({ ...item, weight: 1 }));
  const weightSum = safeWeights.reduce((sum, item) => sum + item.weight, 0);

  const withFractions = safeWeights.map((item) => {
    const exact = (item.weight / weightSum) * total;
    return {
      key: item.key,
      floorValue: Math.floor(exact),
      remainder: exact - Math.floor(exact),
    };
  });

  let remaining = total - withFractions.reduce((sum, item) => sum + item.floorValue, 0);
  withFractions.sort((left, right) => right.remainder - left.remainder);

  const result = {} as Record<MixKey, number>;
  for (const item of withFractions) {
    const extra = remaining > 0 ? 1 : 0;
    result[item.key] = item.floorValue + extra;
    remaining -= extra;
  }

  return result;
}

function rebalanceMix(current: MixState, changedKey: MixKey, nextValue: number): MixState {
  const clampedValue = clampPercent(nextValue);
  const remaining = 100 - clampedValue;
  const otherKeys = mixKeys.filter((key) => key !== changedKey);
  const redistributed = distributeWeighted(
    otherKeys.map((key) => ({ key, weight: current[key] })),
    remaining,
  );

  return {
    vegetarianSharePct:
      changedKey === "vegetarianSharePct" ? clampedValue : redistributed.vegetarianSharePct,
    fishSharePct: changedKey === "fishSharePct" ? clampedValue : redistributed.fishSharePct,
    meatSharePct: changedKey === "meatSharePct" ? clampedValue : redistributed.meatSharePct,
  };
}

function toFieldErrors(error: z.ZodError): SettingsFieldErrors {
  const nextErrors: SettingsFieldErrors = {};

  for (const issue of error.issues) {
    const [field] = issue.path;
    if (typeof field === "string" && !(field in nextErrors)) {
      nextErrors[field as SettingsFieldKey] = issue.message;
    }
  }

  return nextErrors;
}

function buildSettingsPayload(formData: FormData, fallbackSettings: UserSettings) {
  const parsed = settingsInputSchema.safeParse({
    calorieTarget: formData.get("calorieTarget"),
    mealsPerDay: formData.get("mealsPerDay"),
    macroProteinPct: formData.get("macroProteinPct"),
    macroCarbsPct: formData.get("macroCarbsPct"),
    macroFatPct: formData.get("macroFatPct"),
    maxRecipeRepeatsPerWeek: formData.get("maxRecipeRepeatsPerWeek"),
    vegetarianSharePct: formData.get("vegetarianSharePct"),
    fishSharePct: formData.get("fishSharePct"),
    meatSharePct: formData.get("meatSharePct"),
    excludedIngredients: String(formData.get("excludedIngredients") ?? ""),
  });

  if (!parsed.success) {
    return parsed;
  }

  return {
    success: true as const,
    data: {
      ...fallbackSettings,
      ...parsed.data,
      glutenFreeOnly: true,
    } satisfies UserSettings,
  };
}

function feedbackClassName(state: SettingsFormState) {
  if (state.status === "success") {
    return styles.actionFeedbackSuccess;
  }

  if (state.status === "error") {
    return styles.formMessage;
  }

  return null;
}

export function SettingsForm({ onSaved, settings }: SettingsFormProps) {
  const [state, setState] = useState(initialSettingsFormState);
  const [isPending, setIsPending] = useState(false);
  const [mix, setMix] = useState<MixState>({
    vegetarianSharePct: settings.vegetarianSharePct,
    fishSharePct: settings.fishSharePct,
    meatSharePct: settings.meatSharePct,
  });

  const mixError =
    fieldError(state, "vegetarianSharePct") ??
    fieldError(state, "fishSharePct") ??
    fieldError(state, "meatSharePct");
  const mixSum = mix.vegetarianSharePct + mix.fishSharePct + mix.meatSharePct;
  const feedbackClass = feedbackClassName(state);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(initialSettingsFormState);

    const formData = new FormData(event.currentTarget);
    const payload = buildSettingsPayload(formData, settings);

    if (!payload.success) {
      setState({
        fieldErrors: toFieldErrors(payload.error),
        message: "Bitte prüfe die markierten Felder.",
        status: "error",
      });
      return;
    }

    setIsPending(true);

    try {
      await saveLocalSettings(payload.data, {
        reason: "settings-change",
        regenerateCurrentWeekPlan: true,
      });

      const successMessage = "Einstellungen lokal gespeichert und Woche neu geplant.";
      await onSaved?.(successMessage);

      setState({
        fieldErrors: {},
        message: successMessage,
        status: "success",
      });
    } catch (error) {
      setState({
        fieldErrors: {},
        message:
          error instanceof Error
            ? error.message
            : "Die Einstellungen konnten lokal nicht gespeichert werden.",
        status: "error",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {state.status !== "idle" && feedbackClass ? (
        <p aria-live="polite" className={feedbackClass}>
          {state.message}
        </p>
      ) : null}

      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label htmlFor="calorieTarget">Kalorienziel pro Tag</label>
          <input
            aria-describedby={fieldError(state, "calorieTarget") ? "calorieTarget-error" : undefined}
            aria-invalid={Boolean(fieldError(state, "calorieTarget"))}
            defaultValue={settings.calorieTarget}
            id="calorieTarget"
            max={5000}
            min={1200}
            name="calorieTarget"
            required
            step={50}
            type="number"
          />
          {fieldError(state, "calorieTarget") ? (
            <p className={styles.fieldError} id="calorieTarget-error">
              {fieldError(state, "calorieTarget")}
            </p>
          ) : null}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="mealsPerDay">Mahlzeiten pro Tag</label>
          <select
            aria-describedby={fieldError(state, "mealsPerDay") ? "mealsPerDay-error" : undefined}
            aria-invalid={Boolean(fieldError(state, "mealsPerDay"))}
            defaultValue={String(settings.mealsPerDay)}
            id="mealsPerDay"
            name="mealsPerDay"
          >
            <option value="3">3 Mahlzeiten</option>
            <option value="4">4 Mahlzeiten mit Snack</option>
          </select>
          {fieldError(state, "mealsPerDay") ? (
            <p className={styles.fieldError} id="mealsPerDay-error">
              {fieldError(state, "mealsPerDay")}
            </p>
          ) : null}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="macroProteinPct">Protein in %</label>
          <input
            aria-describedby={fieldError(state, "macroProteinPct") ? "macroProteinPct-error" : undefined}
            aria-invalid={Boolean(fieldError(state, "macroProteinPct"))}
            defaultValue={settings.macroProteinPct}
            id="macroProteinPct"
            max={60}
            min={20}
            name="macroProteinPct"
            required
            step={1}
            type="number"
          />
          {fieldError(state, "macroProteinPct") ? (
            <p className={styles.fieldError} id="macroProteinPct-error">
              {fieldError(state, "macroProteinPct")}
            </p>
          ) : null}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="macroCarbsPct">Kohlenhydrate in %</label>
          <input
            aria-describedby={fieldError(state, "macroCarbsPct") ? "macroCarbsPct-error" : undefined}
            aria-invalid={Boolean(fieldError(state, "macroCarbsPct"))}
            defaultValue={settings.macroCarbsPct}
            id="macroCarbsPct"
            max={60}
            min={10}
            name="macroCarbsPct"
            required
            step={1}
            type="number"
          />
          {fieldError(state, "macroCarbsPct") ? (
            <p className={styles.fieldError} id="macroCarbsPct-error">
              {fieldError(state, "macroCarbsPct")}
            </p>
          ) : null}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="macroFatPct">Fett in %</label>
          <input
            aria-describedby={fieldError(state, "macroFatPct") ? "macroFatPct-error" : undefined}
            aria-invalid={Boolean(fieldError(state, "macroFatPct"))}
            defaultValue={settings.macroFatPct}
            id="macroFatPct"
            max={50}
            min={10}
            name="macroFatPct"
            required
            step={1}
            type="number"
          />
          {fieldError(state, "macroFatPct") ? (
            <p className={styles.fieldError} id="macroFatPct-error">
              {fieldError(state, "macroFatPct")}
            </p>
          ) : null}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="maxRecipeRepeatsPerWeek">Maximale Wiederholungen pro Woche</label>
          <select
            aria-describedby={
              fieldError(state, "maxRecipeRepeatsPerWeek")
                ? "maxRecipeRepeatsPerWeek-error"
                : undefined
            }
            aria-invalid={Boolean(fieldError(state, "maxRecipeRepeatsPerWeek"))}
            defaultValue={String(settings.maxRecipeRepeatsPerWeek)}
            id="maxRecipeRepeatsPerWeek"
            name="maxRecipeRepeatsPerWeek"
          >
            <option value="1">1 Wiederholung</option>
            <option value="2">2 Wiederholungen</option>
            <option value="3">3 Wiederholungen</option>
            <option value="4">4 Wiederholungen</option>
          </select>
          {fieldError(state, "maxRecipeRepeatsPerWeek") ? (
            <p className={styles.fieldError} id="maxRecipeRepeatsPerWeek-error">
              {fieldError(state, "maxRecipeRepeatsPerWeek")}
            </p>
          ) : null}
        </div>

        <div className={`${styles.mixCard} ${styles.fullWidth}`}>
          <div className={styles.mixHeader}>
            <div>
              <p className={styles.mixEyebrow}>Zielmix für Mittag und Abend</p>
              <h3>Vegetarisch, Fisch und Fleisch im Wochenplan ausbalancieren</h3>
            </div>
            <span className={mixSum === 100 ? styles.mixBadgeValid : styles.mixBadgeInvalid}>
              Summe: {mixSum} %
            </span>
          </div>

          <p className={styles.mixHint}>
            Der lokale Planer nutzt diese Verteilung als Zielmix für Mittagessen und Abendessen.
            Frühstück und Snack laufen weiterhin über den allgemeinen Rezeptpool.
          </p>

          <div className={styles.mixSliderList}>
            {mixKeys.map((key) => (
              <div className={styles.mixSliderCard} key={key}>
                <div className={styles.mixSliderTop}>
                  <div>
                    <label className={styles.mixLabel} htmlFor={key}>
                      {mixContent[key].title}
                    </label>
                    <p className={styles.mixCopy}>{mixContent[key].copy}</p>
                  </div>
                  <strong>{mix[key]} %</strong>
                </div>

                <input
                  className={styles.mixSlider}
                  id={key}
                  max={100}
                  min={0}
                  onChange={(event) => {
                    const nextValue = Number(event.currentTarget.value);
                    setMix((current) => rebalanceMix(current, key, nextValue));
                  }}
                  step={1}
                  type="range"
                  value={mix[key]}
                />
              </div>
            ))}
          </div>

          <div className={styles.mixInlineValues}>
            <span>Vegetarisch {mix.vegetarianSharePct} %</span>
            <span>Fisch {mix.fishSharePct} %</span>
            <span>Fleisch {mix.meatSharePct} %</span>
          </div>

          <input name="vegetarianSharePct" type="hidden" value={mix.vegetarianSharePct} />
          <input name="fishSharePct" type="hidden" value={mix.fishSharePct} />
          <input name="meatSharePct" type="hidden" value={mix.meatSharePct} />

          {mixError ? (
            <p className={styles.fieldError} id="recipeMix-error">
              {mixError}
            </p>
          ) : null}
        </div>

        <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
          <label htmlFor="excludedIngredients">Ausgeschlossene Zutaten</label>
          <textarea
            aria-describedby={
              fieldError(state, "excludedIngredients") ? "excludedIngredients-error" : undefined
            }
            aria-invalid={Boolean(fieldError(state, "excludedIngredients"))}
            defaultValue={settings.excludedIngredients.join(", ")}
            id="excludedIngredients"
            name="excludedIngredients"
            placeholder="zum Beispiel Pilze, Sellerie, Koriander"
          />
          {fieldError(state, "excludedIngredients") ? (
            <p className={styles.fieldError} id="excludedIngredients-error">
              {fieldError(state, "excludedIngredients")}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.actionRow}>
        <button className={styles.primaryButton} disabled={isPending} type="submit">
          {isPending ? "Speichert lokal und plant neu ..." : "Änderungen speichern und Woche neu planen"}
        </button>
      </div>
    </form>
  );
}
