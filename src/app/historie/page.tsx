"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppNav } from "@/app/app-nav";
import { DateStepper } from "@/app/date-stepper";
import { addDays, todayInBerlinIso } from "@/lib/date";
import { copyLocalPlannedDays, findLocalPlanOverlaps, listLocalPlannedDays } from "@/lib/local-store";
import { formatDateGerman, formatMealType } from "@/lib/format";
import type { DayPlan } from "@/lib/types";
import styles from "@/app/einstellungen/settings.module.css";

type CopyState = {
  status: "idle" | "checking" | "confirm-overwrite" | "success" | "error";
  message: string;
};

const initialCopyState: CopyState = {
  status: "idle",
  message: "",
};

function normalizeDateRange(startDate: string, endDate: string) {
  return endDate < startDate
    ? { startDate, endDate: startDate }
    : { startDate, endDate };
}

export default function HistoryPage() {
  const [startDate, setStartDate] = useState(addDays(todayInBerlinIso(), -14));
  const [endDate, setEndDate] = useState(addDays(todayInBerlinIso(), 14));
  const [days, setDays] = useState<DayPlan[]>([]);
  const [sourceStartDate, setSourceStartDate] = useState("");
  const [sourceEndDate, setSourceEndDate] = useState("");
  const [targetStartDate, setTargetStartDate] = useState(addDays(todayInBerlinIso(), 1));
  const [targetEndDate, setTargetEndDate] = useState(addDays(todayInBerlinIso(), 5));
  const [copyState, setCopyState] = useState<CopyState>(initialCopyState);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function refreshHistory() {
    try {
      const nextDays = await listLocalPlannedDays(startDate, endDate);
      setDays(nextDays);
      setLoadError(null);
      if (!sourceStartDate && nextDays[0]) {
        setSourceStartDate(nextDays[0].date);
        setSourceEndDate(nextDays[0].date);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Die Historie konnte nicht geladen werden.");
    }
  }

  function updateStartRange(nextStartDate: string, currentEndDate: string, setStart: (value: string) => void, setEnd: (value: string) => void) {
    setStart(nextStartDate);
    if (currentEndDate < nextStartDate) {
      setEnd(nextStartDate);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialHistory() {
      try {
        const nextDays = await listLocalPlannedDays(startDate, endDate);
        if (cancelled) {
          return;
        }

        setDays(nextDays);
        setLoadError(null);
        if (nextDays[0]) {
          setSourceStartDate(nextDays[0].date);
          setSourceEndDate(nextDays[0].date);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Die Historie konnte nicht geladen werden.");
        }
      }
    }

    void loadInitialHistory();

    return () => {
      cancelled = true;
    };
  }, [endDate, startDate]);

  async function copySelection(overwrite: boolean) {
    setCopyState({ status: "checking", message: "" });

    try {
      const sourceRange = normalizeDateRange(sourceStartDate, sourceEndDate);
      const targetRange = normalizeDateRange(targetStartDate, targetEndDate);
      const overlaps = await findLocalPlanOverlaps(targetRange.startDate, targetRange.endDate);
      if (overlaps.length > 0 && !overwrite) {
        setCopyState({
          status: "confirm-overwrite",
          message: `Für ${overlaps.length} Tage im Zielzeitraum existieren bereits geplante Mahlzeiten. Wenn Du fortfährst, werden diese Tage überschrieben.`,
        });
        return;
      }

      await copyLocalPlannedDays({
        sourceStartDate: sourceRange.startDate,
        sourceEndDate: sourceRange.endDate,
        targetStartDate: targetRange.startDate,
        targetEndDate: targetRange.endDate,
        overwrite,
      });

      setCopyState({
        status: "success",
        message: "Aus der Auswahl wurde ein neuer Planzeitraum erstellt.",
      });
      await refreshHistory();
    } catch (error) {
      setCopyState({
        status: "error",
        message: error instanceof Error ? error.message : "Die Auswahl konnte nicht kopiert werden.",
      });
    }
  }

  return (
    <main className={styles.page}>
      <AppNav currentPath="/historie" />

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Historie</p>
          <h1>Geplante Tage wiederverwenden.</h1>
          <p className={styles.lead}>
            Die Historie arbeitet als Tagesliste. Wähle einen Quellzeitraum und kopiere die
            enthaltenen Rezepte in einen neuen Zielzeitraum.
          </p>
        </div>

        <aside className={styles.heroPanel}>
          <p className={styles.sectionKicker}>Aktueller Ausschnitt</p>
          <h2>{days.length} Tage</h2>
          <p>Lücken bleiben sichtbar: Es werden nur tatsächlich geplante Tage angezeigt.</p>
        </aside>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <article className={styles.formCard}>
            <p className={styles.sectionKicker}>Tagesliste</p>
            <h2>Historischen Zeitraum anzeigen</h2>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <DateStepper
                  id="historyStart"
                  label="Start"
                  onChange={(value) => updateStartRange(value, endDate, setStartDate, setEndDate)}
                  value={startDate}
                />
              </div>
              <div className={styles.inputGroup}>
                <DateStepper id="historyEnd" label="Ende" min={startDate} onChange={setEndDate} value={endDate} />
              </div>
            </div>
            <div className={styles.actionRow}>
              <button className={styles.secondaryButton} onClick={() => void refreshHistory()} type="button">
                Historie laden
              </button>
            </div>

            {loadError ? <p className={styles.formMessage}>{loadError}</p> : null}

            <ul className={styles.mealList}>
              {days.map((day) => (
                <li key={day.date}>
                  <div>
                    <span>{formatDateGerman(day.date)}</span>
                    <strong>{day.weekdayLabel}</strong>
                    <p>
                      {day.meals.map((meal) => `${formatMealType(meal.mealType)}: ${meal.recipe.name}`).join(" · ")}
                    </p>
                  </div>
                  <Link href={`/tage?date=${encodeURIComponent(day.date)}`}>öffnen</Link>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <aside className={styles.sideColumn}>
          <article className={styles.summaryCard}>
            <p className={styles.sectionKicker}>Kopieren</p>
            <h2>Aus Auswahl neuen Plan erstellen</h2>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <DateStepper
                  id="sourceStart"
                  label="Quelle Start"
                  onChange={(value) => updateStartRange(value, sourceEndDate, setSourceStartDate, setSourceEndDate)}
                  value={sourceStartDate}
                />
              </div>
              <div className={styles.inputGroup}>
                <DateStepper
                  id="sourceEnd"
                  label="Quelle Ende"
                  min={sourceStartDate}
                  onChange={setSourceEndDate}
                  value={sourceEndDate}
                />
              </div>
              <div className={styles.inputGroup}>
                <DateStepper
                  id="targetStart"
                  label="Ziel Start"
                  onChange={(value) => updateStartRange(value, targetEndDate, setTargetStartDate, setTargetEndDate)}
                  value={targetStartDate}
                />
              </div>
              <div className={styles.inputGroup}>
                <DateStepper
                  id="targetEnd"
                  label="Ziel Ende"
                  min={targetStartDate}
                  onChange={setTargetEndDate}
                  value={targetEndDate}
                />
              </div>
            </div>

            {copyState.message ? (
              <p className={copyState.status === "success" ? styles.actionFeedbackSuccess : styles.formMessage}>
                {copyState.message}
              </p>
            ) : null}

            {copyState.status === "confirm-overwrite" ? (
              <div className={styles.actionRow}>
                <button className={styles.primaryButton} onClick={() => void copySelection(true)} type="button">
                  Bestehende Tage überschreiben
                </button>
                <button className={styles.secondaryButton} onClick={() => setCopyState(initialCopyState)} type="button">
                  Abbrechen
                </button>
              </div>
            ) : (
              <div className={styles.actionRow}>
                <button className={styles.primaryButton} onClick={() => void copySelection(false)} type="button">
                  Auswahl kopieren
                </button>
              </div>
            )}
          </article>
        </aside>
      </section>
    </main>
  );
}
