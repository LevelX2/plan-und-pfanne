"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AppNav } from "@/app/app-nav";
import {
  addLocalSnackToDay,
  deleteLocalPlannedMeal,
  getLocalPlannedDay,
  listLocalPlannedDays,
  listLocalRecipeMealTypePreferences,
  replaceLocalPlannedMealRecipe,
  updateLocalPlannedMeal,
} from "@/lib/local-store";
import {
  formatCalories,
  formatDateGerman,
  formatGrams,
  formatMealType,
  formatPercent,
} from "@/lib/format";
import type { DayPlan, EffectiveRecipeMealTypePreference, MealType } from "@/lib/types";
import styles from "./[date]/day.module.css";

type DayViewState = {
  selectedDay: DayPlan | null;
  days: DayPlan[];
  preferences: EffectiveRecipeMealTypePreference[];
};

function buildDayHref(date: string) {
  return `/tage?date=${encodeURIComponent(date)}`;
}

function buildCookHref(mealId: string) {
  return `/kochen?meal=${encodeURIComponent(mealId)}`;
}

function isIsoDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

async function loadDayView(requestedDate: string | null): Promise<DayViewState> {
  const [days, preferences] = await Promise.all([
    listLocalPlannedDays(),
    listLocalRecipeMealTypePreferences(),
  ]);
  const sortedDays = [...days].sort((left, right) => left.date.localeCompare(right.date));
  const selectedDay =
    (isIsoDate(requestedDate) ? await getLocalPlannedDay(requestedDate) : null) ??
    sortedDays[0] ??
    null;

  return {
    selectedDay,
    days: sortedDays,
    preferences,
  };
}

function allowedRecipesForMealType(
  preferences: EffectiveRecipeMealTypePreference[],
  mealType: MealType,
) {
  return preferences
    .filter((preference) => preference.mealType === mealType && preference.enabledForPlanning)
    .map((preference) => preference.recipe)
    .sort((left, right) => left.name.localeCompare(right.name, "de-DE"));
}

function DayPageContent() {
  const searchParams = useSearchParams();
  const requestedDate = searchParams.get("date")?.trim() || null;

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [state, setState] = useState<DayViewState>({
    selectedDay: null,
    days: [],
    preferences: [],
  });
  const [snackRecipeId, setSnackRecipeId] = useState("");
  const selectedDay = state.selectedDay;
  const availableDates = state.days.map((day) => day.date);
  const selectedDayIndex = selectedDay ? availableDates.indexOf(selectedDay.date) : -1;
  const previousDay = selectedDayIndex > 0 ? availableDates[selectedDayIndex - 1] : null;
  const nextDay =
    selectedDayIndex >= 0 && selectedDayIndex < availableDates.length - 1
      ? availableDates[selectedDayIndex + 1]
      : null;
  const snackRecipes = useMemo(
    () => allowedRecipesForMealType(state.preferences, "snack"),
    [state.preferences],
  );

  async function refresh(targetDate = requestedDate) {
    const nextState = await loadDayView(targetDate);
    setState(nextState);
    setSnackRecipeId(nextState.preferences.find((entry) => entry.mealType === "snack" && entry.enabledForPlanning)?.recipe.id ?? "");
  }

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

        setState(nextState);
        setSnackRecipeId(nextState.preferences.find((entry) => entry.mealType === "snack" && entry.enabledForPlanning)?.recipe.id ?? "");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "Die Tagesansicht konnte nicht geladen werden.");
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

  async function changeMealRecipe(mealId: string, recipeId: string) {
    await replaceLocalPlannedMealRecipe(mealId, recipeId);
    await refresh(selectedDay?.date ?? requestedDate);
  }

  async function changeMealPatch(
    mealId: string,
    patch: Parameters<typeof updateLocalPlannedMeal>[1],
  ) {
    await updateLocalPlannedMeal(mealId, patch);
    await refresh(selectedDay?.date ?? requestedDate);
  }

  async function addSnack() {
    if (!selectedDay) {
      return;
    }

    await addLocalSnackToDay(selectedDay.date, snackRecipeId || undefined);
    await refresh(selectedDay.date);
  }

  async function removeSnack(mealId: string) {
    await deleteLocalPlannedMeal(mealId);
    await refresh(selectedDay?.date ?? requestedDate);
  }

  return (
    <main className={styles.page}>
      <AppNav currentPath="/tage" />

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Tagesdetail</p>
          <h1>{selectedDay ? selectedDay.weekdayLabel : "Kein Tag gewählt"}</h1>
          <p className={styles.lead}>
            {selectedDay
              ? `${formatDateGerman(selectedDay.date)} mit ${selectedDay.meals.length} geplanten Mahlzeiten. Änderungen am Tag schreiben dauerhaft zurück in Planung und Einkaufsliste.`
              : "Wähle einen geplanten Tag oder erstelle zuerst einen Ernährungsplan."}
          </p>
        </div>

        <aside className={styles.heroPanel}>
          <div>
            <p className={styles.sectionKicker}>Navigation</p>
            <h2>{availableDates.length > 0 ? `${availableDates.length} Tage verfügbar` : "Noch kein Plan"}</h2>
            <p>
              Jeder Tag ist ein eigener Datensatz. Zwischen den Tagen springst Du frei nach Datum.
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link href={previousDay ? buildDayHref(previousDay) : "/"}>Vorheriger Tag</Link>
            <Link href={nextDay ? buildDayHref(nextDay) : "/"}>Nächster Tag</Link>
          </div>
        </aside>
      </section>

      {isLoading ? (
        <section className={styles.contentGrid}>
          <article className={styles.sectionCard}>
            <p className={styles.sectionKicker}>App-Start</p>
            <h2>Die Tagesansicht wird vorbereitet.</h2>
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
            <p className={styles.sectionKicker}>Noch kein Tag</p>
            <h2>Es gibt noch keine Tagesplanung.</h2>
            <p className={styles.weekHint}>Erzeuge zuerst einen Zeitraum im Generator.</p>
            <div className={styles.heroActions}>
              <Link href="/planen">Plan generieren</Link>
            </div>
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
              <p>{formatPercent(selectedDay.macroPercents.carbs)}</p>
            </article>
            <article className={styles.metricCard}>
              <span className={styles.sectionKicker}>Fett</span>
              <strong>{formatGrams(selectedDay.totals.fat)}</strong>
              <p>{formatPercent(selectedDay.macroPercents.fat)}</p>
            </article>
          </section>

          {availableDates.length > 0 ? (
            <article className={`${styles.sectionCard} ${styles.weekCard}`}>
              <p className={styles.sectionKicker}>Datumsbereich</p>
              <h2>Direkt zu einem geplanten Tag</h2>
              <ul className={styles.weekStrip}>
                {availableDates.map((date) => {
                  const day = state.days.find((entry) => entry.date === date);

                  return (
                    <li key={date}>
                      <Link className={date === selectedDay.date ? styles.activeDay : ""} href={buildDayHref(date)}>
                        <span>{date === selectedDay.date ? "Ausgewählter Tag" : "Geplanter Tag"}</span>
                        <strong>{day?.weekdayLabel ?? formatDateGerman(date)}</strong>
                        <small>{formatDateGerman(date)}</small>
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
                <h2>Mahlzeiten bearbeiten</h2>
                <div className={styles.mealList}>
                  {selectedDay.meals.map((meal) => {
                    const allowedRecipes = allowedRecipesForMealType(state.preferences, meal.mealType);
                    const recipeOptions = allowedRecipes.some((recipe) => recipe.id === meal.recipe.id)
                      ? allowedRecipes
                      : [meal.recipe, ...allowedRecipes];
                    const canCook = typeof meal.id === "string" && meal.isEnabled !== false;

                    return (
                      <article className={styles.mealCard} key={meal.id ?? `${selectedDay.date}-${meal.mealType}`}>
                        <div className={styles.mealTop}>
                          <div>
                            <p>{formatMealType(meal.mealType)}</p>
                            <h3>{meal.isEnabled === false ? "fällt aus" : meal.recipe.name}</h3>
                          </div>
                          <span className={meal.isEnabled === false ? styles.badgeWarn : styles.badgeGood}>
                            {meal.isEnabled === false ? "deaktiviert" : `${meal.peopleCount ?? 1} Personen`}
                          </span>
                        </div>

                        <p className={styles.mealDescription}>
                          {meal.isEnabled === false
                            ? "Die Mahlzeit bleibt sichtbar, fließt aber nicht in Makros, Einkaufsliste oder Kochansicht ein."
                            : meal.recipe.description}
                        </p>

                        <div className={styles.mealMeta}>
                          <strong>{formatCalories(meal.calculated.calories)}</strong>
                          <strong>{formatGrams(meal.calculated.protein)} Protein</strong>
                          <strong>{formatGrams(meal.calculated.carbs)} KH</strong>
                          <strong>{formatGrams(meal.calculated.fat)} Fett</strong>
                        </div>

                        <div className={styles.mealLinks}>
                          <label>
                            Gericht
                            <select
                              disabled={!meal.id}
                              onChange={(event) => {
                                if (meal.id) {
                                  void changeMealRecipe(meal.id, event.currentTarget.value);
                                }
                              }}
                              value={meal.recipe.id}
                            >
                              {recipeOptions.map((recipe) => (
                                <option key={recipe.id} value={recipe.id}>
                                  {recipe.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Personen
                            <input
                              max={12}
                              min={1}
                              onChange={(event) => {
                                if (meal.id) {
                                  void changeMealPatch(meal.id, {
                                    peopleCount: Number(event.currentTarget.value),
                                  });
                                }
                              }}
                              type="number"
                              value={meal.peopleCount ?? 1}
                            />
                          </label>
                          <label>
                            <input
                              checked={meal.isEnabled !== false}
                              onChange={(event) => {
                                if (meal.id) {
                                  void changeMealPatch(meal.id, {
                                    isEnabled: event.currentTarget.checked,
                                  });
                                }
                              }}
                              type="checkbox"
                            />{" "}
                            Mahlzeit findet statt
                          </label>
                          <label>
                            <input
                              checked={meal.includeInShoppingList !== false}
                              disabled={meal.isEnabled === false}
                              onChange={(event) => {
                                if (meal.id) {
                                  void changeMealPatch(meal.id, {
                                    includeInShoppingList: event.currentTarget.checked,
                                  });
                                }
                              }}
                              type="checkbox"
                            />{" "}
                            in Einkaufsliste berücksichtigen
                          </label>
                        </div>

                        <div className={styles.mealLinks}>
                          {canCook ? (
                            <Link href={buildCookHref(meal.id ?? "")}>Rezept kochen</Link>
                          ) : null}
                          <Link href="/einkaufsliste">Zur Einkaufsliste</Link>
                          {meal.mealType === "snack" && meal.id ? (
                            <button
                              className={styles.badgeWarn}
                              onClick={() => void removeSnack(meal.id ?? "")}
                              type="button"
                            >
                              Snack entfernen
                            </button>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </article>
            </div>

            <aside className={styles.sideColumn}>
              <article className={styles.sectionCard}>
                <div className={styles.macroAside}>
                  <div>
                    <p className={styles.sectionKicker}>Snack hinzufügen</p>
                    <h2>Zusätzliche Mahlzeit</h2>
                    <p>Snacks werden als eigener Mahlzeitentyp gespeichert und können danach getauscht werden.</p>
                  </div>
                  <div className={styles.mealLinks}>
                    <select
                      onChange={(event) => setSnackRecipeId(event.currentTarget.value)}
                      value={snackRecipeId}
                    >
                      {snackRecipes.map((recipe) => (
                        <option key={recipe.id} value={recipe.id}>
                          {recipe.name}
                        </option>
                      ))}
                    </select>
                    <button className={styles.badgeGood} onClick={() => void addSnack()} type="button">
                      Snack hinzufügen
                    </button>
                  </div>
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
