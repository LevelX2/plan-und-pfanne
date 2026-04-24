"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppNav } from "@/app/app-nav";
import { DateStepper } from "@/app/date-stepper";
import { addDays } from "@/lib/date";
import {
  findLocalPlanOverlaps,
  generateLocalPlanRange,
  getDefaultPlanEndDate,
  getDefaultPlanStartDate,
  getLocalSettings,
} from "@/lib/local-store";
import type { UserSettings } from "@/lib/types";
import styles from "@/app/einstellungen/settings.module.css";

type FormState = {
  status: "idle" | "checking" | "confirm-overwrite" | "success" | "error";
  message: string;
  overlapDates: string[];
};

const initialFormState: FormState = {
  status: "idle",
  message: "",
  overlapDates: [],
};

export default function PlanPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [state, setState] = useState<FormState>(initialFormState);
  const [startDate, setStartDate] = useState(getDefaultPlanStartDate());
  const [endDate, setEndDate] = useState(getDefaultPlanEndDate());
  const [peopleCount, setPeopleCount] = useState(2);

  useEffect(() => {
    let cancelled = false;

    void getLocalSettings().then((nextSettings) => {
      if (cancelled) {
        return;
      }

      setSettings(nextSettings);
      setPeopleCount(nextSettings.defaultPeopleCount);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function normalizeDates(nextStartDate: string, nextEndDate: string) {
    if (nextEndDate < nextStartDate) {
      return {
        startDate: nextStartDate,
        endDate: nextStartDate,
      };
    }

    return {
      startDate: nextStartDate,
      endDate: nextEndDate,
    };
  }

  function updateStartDate(nextStartDate: string) {
    setStartDate(nextStartDate);
    if (endDate < nextStartDate) {
      setEndDate(nextStartDate);
    }
  }

  async function submitPlan(overwrite: boolean) {
    setState({ ...initialFormState, status: "checking" });

    try {
      const normalized = normalizeDates(startDate, endDate);
      const overlaps = await findLocalPlanOverlaps(normalized.startDate, normalized.endDate);

      if (overlaps.length > 0 && !overwrite) {
        setState({
          status: "confirm-overwrite",
          message: `Für ${overlaps.length} Tage im gewählten Zeitraum existieren bereits geplante Mahlzeiten. Wenn Du fortfährst, werden diese Tage überschrieben.`,
          overlapDates: overlaps,
        });
        return;
      }

      await generateLocalPlanRange({
        startDate: normalized.startDate,
        endDate: normalized.endDate,
        peopleCount,
        overwrite,
      });

      setState({
        status: "success",
        message: "Der Ernährungsplan wurde für den gewählten Zeitraum erzeugt.",
        overlapDates: [],
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Der Plan konnte nicht erzeugt werden.",
        overlapDates: [],
      });
    }
  }

  return (
    <main className={styles.page}>
      <AppNav currentPath="/planen" />

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Plan generieren</p>
          <h1>Wähle Deinen Planzeitraum.</h1>
          <p className={styles.lead}>
            Die App plant immer auf Tagesebene. Pro Datum gibt es genau einen Plan, bestehende
            Tage werden erst nach Bestätigung überschrieben.
          </p>
        </div>

        <aside className={styles.heroPanel}>
          <div>
            <p className={styles.sectionKicker}>Vorbelegung</p>
            <h2>Morgen bis {addDays(getDefaultPlanStartDate(), 4)}</h2>
            <p>
              Standardmäßig startet die Planung morgen und nutzt {settings?.defaultPeopleCount ?? 2} Personen.
            </p>
          </div>
        </aside>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <article className={styles.formCard}>
            <p className={styles.sectionKicker}>Zeitraum</p>
            <h2>Neuen Ernährungsplan erstellen</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submitPlan(false);
              }}
            >
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <DateStepper
                    id="startDate"
                    label="Startdatum"
                    name="startDate"
                    onChange={updateStartDate}
                    required
                    value={startDate}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <DateStepper
                    id="endDate"
                    label="Enddatum"
                    min={startDate}
                    name="endDate"
                    onChange={setEndDate}
                    required
                    value={endDate}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="peopleCount">Personenzahl</label>
                  <input
                    id="peopleCount"
                    max={12}
                    min={1}
                    name="peopleCount"
                    onChange={(event) => setPeopleCount(Number(event.currentTarget.value))}
                    required
                    type="number"
                    value={peopleCount}
                  />
                </div>
              </div>

              {state.message ? (
                <p
                  className={
                    state.status === "success"
                      ? styles.actionFeedbackSuccess
                      : state.status === "confirm-overwrite"
                        ? styles.formMessage
                        : styles.actionFeedbackError
                  }
                >
                  {state.message}
                </p>
              ) : null}

              {state.status === "confirm-overwrite" ? (
                <div className={styles.actionRow}>
                  <button
                    className={styles.primaryButton}
                    onClick={() => void submitPlan(true)}
                    type="button"
                  >
                    Bestehende Tage überschreiben
                  </button>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => setState(initialFormState)}
                    type="button"
                  >
                    Abbrechen
                  </button>
                </div>
              ) : (
                <div className={styles.actionRow}>
                  <button className={styles.primaryButton} disabled={state.status === "checking"} type="submit">
                    {state.status === "checking" ? "Prüft Zeitraum ..." : "Generieren"}
                  </button>
                  {state.status === "success" ? (
                    <Link className={styles.secondaryButton} href="/">
                      Aktuellen Plan öffnen
                    </Link>
                  ) : null}
                </div>
              )}
            </form>
          </article>
        </div>

        <aside className={styles.sideColumn}>
          <article className={styles.infoCard}>
            <p className={styles.sectionKicker}>Überschneidungen</p>
            <h2>Ein Datum, ein Plan</h2>
            <p>
              Wenn ein Zielzeitraum bereits geplante Tage enthält, zeigt die App eine Warnung.
              Erst danach wird überschrieben.
            </p>
          </article>
        </aside>
      </section>
    </main>
  );
}
