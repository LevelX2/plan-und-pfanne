"use client";

import { useActionState } from "react";
import { saveSettingsAction, type SettingsFormState } from "@/app/actions";
import styles from "./settings.module.css";
import type { UserSettings } from "@/lib/types";

type SettingsFormProps = {
  settings: UserSettings;
};

const initialSettingsFormState: SettingsFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

function fieldError(state: SettingsFormState, key: keyof SettingsFormState["fieldErrors"]) {
  return state.fieldErrors[key]?.[0];
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(saveSettingsAction, initialSettingsFormState);

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

        <div className={`${styles.checkboxGrid} ${styles.fullWidth}`}>
          <label className={styles.checkboxLabel}>
            <input defaultChecked={settings.vegetarian} name="vegetarian" type="checkbox" />
            <span className={styles.checkboxText}>
              <strong>Vegetarisch planen</strong>
              <span>Berücksichtigt nur vegetarische Rezepte im Wochenplan.</span>
            </span>
          </label>

          <label className={styles.checkboxLabel}>
            <input defaultChecked={settings.reduceMeat} name="reduceMeat" type="checkbox" />
            <span className={styles.checkboxText}>
              <strong>Fleisch reduzieren</strong>
              <span>Schiebt fleischlastige Kombinationen im Planer weiter nach hinten.</span>
            </span>
          </label>
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
