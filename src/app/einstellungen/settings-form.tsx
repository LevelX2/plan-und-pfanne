"use client";

import { useActionState, useState } from "react";
import { saveSettingsAction, type SettingsFormState } from "@/app/actions";
import styles from "./settings.module.css";
import type { UserSettings } from "@/lib/types";

type SettingsFormProps = {
  settings: UserSettings;
};

type MixKey = "vegetarianSharePct" | "fishSharePct" | "meatSharePct";
type MixState = Record<MixKey, number>;

const initialSettingsFormState: SettingsFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
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

function fieldError(state: SettingsFormState, key: keyof SettingsFormState["fieldErrors"]) {
  return state.fieldErrors[key]?.[0];
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

export function SettingsForm({ settings }: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(saveSettingsAction, initialSettingsFormState);
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

  return (
    <form action={formAction}>
      {state.status === "error" ? (
        <p aria-live="polite" className={styles.formMessage}>
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
            Der Planer nutzt diese Verteilung als Zielmix für Mittagessen und Abendessen. Frühstück
            und Snack laufen weiterhin über den allgemeinen Rezeptpool.
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
        <button className={styles.primaryButton} disabled={pending} type="submit">
          {pending ? "Speichert und plant neu ..." : "Änderungen speichern und Woche neu planen"}
        </button>
      </div>
    </form>
  );
}
