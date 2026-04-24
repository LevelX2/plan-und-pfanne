"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/app/app-nav";
import { DateStepper } from "@/app/date-stepper";
import { SettingsForm } from "./settings-form";
import { addDays, todayInBerlinIso } from "@/lib/date";
import { deleteLocalPlansOlderThan, getLocalRecipeMixPoolStats, getLocalSettings, listLocalHistoryEntries } from "@/lib/local-store";
import { formatCalories, formatGrams } from "@/lib/format";
import { calculateTargets } from "@/lib/planner";
import { activeProteinTargets } from "@/lib/protein-targets";
import type { UserSettings } from "@/lib/types";
import styles from "./settings.module.css";

type SettingsPageData = {
  settings: UserSettings;
  historyCount: number;
  recipeMixPool: Awaited<ReturnType<typeof getLocalRecipeMixPoolStats>>;
};

async function loadSettingsPageData(): Promise<SettingsPageData> {
  const [settings, recipeMixPool, history] = await Promise.all([
    getLocalSettings(),
    getLocalRecipeMixPoolStats(),
    listLocalHistoryEntries(),
  ]);

  return {
    settings,
    recipeMixPool,
    historyCount: history.length,
  };
}

export default function SettingsPage() {
  const [pageData, setPageData] = useState<SettingsPageData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusBadge, setStatusBadge] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState("3m");
  const [customDeleteDate, setCustomDeleteDate] = useState(addDays(todayInBerlinIso(), -90));

  async function refreshPageData(nextStatusBadge?: string) {
    const nextPageData = await loadSettingsPageData();
    setPageData(nextPageData);
    setLoadError(null);
    if (nextStatusBadge) {
      setStatusBadge(nextStatusBadge);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void loadSettingsPageData()
      .then((nextPageData) => {
        if (cancelled) {
          return;
        }

        setPageData(nextPageData);
        setLoadError(null);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "Die Einstellungen konnten nicht geladen werden.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function cutoffDateForDeleteMode() {
    switch (deleteMode) {
      case "1m":
        return addDays(todayInBerlinIso(), -31);
      case "3m":
        return addDays(todayInBerlinIso(), -92);
      case "6m":
        return addDays(todayInBerlinIso(), -184);
      case "custom":
        return customDeleteDate;
      default:
        return addDays(todayInBerlinIso(), -92);
    }
  }

  async function deleteOldPlans() {
    const cutoffDate = cutoffDateForDeleteMode();
    const confirmed = window.confirm(
      `Alte Pläne vor dem ${cutoffDate} löschen? Diese geplanten Tage und Mahlzeiten werden dauerhaft entfernt.`,
    );

    if (!confirmed) {
      return;
    }

    const deletedCount = await deleteLocalPlansOlderThan({ olderThanDate: cutoffDate });
    await refreshPageData(`${deletedCount} alte Tage gelöscht`);
  }

  if (isLoading && !pageData) {
    return (
      <main className={styles.page}>
        <AppNav currentPath="/einstellungen" />
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Einstellungen</p>
            <h1>Deine Einstellungen werden geladen.</h1>
          </div>
        </section>
      </main>
    );
  }

  if (!pageData) {
    return (
      <main className={styles.page}>
        <AppNav currentPath="/einstellungen" />
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Einstellungen</p>
            <h1>Die Einstellungen konnten nicht geladen werden.</h1>
            <p className={styles.lead}>{loadError}</p>
          </div>
        </section>
      </main>
    );
  }

  const { settings, recipeMixPool, historyCount } = pageData;
  const targets = calculateTargets(settings);
  const proteinTargetCount = activeProteinTargets(settings).length;

  return (
    <main className={styles.page}>
      <AppNav currentPath="/einstellungen" />

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Einstellungen</p>
          <h1>Dein Tageskonzept steuern.</h1>
          <p className={styles.lead}>
            Standard-Personenzahl, Kalorien, Makros und Planungsregeln gelten für neue
            Generierungen. Bestehende Tagespläne bleiben erhalten, bis Du sie bearbeitest oder löschst.
          </p>
        </div>

        <aside className={styles.heroPanel}>
          <div>
            <p className={styles.sectionKicker}>Aktives Ziel</p>
            <h2>{formatCalories(settings.calorieTarget)} pro Tag</h2>
            <p>{settings.defaultPeopleCount} Personen als Standard für neue Planzeiträume.</p>
            <p className={styles.proteinTargetSummary}>
              Eiweißziel: {formatGrams(targets.protein)} pro Person aus {proteinTargetCount} hinterlegten{" "}
              {proteinTargetCount === 1 ? "Körperwert" : "Körperwerten"}.
            </p>
          </div>
          {statusBadge ? <span className={styles.statusBadge}>{statusBadge}</span> : null}
          <ul className={styles.macroPreview}>
            <li>
              <div>
                <span>Eiweiß Ø</span>
                <strong>{settings.macroProteinPct} %</strong>
              </div>
              <small>{formatGrams(targets.protein)} p. P.</small>
            </li>
            <li>
              <div>
                <span>Kohlenhydrate</span>
                <strong>{settings.macroCarbsPct} %</strong>
              </div>
              <small>{formatGrams(targets.carbs)}</small>
            </li>
            <li>
              <div>
                <span>Fett</span>
                <strong>{settings.macroFatPct} %</strong>
              </div>
              <small>{formatGrams(targets.fat)}</small>
            </li>
          </ul>
        </aside>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <article className={styles.formCard}>
            <p className={styles.sectionKicker}>Formular</p>
            <h2>Planungswerte anpassen</h2>
            <p className={styles.hint}>
              Das Speichern verändert künftige Generierungen. Personenzahlen einzelner Mahlzeiten
              bearbeitest Du im Tagesdetail.
            </p>
            <SettingsForm
              key={JSON.stringify(settings)}
              onSaved={async (message) => {
                await refreshPageData(message);
              }}
              settings={settings}
            />
          </article>
        </div>

        <aside className={styles.sideColumn}>
          <article className={styles.summaryCard}>
            <p className={styles.sectionKicker}>Datenpflege</p>
            <h2>Alte Pläne löschen</h2>
            <div className={styles.formGrid}>
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label htmlFor="deleteMode">Löschregel</label>
                <select id="deleteMode" onChange={(event) => setDeleteMode(event.currentTarget.value)} value={deleteMode}>
                  <option value="1m">älter als 1 Monat</option>
                  <option value="3m">älter als 3 Monate</option>
                  <option value="6m">älter als 6 Monate</option>
                  <option value="custom">älter als bestimmtes Datum</option>
                </select>
              </div>
              {deleteMode === "custom" ? (
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <DateStepper
                    id="customDeleteDate"
                    label="Stichtag"
                    onChange={setCustomDeleteDate}
                    value={customDeleteDate}
                  />
                </div>
              ) : null}
            </div>
            <div className={styles.actionRow}>
              <button className={styles.secondaryButton} onClick={() => void deleteOldPlans()} type="button">
                Alte Pläne löschen
              </button>
            </div>
          </article>

          <article className={styles.infoCard}>
            <p className={styles.sectionKicker}>Status</p>
            <h2>Lokaler Bestand</h2>
            <ul className={styles.mealList}>
              <li>
                <div>
                  <span>Geplante Tage</span>
                  <strong>{historyCount}</strong>
                </div>
              </li>
              <li>
                <div>
                  <span>Mix-gesteuerte Rezepte</span>
                  <strong>{recipeMixPool.total}</strong>
                </div>
              </li>
              <li>
                <div>
                  <span>Verteilung</span>
                  <strong>
                    {recipeMixPool.counts.vegetarian} vegetarisch, {recipeMixPool.counts.fish} Fisch,{" "}
                    {recipeMixPool.counts.meat} Fleisch
                  </strong>
                </div>
              </li>
            </ul>
          </article>
        </aside>
      </section>
    </main>
  );
}
