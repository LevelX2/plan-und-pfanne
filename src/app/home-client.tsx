"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { RegenerateWeekForm } from "@/app/regenerate-week-form";
import {
  countShoppingItems,
  createWeekPlanSignature,
  createWeekSelectionStorageKey,
  buildShoppingListGroupsForWeekPlan,
  listWeekMealKeys,
  normalizeSelectedMealKeys,
  plannedMealKeyForMeal,
  type ShoppingListMode,
  type WeekSelectionSnapshot,
} from "@/lib/week-plan-selection";
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
  const [selectedMealKeys, setSelectedMealKeys] = useState<string[]>([]);
  const [shoppingMode, setShoppingMode] = useState<ShoppingListMode>("active-only");
  const selectionHydratedRef = useRef(false);

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
  const { settings, weekPlan, recipeCounts, savedAt } = snapshot;
  const planSignature = createWeekPlanSignature(weekPlan);
  const allMealKeys = listWeekMealKeys(weekPlan);
  const allShoppingItemCount = countShoppingItems(
    buildShoppingListGroupsForWeekPlan(weekPlan, "all-planned", []),
  );
  const activeShoppingItemCount = countShoppingItems(
    buildShoppingListGroupsForWeekPlan(weekPlan, "active-only", selectedMealKeys),
  );
  const selectedMealKeySet = new Set(selectedMealKeys);
  const totalMealCount = allMealKeys.length;
  const selectedMealCount = selectedMealKeys.length;
  const bestDay = [...weekPlan.days].sort((left, right) => left.score - right.score)[0];

  useEffect(() => {
    let cancelled = false;
    selectionHydratedRef.current = false;

    void loadOfflineSnapshot<WeekSelectionSnapshot>(createWeekSelectionStorageKey(weekPlan.startDate))
      .then((snapshot) => {
        if (cancelled) {
          return;
        }

        if (snapshot?.planSignature === planSignature) {
          setSelectedMealKeys(normalizeSelectedMealKeys(weekPlan, snapshot.selectedMealKeys));
          setShoppingMode(snapshot.shoppingMode);
        } else {
          setSelectedMealKeys([]);
          setShoppingMode("active-only");
        }

        selectionHydratedRef.current = true;
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setSelectedMealKeys([]);
        setShoppingMode("active-only");
        selectionHydratedRef.current = true;
      });

    return () => {
      cancelled = true;
    };
  }, [planSignature, weekPlan, weekPlan.startDate]);

  useEffect(() => {
    if (!selectionHydratedRef.current) {
      return;
    }

    const selectionSnapshot: WeekSelectionSnapshot = {
      planSignature,
      selectedMealKeys,
      shoppingMode,
      savedAt: new Date().toISOString(),
    };

    void saveOfflineSnapshot(createWeekSelectionStorageKey(weekPlan.startDate), selectionSnapshot).catch(
      (error) => {
        console.error("Aktive Gerichte konnten nicht gespeichert werden.", error);
      },
    );
  }, [planSignature, selectedMealKeys, shoppingMode, weekPlan.startDate]);

  function toggleMeal(mealKey: string) {
    setSelectedMealKeys((current) =>
      current.includes(mealKey)
        ? current.filter((entry) => entry !== mealKey)
        : [...current, mealKey],
    );
  }

  function selectAllMeals() {
    setSelectedMealKeys(allMealKeys);
  }

  function clearAllMeals() {
    setSelectedMealKeys([]);
  }

  function selectDayMeals(dayMealKeys: string[]) {
    setSelectedMealKeys((current) => [...new Set([...current, ...dayMealKeys])]);
  }

  function clearDayMeals(dayMealKeys: string[]) {
    const dayKeySet = new Set(dayMealKeys);
    setSelectedMealKeys((current) => current.filter((mealKey) => !dayKeySet.has(mealKey)));
  }

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
            Einstellungen ändern und neue Server-Aktionen brauchen weiterhin eine Verbindung.
          </p>
        </div>

        <div className={styles.heroPanel}>
          <p className={styles.panelLabel}>Aktive Woche</p>
          <h2>{formatDateRange(weekPlan.startDate, weekPlan.endDate)}</h2>
          <p className={styles.panelCopy}>
            {describeMealPlanMode(settings.mealsPerDay)} bei {formatCalories(settings.calorieTarget)}{" "}
            und Makroziel {settings.macroProteinPct}/{settings.macroCarbsPct}/{settings.macroFatPct}.
            {" "}Mix: {settings.vegetarianSharePct}/{settings.fishSharePct}/{settings.meatSharePct}.
          </p>

          <div className={styles.heroActions}>
            <div className={styles.actionRow}>
              {isOffline ? (
                <button className={styles.primaryButton} disabled type="button">
                  Offline nicht verfügbar
                </button>
              ) : (
                <RegenerateWeekForm
                  buttonClassName={styles.primaryButton}
                  errorMessageClassName={styles.actionFeedbackError}
                  idleLabel="Woche neu generieren"
                  layoutClassName={styles.regenerateAction}
                  pendingLabel="Wird neu generiert ..."
                  successMessageClassName={styles.actionFeedbackSuccess}
                />
              )}
              <Link className={styles.secondaryButton} href="/rezepte">
                Rezeptdatenbank öffnen
              </Link>
            </div>
            <div className={styles.inlineMeta}>
              <span>{weekPlan.days.length} Tage geplant</span>
              <span>{allShoppingItemCount} Einkaufspositionen gesamt</span>
              <span>
                {selectedMealCount === 0
                  ? "Noch keine aktiven Gerichte"
                  : `${activeShoppingItemCount} Positionen für aktive Gerichte`}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.offlineCard}>
        <div>
          <p className={styles.sectionKicker}>Offline-Modus</p>
          <h2>{isOffline ? "Wochenplan aus dem Gerätespeicher aktiv" : "Wochenplan online synchronisiert"}</h2>
          <p className={styles.offlineCopy}>
            {isOffline
              ? "Du arbeitest gerade mit dem zuletzt gespeicherten Stand. Dashboard, Rezeptbibliothek und Einkaufsliste bleiben lesbar. Änderungen an Einstellungen oder neue Generierungen warten auf die nächste Verbindung."
              : "Der aktuelle Wochenplan wurde lokal gespeichert und steht dir mit Rezeptbibliothek und Einkaufsliste auch ohne Verbindung weiter zur Verfügung."}
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
          <p>Stärkster Tag</p>
          <strong>{bestDay.weekdayLabel}</strong>
          <span>{qualityLabel(bestDay.score)}</span>
        </article>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <article className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionKicker}>Wochenübersicht</p>
                <h2>Alle 7 Tage auf einen Blick</h2>
              </div>
              <p className={styles.sectionHint}>
                Jede Karte zeigt Tagessumme, Makroabweichung und die geplanten Mahlzeiten. Aktiviere
                hier die Gerichte, die du wirklich kochen möchtest.
              </p>
            </div>

            <div className={styles.selectionBar}>
              <div className={styles.selectionSummary}>
                <p className={styles.sectionKicker}>Aktive Gerichte</p>
                <strong>
                  {selectedMealCount} von {totalMealCount}
                </strong>
                <span>
                  {selectedMealCount === 0
                    ? "Die Einkaufsliste startet bewusst leer."
                    : `Die Einkaufsliste kennt aktuell ${activeShoppingItemCount} relevante Positionen.`}
                </span>
              </div>

              <div className={styles.selectionActions}>
                <button className={styles.secondaryChipButton} onClick={selectAllMeals} type="button">
                  Alle auswählen
                </button>
                <button className={styles.secondaryChipButton} onClick={clearAllMeals} type="button">
                  Alle abwählen
                </button>
                <Link className={styles.textLink} href="/einkaufsliste">
                  Einkaufsliste öffnen
                </Link>
              </div>
            </div>

            <div className={styles.dayGrid}>
              {weekPlan.days.map((day) => {
                const proteinDelta = day.macroPercents.protein - day.targets.macroPercents.protein;
                const carbsDelta = day.macroPercents.carbs - day.targets.macroPercents.carbs;
                const fatDelta = day.macroPercents.fat - day.targets.macroPercents.fat;
                const dayMealKeys = day.meals.map((meal) => plannedMealKeyForMeal(day.date, meal));
                const allDayMealsActive =
                  dayMealKeys.length > 0 &&
                  dayMealKeys.every((mealKey) => selectedMealKeySet.has(mealKey));

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

                    <div className={styles.dayActionRow}>
                      <span className={allDayMealsActive ? styles.statusGood : styles.statusWarn}>
                        {dayMealKeys.filter((mealKey) => selectedMealKeySet.has(mealKey)).length} von{" "}
                        {dayMealKeys.length} aktiv
                      </span>
                      <div className={styles.dayActionButtons}>
                        <button
                          className={styles.dayMiniButton}
                          onClick={() => selectDayMeals(dayMealKeys)}
                          type="button"
                        >
                          Tag auswählen
                        </button>
                        <button
                          className={styles.dayMiniButton}
                          onClick={() => clearDayMeals(dayMealKeys)}
                          type="button"
                        >
                          Tag abwählen
                        </button>
                      </div>
                    </div>

                    <ul className={styles.mealList}>
                      {day.meals.map((meal) => {
                        const mealKey = plannedMealKeyForMeal(day.date, meal);
                        const isActive = selectedMealKeySet.has(mealKey);

                        return (
                        <li
                          className={`${styles.mealRow} ${
                            isActive ? styles.mealRowActive : styles.mealRowInactive
                          }`}
                          key={mealKey}
                        >
                          <div className={styles.mealInfo}>
                            <p>{formatMealType(meal.mealType)}</p>
                            <strong>{meal.recipe.name}</strong>
                          </div>
                          <div className={styles.mealActions}>
                            <span>x{meal.portionFactor.toFixed(2).replace(".", ",")}</span>
                            <button
                              className={`${styles.toggleButton} ${
                                isActive ? styles.toggleButtonActive : styles.toggleButtonInactive
                              }`}
                              onClick={() => toggleMeal(mealKey)}
                              type="button"
                            >
                              {isActive ? "Aktiv" : "Nicht aktiv"}
                            </button>
                          </div>
                        </li>
                      )})}
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
                <dt>Zielmix</dt>
                <dd>
                  {settings.vegetarianSharePct} % vegetarisch, {settings.fishSharePct} % Fisch,{" "}
                  {settings.meatSharePct} % Fleisch
                </dd>
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
            <h2>Verfügbare Mahlzeiten</h2>
            <ul className={styles.stackList}>
              <li>
                <span>Frühstück</span>
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
              <li>Aktive Gerichtsauswahl pro Woche im Gerätespeicher</li>
              <li>Rezeptbibliothek mit Zutaten und Zubereitung</li>
              <li>Einkaufsliste mit lokalem Abhaken</li>
              <li>Neue Synchronisierung, sobald wieder Internet da ist</li>
              <li>Einstellungen ändern nur online</li>
            </ul>
          </article>
        </aside>
      </section>
    </main>
  );
}
