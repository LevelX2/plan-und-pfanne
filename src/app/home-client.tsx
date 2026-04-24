"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/app/app-nav";
import {
  formatCalories,
  formatDateGerman,
  formatDateRange,
  formatGrams,
  formatMealType,
  formatPercent,
  qualityLabel,
} from "@/lib/format";
import {
  getDefaultPlanEndDate,
  getDefaultPlanStartDate,
  getLocalSettings,
  listLocalPlannedDays,
} from "@/lib/local-store";
import { buildShoppingListGroupsForPlannedDays, countShoppingItems } from "@/lib/week-plan-selection";
import type { DayPlan, UserSettings } from "@/lib/types";
import styles from "./page.module.css";

type HomeState = {
  days: DayPlan[];
  settings: UserSettings;
  loadedAt: string;
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

async function loadHomeState(): Promise<HomeState> {
  const [settings, days] = await Promise.all([getLocalSettings(), listLocalPlannedDays()]);

  return {
    settings,
    days,
    loadedAt: new Date().toISOString(),
  };
}

export function HomeClient() {
  const [state, setState] = useState<HomeState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void loadHomeState()
      .then((nextState) => {
        if (cancelled) {
          return;
        }

        setState(nextState);
        setLoadError(null);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "Der aktuelle Plan konnte nicht geladen werden.");
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

  const sortedDays = useMemo(
    () => [...(state?.days ?? [])].sort((left, right) => left.date.localeCompare(right.date)),
    [state?.days],
  );
  const firstDay = sortedDays[0] ?? null;
  const lastDay = sortedDays.at(-1) ?? null;
  const plannedMeals = sortedDays.flatMap((day) => day.meals);
  const enabledMeals = plannedMeals.filter((meal) => meal.isEnabled !== false);
  const shoppingItemCount = countShoppingItems(buildShoppingListGroupsForPlannedDays(sortedDays));
  const bestDay = [...sortedDays].sort((left, right) => left.score - right.score)[0] ?? null;
  const defaultStartDate = getDefaultPlanStartDate();
  const defaultEndDate = getDefaultPlanEndDate();

  return (
    <main className={styles.page}>
      <AppNav currentPath="/" />

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Plan und Pfanne</p>
          <h1>Dein Ernährungsplan auf Tagesbasis.</h1>
          <p className={styles.lead}>
            Plane frei nach Datum, passe einzelne Mahlzeiten an und springe direkt aus dem Tag in
            die Kochansicht mit passenden Zutatenmengen.
          </p>
        </div>

        <div className={styles.heroPanel}>
          <p className={styles.panelLabel}>Aktueller Planzeitraum</p>
          <h2>
            {firstDay && lastDay
              ? formatDateRange(firstDay.date, lastDay.date)
              : `${formatDateGerman(defaultStartDate)} bis ${formatDateGerman(defaultEndDate)}`}
          </h2>
          <p className={styles.panelCopy}>
            {state
              ? `${state.settings.defaultPeopleCount} Personen als Standard, Makroziel ${state.settings.macroCarbsPct}/${state.settings.macroFatPct}/${state.settings.macroProteinPct}.`
              : "Der lokale Plan wird aus dem Gerätespeicher geladen."}
          </p>
          <div className={styles.heroActions}>
            <div className={styles.actionRow}>
              <Link className={styles.primaryButton} href="/planen">
                Planzeitraum generieren
              </Link>
              <Link className={styles.secondaryButton} href="/einkaufsliste">
                Einkaufsliste öffnen
              </Link>
            </div>
            <div className={styles.inlineMeta}>
              <span>{sortedDays.length} Tage geplant</span>
              <span>{enabledMeals.length} aktive Mahlzeiten</span>
              <span>{shoppingItemCount} Einkaufspositionen</span>
            </div>
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className={styles.offlineCard}>
          <div>
            <p className={styles.sectionKicker}>App-Start</p>
            <h2>Der Tagesplan wird geladen.</h2>
            <p className={styles.offlineCopy}>Die App liest geplante Tage, Einstellungen und Rezepte aus IndexedDB.</p>
          </div>
        </section>
      ) : null}

      {loadError ? (
        <section className={styles.offlineCard}>
          <div>
            <p className={styles.sectionKicker}>Fehler</p>
            <h2>Der aktuelle Plan konnte nicht geladen werden.</h2>
            <p className={styles.offlineCopy}>{loadError}</p>
          </div>
        </section>
      ) : null}

      {!isLoading && !loadError && sortedDays.length === 0 ? (
        <section className={styles.offlineCard}>
          <div>
            <p className={styles.sectionKicker}>Noch kein Plan</p>
            <h2>Starte mit einem frei gewählten Zeitraum.</h2>
            <p className={styles.offlineCopy}>
              Es wird nichts automatisch erzeugt. Der Generator ist mit morgen bis einige Tage
              später vorbelegt und warnt dich, bevor bestehende Tage überschrieben werden.
            </p>
          </div>
          <div className={styles.offlineMeta}>
            <Link className={styles.primaryButton} href="/planen">
              Jetzt Plan erstellen
            </Link>
          </div>
        </section>
      ) : null}

      {state && sortedDays.length > 0 ? (
        <>
          <section className={styles.metricsGrid}>
            <article className={styles.metricCard}>
              <p>Geplante Tage</p>
              <strong>{sortedDays.length}</strong>
              <span>ein Plan pro Datum</span>
            </article>
            <article className={styles.metricCard}>
              <p>Aktive Mahlzeiten</p>
              <strong>{enabledMeals.length}</strong>
              <span>deaktivierte Mahlzeiten fallen aus</span>
            </article>
            <article className={styles.metricCard}>
              <p>Einkaufsliste</p>
              <strong>{shoppingItemCount}</strong>
              <span>Positionen im Zeitraum</span>
            </article>
            <article className={styles.metricCard}>
              <p>Stärkster Tag</p>
              <strong>{bestDay?.weekdayLabel ?? "offen"}</strong>
              <span>{bestDay ? qualityLabel(bestDay.score) : "noch kein Wert"}</span>
            </article>
          </section>

          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              <article className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.sectionKicker}>Tagesliste</p>
                    <h2>Geplante Tage</h2>
                  </div>
                  <p className={styles.sectionHint}>
                    Öffne einen Tag, um Mahlzeiten zu tauschen, Personenzahlen zu ändern oder direkt
                    zur Kochansicht zu springen.
                  </p>
                </div>

                <div className={styles.dayGrid}>
                  {sortedDays.map((day) => {
                    const proteinDelta = day.macroPercents.protein - day.targets.macroPercents.protein;
                    const carbsDelta = day.macroPercents.carbs - day.targets.macroPercents.carbs;
                    const fatDelta = day.macroPercents.fat - day.targets.macroPercents.fat;
                    const dayEnabledMeals = day.meals.filter((meal) => meal.isEnabled !== false);

                    return (
                      <article className={styles.dayCard} key={day.date}>
                        <div className={styles.dayTop}>
                          <div>
                            <h3>{day.weekdayLabel}</h3>
                            <p>{formatDateGerman(day.date)}</p>
                          </div>
                          <div className={styles.dayStatusGroup}>
                            <span className={day.withinTolerance ? styles.statusGood : styles.statusWarn}>
                              {day.withinTolerance ? "Makros im Zielbereich" : "Makros abweichend"}
                            </span>
                            <span className={styles.statusCount}>
                              {dayEnabledMeals.length} von {day.meals.length} aktiv
                            </span>
                          </div>
                        </div>

                        <div className={styles.dayTotals}>
                          <div className={styles.dayTotalCard}>
                            <span>Kalorien</span>
                            <strong>{formatCalories(day.totals.calories)}</strong>
                          </div>
                          <div className={styles.dayTotalCard}>
                            <span>Protein</span>
                            <strong>{formatGrams(day.totals.protein)}</strong>
                          </div>
                          <div className={styles.dayTotalCard}>
                            <span>Kohlenhydrate</span>
                            <strong>{formatGrams(day.totals.carbs)}</strong>
                          </div>
                          <div className={styles.dayTotalCard}>
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
                            <li className={styles.mealRow} key={meal.id ?? `${day.date}-${meal.mealType}`}>
                              <div className={styles.mealInfo}>
                                <p>{formatMealType(meal.mealType)}</p>
                                <strong>{meal.isEnabled === false ? "fällt aus" : meal.recipe.name}</strong>
                              </div>
                              <div className={styles.mealActions}>
                                <span>{meal.peopleCount ?? state.settings.defaultPeopleCount} Pers.</span>
                                {meal.includeInShoppingList === false ? (
                                  <span className={styles.statusIdle}>nicht einkaufen</span>
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ul>

                        <Link className={styles.textLink} href={`/tage?date=${encodeURIComponent(day.date)}`}>
                          Tag bearbeiten
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
                <h2>Aktive Zielwerte</h2>
                <dl className={styles.detailList}>
                  <div>
                    <dt>Personen</dt>
                    <dd>{state.settings.defaultPeopleCount}</dd>
                  </div>
                  <div>
                    <dt>Makroverteilung</dt>
                    <dd>
                      {state.settings.macroCarbsPct} % Kohlenhydrate, {state.settings.macroFatPct} % Fett,{" "}
                      {state.settings.macroProteinPct} % Eiweiß
                    </dd>
                  </div>
                  <div>
                    <dt>Snacks</dt>
                    <dd>{state.settings.includeSnackByDefault ? "automatisch einplanen" : "nur manuell"}</dd>
                  </div>
                  <div>
                    <dt>Geladen</dt>
                    <dd>{formatSavedAt(state.loadedAt)}</dd>
                  </div>
                </dl>
              </article>
            </aside>
          </section>
        </>
      ) : null}
    </main>
  );
}
