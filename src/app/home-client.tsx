"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { regenerateCurrentWeekAction } from "@/app/actions";
import {
  describeMealPlanMode,
  formatCalories,
  formatDateGerman,
  formatDateRange,
  formatGrams,
  formatMealType,
  formatPercent,
  qualityLabel,
} from "@/lib/format";
import { loadOfflineSnapshot, saveOfflineSnapshot } from "@/lib/offline-store";
import type { UserSettings, WeekPlan } from "@/lib/types";

const HOME_SNAPSHOT_KEY = "home-snapshot-v1";

type RecipeCounts = {
  breakfast: number;
  lunch: number;
  dinner: number;
  snack: number;
};

type HomeSnapshot = {
  settings: UserSettings;
  weekPlan: WeekPlan;
  recipeCounts: RecipeCounts;
  shoppingItemCount: number;
  savedAt: string;
};

type HomeClientProps = {
  initialSnapshot: HomeSnapshot;
};

function macroBadgeClass(delta: number) {
  if (Math.abs(delta) <= 5) {
    return styles.macroGood;
  }

  if (Math.abs(delta) <= 10) {
    return styles.macroOkay;
  }

  return styles.macroOff;
}

function formatSavedAt(isoString: string) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoString));
}

export function HomeClient({ initialSnapshot }: HomeClientProps) {
  const [offlineSnapshot, setOfflineSnapshot] = useState<HomeSnapshot | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateOnlineState = () => {
      setIsOffline(!window.navigator.onLine);
    };

    updateOnlineState();
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);

    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  useEffect(() => {
    void saveOfflineSnapshot(HOME_SNAPSHOT_KEY, initialSnapshot).catch((error) => {
      console.error("Wochenplan konnte nicht offline gespeichert werden.", error);
    });
  }, [initialSnapshot]);

  useEffect(() => {
    if (!isOffline) {
      return;
    }

    void loadOfflineSnapshot<HomeSnapshot>(HOME_SNAPSHOT_KEY)
      .then((offlineSnapshot) => {
        if (offlineSnapshot) {
          setOfflineSnapshot(offlineSnapshot);
        }
      })
      .catch((error) => {
        console.error("Offline-Wochenplan konnte nicht geladen werden.", error);
      });
  }, [isOffline]);

  const snapshot = isOffline && offlineSnapshot ? offlineSnapshot : initialSnapshot;
  const { settings, weekPlan, recipeCounts, shoppingItemCount, savedAt } = snapshot;
  const bestDay = [...weekPlan.days].sort((left, right) => left.score - right.score)[0];

  return (
    <main className={styles.page}>
      <nav className={styles.topNav}>
        <Link href="/">Dashboard</Link>
        <Link href="/rezepte">Rezepte</Link>
        <Link href="/einkaufsliste">Einkaufsliste</Link>
        <Link href="/einstellungen">Einstellungen</Link>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Plan und Pfanne</p>
          <h1>Dein Wochenplan bleibt auch unterwegs griffbereit.</h1>
          <p className={styles.lead}>
            Die App speichert Wochenplan, Rezepte und Einkaufsliste lokal auf deinem Handy. Wenn
            du wieder online bist, kannst du neu synchronisieren oder die Woche frisch generieren.
          </p>
        </div>

        <div className={styles.heroPanel}>
          <p className={styles.panelLabel}>Aktive Woche</p>
          <h2>{formatDateRange(weekPlan.startDate, weekPlan.endDate)}</h2>
          <p className={styles.panelCopy}>
            {describeMealPlanMode(settings.mealsPerDay)} bei {formatCalories(settings.calorieTarget)}{" "}
            und Makroziel {settings.macroProteinPct}/{settings.macroCarbsPct}/{settings.macroFatPct}.
          </p>

          <div className={styles.heroActions}>
            <div className={styles.actionRow}>
              <form action={regenerateCurrentWeekAction}>
                <button className={styles.primaryButton} disabled={isOffline} type="submit">
                  {isOffline ? "Offline nicht verfuegbar" : "Woche neu generieren"}
                </button>
              </form>
              <Link className={styles.secondaryButton} href="/rezepte">
                Rezeptdatenbank oeffnen
              </Link>
            </div>
            <div className={styles.inlineMeta}>
              <span>{weekPlan.days.length} Tage geplant</span>
              <span>{shoppingItemCount} Einkaufspositionen</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.offlineCard}>
        <div>
          <p className={styles.sectionKicker}>Offline-Modus</p>
          <h2>{isOffline ? "Wochenplan aus dem Geraetespeicher aktiv" : "Wochenplan online synchronisiert"}</h2>
          <p className={styles.offlineCopy}>
            {isOffline
              ? "Du arbeitest gerade mit dem zuletzt gespeicherten Stand. Sobald wieder Internet da ist, kannst du die Woche aktualisieren."
              : "Der aktuelle Wochenplan wurde lokal gespeichert und steht dir auch ohne Verbindung weiter zur Verfuegung."}
          </p>
        </div>
        <div className={styles.offlineMeta}>
          <span className={isOffline ? styles.statusWarn : styles.statusGood}>
            {isOffline ? "offline aktiv" : "offline bereit"}
          </span>
          <p>Zuletzt gespeichert: {formatSavedAt(savedAt)}</p>
        </div>
      </section>

      <section className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <p>Zielkalorien</p>
          <strong>{formatCalories(settings.calorieTarget)}</strong>
          <span>pro Tag</span>
        </article>
        <article className={styles.metricCard}>
          <p>Wochenscore</p>
          <strong>{weekPlan.averageScore}</strong>
          <span>{qualityLabel(weekPlan.averageScore)}</span>
        </article>
        <article className={styles.metricCard}>
          <p>Rezeptbasis</p>
          <strong>
            {recipeCounts.breakfast + recipeCounts.lunch + recipeCounts.dinner + recipeCounts.snack}
          </strong>
          <span>aktive Mahlzeiten</span>
        </article>
        <article className={styles.metricCard}>
          <p>Staerkster Tag</p>
          <strong>{bestDay.weekdayLabel}</strong>
          <span>{qualityLabel(bestDay.score)}</span>
        </article>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <article className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionKicker}>Wochenuebersicht</p>
                <h2>Alle 7 Tage auf einen Blick</h2>
              </div>
              <p className={styles.sectionHint}>
                Jede Karte zeigt Tagessumme, Makroabweichung und die geplanten Mahlzeiten.
              </p>
            </div>

            <div className={styles.dayGrid}>
              {weekPlan.days.map((day) => {
                const proteinDelta = day.macroPercents.protein - day.targets.macroPercents.protein;
                const carbsDelta = day.macroPercents.carbs - day.targets.macroPercents.carbs;
                const fatDelta = day.macroPercents.fat - day.targets.macroPercents.fat;

                return (
                  <article className={styles.dayCard} key={day.date}>
                    <div className={styles.dayTop}>
                      <div>
                        <h3>{day.weekdayLabel}</h3>
                        <p>{formatDateGerman(day.date)}</p>
                      </div>
                      <span className={day.withinTolerance ? styles.statusGood : styles.statusWarn}>
                        {day.withinTolerance ? "im Zielkorridor" : "abweichend"}
                      </span>
                    </div>

                    <div className={styles.dayTotals}>
                      <div>
                        <span>Kalorien</span>
                        <strong>{formatCalories(day.totals.calories)}</strong>
                      </div>
                      <div>
                        <span>Protein</span>
                        <strong>{formatGrams(day.totals.protein)}</strong>
                      </div>
                      <div>
                        <span>Kohlenhydrate</span>
                        <strong>{formatGrams(day.totals.carbs)}</strong>
                      </div>
                      <div>
                        <span>Fett</span>
                        <strong>{formatGrams(day.totals.fat)}</strong>
                      </div>
                    </div>

                    <div className={styles.macroRow}>
                      <span className={`${styles.macroBadge} ${macroBadgeClass(proteinDelta)}`}>
                        P {formatPercent(day.macroPercents.protein)}
                      </span>
                      <span className={`${styles.macroBadge} ${macroBadgeClass(carbsDelta)}`}>
                        K {formatPercent(day.macroPercents.carbs)}
                      </span>
                      <span className={`${styles.macroBadge} ${macroBadgeClass(fatDelta)}`}>
                        F {formatPercent(day.macroPercents.fat)}
                      </span>
                    </div>

                    <ul className={styles.mealList}>
                      {day.meals.map((meal) => (
                        <li className={styles.mealRow} key={`${day.date}-${meal.mealType}`}>
                          <div>
                            <p>{formatMealType(meal.mealType)}</p>
                            <strong>{meal.recipe.name}</strong>
                          </div>
                          <span>x{meal.portionFactor.toFixed(2).replace(".", ",")}</span>
                        </li>
                      ))}
                    </ul>

                    <Link className={styles.textLink} href={`/tage/${day.date}`}>
                      Tagesansicht für {day.weekdayLabel} öffnen
                    </Link>
                  </article>
                );
              })}
            </div>
          </article>
        </div>

        <aside className={styles.sideColumn}>
          <article className={styles.sectionCard}>
            <p className={styles.sectionKicker}>Planungsprofil</p>
            <h2>Aktive Einstellungen</h2>
            <dl className={styles.detailList}>
              <div>
                <dt>Mahlzeiten pro Tag</dt>
                <dd>{settings.mealsPerDay}</dd>
              </div>
              <div>
                <dt>Vegetarisch</dt>
                <dd>{settings.vegetarian ? "ja" : "nein"}</dd>
              </div>
              <div>
                <dt>Fleisch reduzieren</dt>
                <dd>{settings.reduceMeat ? "ja" : "nein"}</dd>
              </div>
              <div>
                <dt>Wiederholungen pro Woche</dt>
                <dd>max. {settings.maxRecipeRepeatsPerWeek}</dd>
              </div>
              <div>
                <dt>Ausgeschlossene Zutaten</dt>
                <dd>
                  {settings.excludedIngredients.length > 0
                    ? settings.excludedIngredients.join(", ")
                    : "keine"}
                </dd>
              </div>
            </dl>
          </article>

          <article className={styles.sectionCard}>
            <p className={styles.sectionKicker}>Rezeptpool</p>
            <h2>Verfuegbare Mahlzeiten</h2>
            <ul className={styles.stackList}>
              <li>
                <span>Fruehstueck</span>
                <strong>{recipeCounts.breakfast}</strong>
              </li>
              <li>
                <span>Mittagessen</span>
                <strong>{recipeCounts.lunch}</strong>
              </li>
              <li>
                <span>Abendessen</span>
                <strong>{recipeCounts.dinner}</strong>
              </li>
              <li>
                <span>Snacks</span>
                <strong>{recipeCounts.snack}</strong>
              </li>
            </ul>
            <Link className={styles.textLink} href="/rezepte">
              Alle Rezepte mit Zutaten und Zubereitung ansehen
            </Link>
            <Link className={styles.textLink} href="/einstellungen">
              Planungsprofil anpassen
            </Link>
          </article>

          <article className={styles.sectionCard}>
            <p className={styles.sectionKicker}>Unterwegs nutzbar</p>
            <h2>Was jetzt offline geht</h2>
            <ul className={styles.todoList}>
              <li>Wochenplan mit Tageskarten und Mahlzeiten</li>
              <li>Rezeptbibliothek mit Zutaten und Zubereitung</li>
              <li>Einkaufsliste mit lokalem Abhaken</li>
              <li>Neue Synchronisierung, sobald wieder Internet da ist</li>
            </ul>
          </article>
        </aside>
      </section>
    </main>
  );
}
