"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppNav } from "@/app/app-nav";
import {
  formatCalories,
  formatDateGerman,
  formatDateRange,
  formatGrams,
  formatMealType,
  formatPercent,
} from "@/lib/format";
import type { DayPlan, WeekPlan } from "@/lib/types";
import styles from "./[date]/day.module.css";

type LocalStoreApi = {
  ensureLocalAppData?: () => Promise<unknown>;
  getCurrentLocalWeekPlan?: () => Promise<WeekPlan | null>;
  getLocalDayPlan?: (date: string) => Promise<DayPlan | null>;
};

type DayViewState = {
  selectedDay: DayPlan | null;
  weekPlan: WeekPlan | null;
};

function buildDayHref(date: string) {
  return `/tage?date=${encodeURIComponent(date)}`;
}

function buildRecipeHref(recipeId: string) {
  return `/rezepte?recipe=${encodeURIComponent(recipeId)}`;
}

function isIsoDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

async function loadDayView(date: string | null): Promise<DayViewState> {
  const api = (await import("@/lib/local-store")) as LocalStoreApi;

  if (typeof api.ensureLocalAppData === "function") {
    await api.ensureLocalAppData();
  }

  const weekPlan =
    typeof api.getCurrentLocalWeekPlan === "function" ? await api.getCurrentLocalWeekPlan() : null;

  let selectedDay: DayPlan | null = null;

  if (isIsoDate(date) && typeof api.getLocalDayPlan === "function") {
    selectedDay = await api.getLocalDayPlan(date);
  }

  if (!selectedDay && weekPlan) {
    selectedDay = weekPlan.days.find((day) => day.date === date) ?? weekPlan.days[0] ?? null;
  }

  return {
    selectedDay,
    weekPlan,
  };
}

function DayPageContent() {
  const searchParams = useSearchParams();
  const requestedDate = searchParams.get("date")?.trim() || null;

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayPlan | null>(null);
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrateDayView() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const nextState = await loadDayView(requestedDate);

        if (cancelled) {
          return;
        }

        setSelectedDay(nextState.selectedDay);
        setWeekPlan(nextState.weekPlan);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadError(
          error instanceof Error ? error.message : "Die Tagesansicht konnte nicht geladen werden.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void hydrateDayView();

    return () => {
      cancelled = true;
    };
  }, [requestedDate]);

  const availableDates = weekPlan?.days.map((day) => day.date) ?? (selectedDay ? [selectedDay.date] : []);
  const selectedDayIndex = selectedDay ? availableDates.indexOf(selectedDay.date) : -1;
  const previousDay = selectedDayIndex > 0 ? availableDates[selectedDayIndex - 1] : null;
  const nextDay =
    selectedDayIndex >= 0 && selectedDayIndex < availableDates.length - 1
      ? availableDates[selectedDayIndex + 1]
      : null;

  return (
    <main className={styles.page}>
      <AppNav currentPath="/" />

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Tagesansicht</p>
          <h1>{selectedDay ? selectedDay.weekdayLabel : "Aktuelle Wochenplanung"}</h1>
          <p className={styles.lead}>
            {selectedDay
              ? `${formatDateGerman(selectedDay.date)} mit ${selectedDay.meals.length} geplanten Mahlzeiten. Hier siehst du Tagessumme, Makroverteilung und die direkten Sprünge in deine Rezeptbibliothek.`
              : "Diese Ansicht zeigt dir einen Tag aus deinem aktuell gespeicherten Wochenplan."}
          </p>
        </div>

        <aside className={styles.heroPanel}>
          <div>
            <p className={styles.sectionKicker}>Aktiver Zeitraum</p>
            <h2>
              {weekPlan
                ? formatDateRange(weekPlan.startDate, weekPlan.endDate)
                : selectedDay
                  ? formatDateGerman(selectedDay.date)
                  : "Noch keine Woche"}
            </h2>
            <p>
              {weekPlan
                ? "Der Tageswert wird aus dem gespeicherten Wochenplan geladen."
                : "Sobald ein Wochenplan vorhanden ist, kannst du hier zwischen den Tagen springen."}
            </p>
          </div>

          {selectedDay ? (
            <span className={selectedDay.withinTolerance ? styles.badgeGood : styles.badgeWarn}>
              {selectedDay.withinTolerance
                ? "Makros im Zielkorridor"
                : "Makros außerhalb des Korridors"}
            </span>
          ) : null}

          <div className={styles.heroActions}>
            <Link href={previousDay ? buildDayHref(previousDay) : "/"}>
              Vorheriger Tag
            </Link>
            <Link href={nextDay ? buildDayHref(nextDay) : "/"}>
              Nächster Tag
            </Link>
          </div>
        </aside>
      </section>

      {isLoading ? (
        <section className={styles.contentGrid}>
          <article className={styles.sectionCard}>
            <p className={styles.sectionKicker}>App-Start</p>
            <h2>Die Tagesansicht wird vorbereitet.</h2>
            <p className={styles.weekHint}>
              Beim ersten Start kann der Gerätespeicher kurz befüllt oder auf eine neue Version
              migriert werden.
            </p>
          </article>
        </section>
      ) : null}

      {loadError ? (
        <section className={styles.contentGrid}>
          <article className={styles.sectionCard}>
            <p className={styles.sectionKicker}>Fehler</p>
            <h2>Die Tagesansicht konnte nicht geladen werden.</h2>
            <p className={styles.weekHint}>{loadError}</p>
          </article>
        </section>
      ) : null}

      {!isLoading && !loadError && !selectedDay ? (
        <section className={styles.contentGrid}>
          <article className={styles.sectionCard}>
            <p className={styles.sectionKicker}>Noch kein Tag verfügbar</p>
            <h2>Es wurde noch kein Tagesplan gefunden.</h2>
            <p className={styles.weekHint}>
              Öffne zuerst das Dashboard oder lass die App einen Wochenplan anlegen.
            </p>
          </article>
        </section>
      ) : null}

      {!isLoading && !loadError && selectedDay ? (
        <>
          <section className={styles.metricsGrid}>
            <article className={styles.metricCard}>
              <span className={styles.sectionKicker}>Kalorien</span>
              <strong>{formatCalories(selectedDay.totals.calories)}</strong>
              <p>Ziel: {formatCalories(selectedDay.targets.calories)}</p>
            </article>
            <article className={styles.metricCard}>
              <span className={styles.sectionKicker}>Protein</span>
              <strong>{formatGrams(selectedDay.totals.protein)}</strong>
              <p>Ziel: {formatGrams(selectedDay.targets.protein)}</p>
            </article>
            <article className={styles.metricCard}>
              <span className={styles.sectionKicker}>Kohlenhydrate</span>
              <strong>{formatGrams(selectedDay.totals.carbs)}</strong>
              <p>Ziel: {formatGrams(selectedDay.targets.carbs)}</p>
            </article>
            <article className={styles.metricCard}>
              <span className={styles.sectionKicker}>Fett</span>
              <strong>{formatGrams(selectedDay.totals.fat)}</strong>
              <p>Ziel: {formatGrams(selectedDay.targets.fat)}</p>
            </article>
          </section>

          {availableDates.length > 0 ? (
            <article className={`${styles.sectionCard} ${styles.weekCard}`}>
              <p className={styles.sectionKicker}>Woche im Überblick</p>
              <h2>Springe direkt zwischen den Tagen</h2>
              <p className={styles.weekHint}>
                Springe hier direkt zwischen den Tagen deiner aktuellen Woche.
              </p>
              <ul className={styles.weekStrip}>
                {availableDates.map((weekDate) => {
                  const weekDay = weekPlan?.days.find((day) => day.date === weekDate);
                  const dayLabel =
                    weekDate === selectedDay.date
                      ? selectedDay.weekdayLabel
                      : (weekDay?.weekdayLabel ?? formatDateGerman(weekDate));

                  return (
                    <li key={weekDate}>
                      <Link
                        className={weekDate === selectedDay.date ? styles.activeDay : ""}
                        href={buildDayHref(weekDate)}
                      >
                        <span>{weekDate === selectedDay.date ? "Aktiver Tag" : "Datum"}</span>
                        <strong>{dayLabel}</strong>
                        <small>{formatDateGerman(weekDate)}</small>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </article>
          ) : null}

          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              <article className={styles.sectionCard}>
                <p className={styles.sectionKicker}>Mahlzeiten</p>
                <h2>Was heute geplant ist</h2>
                <div className={styles.mealList}>
                  {selectedDay.meals.map((meal) => (
                    <article
                      className={styles.mealCard}
                      key={`${selectedDay.date}-${meal.mealType}-${meal.recipe.id}`}
                    >
                      <div className={styles.mealTop}>
                        <div>
                          <p>{formatMealType(meal.mealType)}</p>
                          <h3>{meal.recipe.name}</h3>
                        </div>
                        <span className={styles.badgeGood}>
                          Faktor {meal.portionFactor.toFixed(2).replace(".", ",")}
                        </span>
                      </div>

                      <p className={styles.mealDescription}>{meal.recipe.description}</p>

                      <div className={styles.mealMeta}>
                        <strong>{formatCalories(meal.calculated.calories)}</strong>
                        <strong>{formatGrams(meal.calculated.protein)} Protein</strong>
                        <strong>{formatGrams(meal.calculated.carbs)} KH</strong>
                        <strong>{formatGrams(meal.calculated.fat)} Fett</strong>
                      </div>

                      <div className={styles.mealLinks}>
                        <Link href={buildRecipeHref(meal.recipe.id)}>Rezept öffnen</Link>
                        <Link href="/einkaufsliste">Zur Einkaufsliste</Link>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </div>

            <aside className={styles.sideColumn}>
              <article className={styles.sectionCard}>
                <div className={styles.macroAside}>
                  <div>
                    <p className={styles.sectionKicker}>Makroquote</p>
                    <h2>Ziel gegen Ist</h2>
                    <p>
                      Die Prozentwerte zeigen den Tagesmix unabhängig von der absoluten
                      Kalorienmenge.
                    </p>
                  </div>

                  <ul className={styles.macroList}>
                    <li>
                      <div>
                        <span>Protein</span>
                        <strong>{formatPercent(selectedDay.macroPercents.protein)}</strong>
                      </div>
                      <small>Ziel: {formatPercent(selectedDay.targets.macroPercents.protein)}</small>
                    </li>
                    <li>
                      <div>
                        <span>Kohlenhydrate</span>
                        <strong>{formatPercent(selectedDay.macroPercents.carbs)}</strong>
                      </div>
                      <small>Ziel: {formatPercent(selectedDay.targets.macroPercents.carbs)}</small>
                    </li>
                    <li>
                      <div>
                        <span>Fett</span>
                        <strong>{formatPercent(selectedDay.macroPercents.fat)}</strong>
                      </div>
                      <small>Ziel: {formatPercent(selectedDay.targets.macroPercents.fat)}</small>
                    </li>
                    <li>
                      <div>
                        <span>Tages-Score</span>
                        <strong>{selectedDay.score.toFixed(1)}</strong>
                      </div>
                      <small>
                        {selectedDay.withinTolerance
                          ? "stabiler Tag"
                          : "prüfenswerte Abweichung"}
                      </small>
                    </li>
                  </ul>
                </div>
              </article>
            </aside>
          </section>
        </>
      ) : null}
    </main>
  );
}

export default function DayPage() {
  return (
    <Suspense fallback={null}>
      <DayPageContent />
    </Suspense>
  );
}
