"use client";

import { useState } from "react";
import { z } from "zod";
import { saveLocalSettings } from "@/lib/local-store";
import {
  MAX_PROTEIN_TARGET_PEOPLE,
  normalizeProteinTargets,
  proteinGramsForPerson,
} from "@/lib/protein-targets";
import type { ProteinTargetPerson } from "@/lib/types";
import type { UserSettings } from "@/lib/types";
import styles from "./settings.module.css";

type SettingsFormProps = {
  onSaved?: (message: string) => Promise<void> | void;
  settings: UserSettings;
};

type SettingsFormState = {
  message: string;
  status: "idle" | "success" | "error";
};

const initialState: SettingsFormState = {
  message: "",
  status: "idle",
};

const settingsInputSchema = z
  .object({
    calorieTarget: z.coerce.number().int().min(1200).max(5000),
    defaultPeopleCount: z.coerce.number().int().min(1).max(12),
    includeSnackByDefault: z.boolean(),
    macroCarbsPct: z.coerce.number().int().min(0).max(100),
    macroFatPct: z.coerce.number().int().min(0).max(100),
    macroProteinPct: z.coerce.number().int().min(0).max(100),
    vegetarianSharePct: z.coerce.number().int().min(0).max(100),
    fishSharePct: z.coerce.number().int().min(0).max(100),
    meatSharePct: z.coerce.number().int().min(0).max(100),
    excludedIngredients: z.string().max(500),
    maxRecipeRepeatsPerWeek: z.coerce.number().int().min(1).max(7),
  })
  .superRefine((value, context) => {
    if (value.macroCarbsPct + value.macroFatPct + value.macroProteinPct !== 100) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kohlenhydrate, Fett und Eiweiß müssen zusammen 100 % ergeben.",
        path: ["macroCarbsPct"],
      });
    }

    if (value.vegetarianSharePct + value.fishSharePct + value.meatSharePct !== 100) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vegetarisch, Fisch und Fleisch müssen zusammen 100 % ergeben.",
        path: ["vegetarianSharePct"],
      });
    }
  });

function parseExcludedIngredients(value: string) {
  const seen = new Set<string>();

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => {
      const key = entry.toLocaleLowerCase("de-DE");
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

export function SettingsForm({ onSaved, settings }: SettingsFormProps) {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  const [peopleCount, setPeopleCount] = useState(settings.defaultPeopleCount);
  const [proteinTargets, setProteinTargets] = useState(() =>
    normalizeProteinTargets(settings.proteinTargets, MAX_PROTEIN_TARGET_PEOPLE),
  );

  function updatePeopleCount(value: number) {
    const nextPeopleCount = Number.isFinite(value)
      ? Math.max(1, Math.min(MAX_PROTEIN_TARGET_PEOPLE, Math.round(value)))
      : 1;

    setPeopleCount(nextPeopleCount);
    setProteinTargets((currentTargets) => normalizeProteinTargets(currentTargets, MAX_PROTEIN_TARGET_PEOPLE));
  }

  function updateProteinTarget(
    index: number,
    field: keyof Pick<ProteinTargetPerson, "bodyWeightKg" | "proteinGPerKg">,
    value: number,
  ) {
    setProteinTargets((currentTargets) => {
      const nextTargets = normalizeProteinTargets(currentTargets, MAX_PROTEIN_TARGET_PEOPLE);
      const previousTarget = nextTargets[index];

      if (!previousTarget || !Number.isFinite(value)) {
        return nextTargets;
      }

      nextTargets[index] = {
        ...previousTarget,
        [field]: value,
      };

      return nextTargets;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(initialState);

    const formData = new FormData(event.currentTarget);
    const parsed = settingsInputSchema.safeParse({
      calorieTarget: formData.get("calorieTarget"),
      defaultPeopleCount: formData.get("defaultPeopleCount"),
      includeSnackByDefault: formData.get("includeSnackByDefault") === "on",
      macroCarbsPct: formData.get("macroCarbsPct"),
      macroFatPct: formData.get("macroFatPct"),
      macroProteinPct: formData.get("macroProteinPct"),
      vegetarianSharePct: formData.get("vegetarianSharePct"),
      fishSharePct: formData.get("fishSharePct"),
      meatSharePct: formData.get("meatSharePct"),
      excludedIngredients: String(formData.get("excludedIngredients") ?? ""),
      maxRecipeRepeatsPerWeek: formData.get("maxRecipeRepeatsPerWeek"),
    });

    if (!parsed.success) {
      setState({
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Bitte prüfe die Eingaben.",
      });
      return;
    }

    setIsPending(true);

    try {
      await saveLocalSettings({
        ...settings,
        ...parsed.data,
        mealsPerDay: parsed.data.includeSnackByDefault ? 4 : 3,
        glutenFreeOnly: true,
        proteinTargets: normalizeProteinTargets(proteinTargets, MAX_PROTEIN_TARGET_PEOPLE),
        excludedIngredients: parseExcludedIngredients(parsed.data.excludedIngredients),
      });

      const message = "Einstellungen gespeichert.";
      await onSaved?.(message);
      setState({
        status: "success",
        message,
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Die Einstellungen konnten nicht gespeichert werden.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {state.status !== "idle" ? (
        <p
          aria-live="polite"
          className={state.status === "success" ? styles.actionFeedbackSuccess : styles.formMessage}
        >
          {state.message}
        </p>
      ) : null}

      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label htmlFor="defaultPeopleCount">Standard-Personenzahl</label>
          <input
            id="defaultPeopleCount"
            max={MAX_PROTEIN_TARGET_PEOPLE}
            min={1}
            name="defaultPeopleCount"
            onChange={(event) => updatePeopleCount(event.currentTarget.valueAsNumber)}
            required
            type="number"
            value={peopleCount}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="calorieTarget">Kalorienziel pro Tag</label>
          <input
            defaultValue={settings.calorieTarget}
            id="calorieTarget"
            max={5000}
            min={1200}
            name="calorieTarget"
            required
            step={50}
            type="number"
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="macroCarbsPct">Kohlenhydrate in %</label>
          <input defaultValue={settings.macroCarbsPct} id="macroCarbsPct" name="macroCarbsPct" required type="number" />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="macroFatPct">Fett in %</label>
          <input defaultValue={settings.macroFatPct} id="macroFatPct" name="macroFatPct" required type="number" />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="macroProteinPct">Eiweiß in %</label>
          <input defaultValue={settings.macroProteinPct} id="macroProteinPct" name="macroProteinPct" required type="number" />
        </div>

        <div className={`${styles.proteinTargetCard} ${styles.fullWidth}`}>
          <div className={styles.mixHeader}>
            <div>
              <p className={styles.mixEyebrow}>Eiweißziel</p>
              <h3>Pro Person nach Körpergewicht</h3>
            </div>
          </div>
          <p className={styles.mixHint}>
            Die Werte bleiben gespeichert, auch wenn Du die Standard-Personenzahl vorübergehend reduzierst.
          </p>
          <div className={styles.personTargetGrid}>
            {proteinTargets.slice(0, peopleCount).map((target, index) => (
              <div className={styles.personTargetRow} key={target.id}>
                <strong>{target.label}</strong>
                <label className={styles.compactInput}>
                  <span>Körpergewicht</span>
                  <input
                    max={250}
                    min={30}
                    onChange={(event) => updateProteinTarget(index, "bodyWeightKg", event.currentTarget.valueAsNumber)}
                    step={0.5}
                    type="number"
                    value={target.bodyWeightKg}
                  />
                </label>
                <label className={styles.compactInput}>
                  <span>Eiweiß g/kg</span>
                  <input
                    max={4}
                    min={0.5}
                    onChange={(event) => updateProteinTarget(index, "proteinGPerKg", event.currentTarget.valueAsNumber)}
                    step={0.1}
                    type="number"
                    value={target.proteinGPerKg}
                  />
                </label>
                <span className={styles.personTargetResult}>{proteinGramsForPerson(target)} g</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="maxRecipeRepeatsPerWeek">Wiederholungsstrafe nach</label>
          <input
            defaultValue={settings.maxRecipeRepeatsPerWeek}
            id="maxRecipeRepeatsPerWeek"
            max={7}
            min={1}
            name="maxRecipeRepeatsPerWeek"
            required
            type="number"
          />
        </div>

        <div className={`${styles.checkboxGrid} ${styles.fullWidth}`}>
          <label className={styles.checkboxLabel}>
            <input defaultChecked={settings.includeSnackByDefault} name="includeSnackByDefault" type="checkbox" />
            <span className={styles.checkboxText}>
              <strong>Snacks automatisch einplanen</strong>
              <span>Zusätzliche Snacks können im Tagesdetail jederzeit manuell ergänzt werden.</span>
            </span>
          </label>
        </div>

        <div className={`${styles.mixCard} ${styles.fullWidth}`}>
          <div className={styles.mixHeader}>
            <div>
              <p className={styles.mixEyebrow}>Zielmix für Mittag und Abend</p>
              <h3>Vegetarisch, Fisch und Fleisch</h3>
            </div>
          </div>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label htmlFor="vegetarianSharePct">Vegetarisch</label>
              <input defaultValue={settings.vegetarianSharePct} id="vegetarianSharePct" name="vegetarianSharePct" required type="number" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="fishSharePct">Fisch</label>
              <input defaultValue={settings.fishSharePct} id="fishSharePct" name="fishSharePct" required type="number" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="meatSharePct">Fleisch</label>
              <input defaultValue={settings.meatSharePct} id="meatSharePct" name="meatSharePct" required type="number" />
            </div>
          </div>
        </div>

        <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
          <label htmlFor="excludedIngredients">Ausgeschlossene Zutaten</label>
          <textarea
            defaultValue={settings.excludedIngredients.join(", ")}
            id="excludedIngredients"
            name="excludedIngredients"
            placeholder="zum Beispiel Pilze, Sellerie, Koriander"
          />
        </div>
      </div>

      <div className={styles.actionRow}>
        <button className={styles.primaryButton} disabled={isPending} type="submit">
          {isPending ? "Speichert ..." : "Einstellungen speichern"}
        </button>
      </div>
    </form>
  );
}
