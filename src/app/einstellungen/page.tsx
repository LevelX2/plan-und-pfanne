"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./settings.module.css";
import { RegenerateWeekForm } from "@/app/regenerate-week-form";
import { SettingsForm } from "./settings-form";
import { formatCalories, formatGrams } from "@/lib/format";
import {
  ensureLocalAppData,
  getCurrentLocalWeekPlan,
  getLocalAppMeta,
  getLocalRecipeMixPoolStats,
  getLocalSettings,
  listLocalHistoryEntries,
} from "@/lib/local-store";
import type { UserSettings, WeekPlan } from "@/lib/types";

type RecipeMixPoolStats = Awaited<ReturnType<typeof getLocalRecipeMixPoolStats>>;
type LocalHistoryEntry = Awaited<ReturnType<typeof listLocalHistoryEntries>>[number];
type LocalAppMeta = Awaited<ReturnType<typeof getLocalAppMeta>>;

type SettingsPageData = {
  settings: UserSettings;
  recipeMixPool: RecipeMixPoolStats;
  currentWeekPlan: WeekPlan;
  recentHistory: LocalHistoryEntry[];
  appMeta: LocalAppMeta;
  loadedAt: string;
};

function macroTargets(calorieTarget: number, proteinPct: number, carbsPct: number, fatPct: number) {
  return {
    protein: Number(((calorieTarget * proteinPct) / 100 / 4).toFixed(1)),
    carbs: Number(((calorieTarget * carbsPct) / 100 / 4).toFixed(1)),
    fat: Number(((calorieTarget * fatPct) / 100 / 9).toFixed(1)),
  };
}

function formatSavedAt(isoString: string) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoString));
}

async function loadSettingsPageData() {
  await ensureLocalAppData();

  const [settings, recipeMixPool, currentWeekPlan, recentHistory, appMeta] = await Promise.all([
    getLocalSettings(),
    getLocalRecipeMixPoolStats(),
    getCurrentLocalWeekPlan(),
    listLocalHistoryEntries(3),
    getLocalAppMeta(),
  ]);

  return {
    settings,
    recipeMixPool,
    currentWeekPlan,
    recentHistory,
    appMeta,
    loadedAt: new Date().toISOString(),
  } satisfies SettingsPageData;
}

function LocalNav() {
  return (
    <nav className={styles.topNav}>
      <Link href="/">Dashboard</Link>
      <Link href="/rezepte">Rezepte</Link>
      <Link href="/einkaufsliste">Einkaufsliste</Link>
      <Link aria-current="page" href="/einstellungen">
        Einstellungen
      </Link>
    </nav>
  );
}

export default function SettingsPage() {
  const [pageData, setPageData] = useState<SettingsPageData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusBadge, setStatusBadge] = useState<string | null>(null);

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

        setLoadError(
          error instanceof Error
            ? error.message
            : "Die lokalen Einstellungen konnten nicht geladen werden.",
        );
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

  async function refreshPageData(nextStatusBadge?: string) {
    const nextPageData = await loadSettingsPageData();
    setPageData(nextPageData);
    setLoadError(null);
    if (nextStatusBadge) {
      setStatusBadge(nextStatusBadge);
    }
  }

  if (isLoading && !pageData) {
    return (
      <main className={styles.page}>
        <LocalNav />

        <section className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Planungsprofil</p>
            <h1>Deine lokalen Einstellungen werden geladen.</h1>
            <p className={styles.lead}>
              Kalorienziel, Makros, Zielmix und Ausschlüsse kommen direkt aus dem Gerätespeicher.
            </p>
          </div>

          <aside className={styles.heroPanel}>
            <div>
              <p className={styles.sectionKicker}>Lokale PWA</p>
              <h2>Bereite Planungsprofil vor</h2>
              <p>Die App initialisiert dein lokales Profil und die aktuelle Woche ohne Login.</p>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  if (!pageData) {
    return (
      <main className={styles.page}>
        <LocalNav />

        <section className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Planungsprofil</p>
            <h1>Die lokalen Einstellungen konnten nicht geladen werden.</h1>
            <p className={styles.lead}>
              {loadError ?? "Bitte prüfe den lokalen Store oder initialisiere die App-Daten erneut."}
            </p>
          </div>

          <aside className={styles.heroPanel}>
            <div>
              <p className={styles.sectionKicker}>Status</p>
              <h2>Lokaler Start fehlgeschlagen</h2>
              <p>Ohne lokale Daten kann das Planungsprofil auf diesem Gerät nicht verwendet werden.</p>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  const { settings, recipeMixPool, currentWeekPlan, recentHistory, appMeta, loadedAt } = pageData;
  const targets = macroTargets(
    settings.calorieTarget,
    settings.macroProteinPct,
    settings.macroCarbsPct,
    settings.macroFatPct,
  );
  const latestHistory = recentHistory[0] ?? null;
  const settingsKey = JSON.stringify(settings);

  return (
    <main className={styles.page}>
      <LocalNav />

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Planungsprofil</p>
          <h1>Dein Wochenplan soll lokal zu deinem Alltag passen.</h1>
          <p className={styles.lead}>
            Hier steuerst du Kalorienziel, Makroverteilung, Mahlzeitenrhythmus, Zielmix für Mittag
            und Abend sowie Ausschlüsse. Beim Speichern wird die aktuelle Woche direkt auf diesem
            Gerät mit den neuen Vorgaben neu erzeugt.
          </p>
        </div>

        <aside className={styles.heroPanel}>
          <div>
            <p className={styles.sectionKicker}>Aktiver Rahmen</p>
            <h2>{formatCalories(settings.calorieTarget)} pro Tag</h2>
            <p>
              Glutenfrei bleibt fest gesetzt. Der Zielmix wirkt lokal als weiche Verteilung für
              Mittagessen und Abendessen im Wochenplan.
            </p>
          </div>

          {statusBadge ? <span className={styles.statusBadge}>{statusBadge}</span> : null}

          <ul className={styles.macroPreview}>
            <li>
              <div>
                <span>Protein</span>
                <strong>{settings.macroProteinPct} %</strong>
              </div>
              <small>{formatGrams(targets.protein)}</small>
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
              Makroverteilung und Zielmix müssen jeweils zusammen 100 % ergeben. Ausgeschlossene
              Zutaten trennst du mit Kommas. Nach dem Speichern wird die aktuelle Woche lokal neu
              geplant.
            </p>

            <SettingsForm
              key={settingsKey}
              onSaved={async (message) => {
                await refreshPageData(message);
              }}
              settings={settings}
            />
          </article>
        </div>

        <aside className={styles.sideColumn}>
          <article className={styles.summaryCard}>
            <p className={styles.sectionKicker}>Aktive Regeln</p>
            <h2>Was der lokale Planer gerade beachtet</h2>
            <dl className={styles.summaryList}>
              <div>
                <dt>Glutenfrei</dt>
                <dd>immer aktiv</dd>
              </div>
              <div>
                <dt>Mahlzeitenfenster</dt>
                <dd>{settings.mealsPerDay === 4 ? "4 mit Snack" : "3 ohne Snack"}</dd>
              </div>
              <div>
                <dt>Zielmix</dt>
                <dd>
                  {settings.vegetarianSharePct} % vegetarisch, {settings.fishSharePct} % Fisch,{" "}
                  {settings.meatSharePct} % Fleisch
                </dd>
              </div>
              <div>
                <dt>Zutaten ausschließen</dt>
                <dd>
                  {settings.excludedIngredients.length > 0
                    ? settings.excludedIngredients.join(", ")
                    : "keine"}
                </dd>
              </div>
            </dl>
          </article>

          <article className={styles.statusCard}>
            <p className={styles.sectionKicker}>Sofortaktion</p>
            <h2>Diese Woche lokal neu berechnen</h2>
            <p>
              Wenn du nur einen frischen Wochenvorschlag möchtest, kannst du die aktuelle Woche
              hier auch ohne Netz direkt auf dem Gerät neu erzeugen.
            </p>
            <RegenerateWeekForm
              buttonClassName={styles.secondaryButton}
              errorMessageClassName={styles.actionFeedbackError}
              idleLabel="Woche lokal neu generieren"
              layoutClassName={styles.actionStack}
              onSuccess={async () => {
                await refreshPageData("Woche lokal neu generiert");
              }}
              pendingLabel="Wird lokal neu geplant ..."
              successMessageClassName={styles.actionFeedbackSuccess}
            />
          </article>

          <article className={styles.infoCard}>
            <p className={styles.sectionKicker}>Lokaler Status</p>
            <h2>Was zuletzt auf diesem Gerät passiert ist</h2>
            <ul className={styles.mealList}>
              <li>
                <div>
                  <span>Aktuelle Woche</span>
                  <strong>{formatSavedAt(currentWeekPlan.generatedAt)}</strong>
                </div>
              </li>
              <li>
                <div>
                  <span>Letzte Seed-Synchronisierung</span>
                  <strong>{appMeta?.lastSeedSyncAt ? formatSavedAt(appMeta.lastSeedSyncAt) : "noch offen"}</strong>
                </div>
              </li>
              <li>
                <div>
                  <span>Letzte App-Öffnung</span>
                  <strong>{appMeta?.lastOpenedAt ? formatSavedAt(appMeta.lastOpenedAt) : formatSavedAt(loadedAt)}</strong>
                </div>
              </li>
              <li>
                <div>
                  <span>Verlaufseinträge lokal</span>
                  <strong>{recentHistory.length}</strong>
                </div>
              </li>
            </ul>
            {latestHistory ? (
              <p className={styles.hint}>
                Zuletzt gespeichert: {formatSavedAt(latestHistory.savedAt)} als {latestHistory.generatedBy}.
              </p>
            ) : null}
          </article>

          <article className={styles.infoCard}>
            <p className={styles.sectionKicker}>Auswirkung</p>
            <h2>Welche Bereiche sich lokal mit ändern</h2>
            <ul className={styles.mealList}>
              <li>
                <div>
                  <span>Dashboard</span>
                  <strong>Neue Tageskarten und neue Makroabweichungen</strong>
                </div>
              </li>
              <li>
                <div>
                  <span>Tagesseiten</span>
                  <strong>Aktualisierte Mahlzeiten pro Datum</strong>
                </div>
              </li>
              <li>
                <div>
                  <span>Einkaufsliste</span>
                  <strong>Frisch abgeleitete Zutaten für die aktuelle Woche</strong>
                </div>
              </li>
              <li>
                <div>
                  <span>Rezeptpool für den Mix</span>
                  <strong>
                    {recipeMixPool.counts.vegetarian} vegetarisch, {recipeMixPool.counts.fish} Fisch,{" "}
                    {recipeMixPool.counts.meat} Fleisch
                  </strong>
                </div>
              </li>
            </ul>
          </article>

          {loadError ? (
            <article className={styles.statusCard}>
              <p className={styles.sectionKicker}>Hinweis</p>
              <h2>Letzter Ladehinweis</h2>
              <p>{loadError}</p>
            </article>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
