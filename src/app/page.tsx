import Link from "next/link";
import styles from "./page.module.css";
import { regenerateCurrentWeekAction } from "@/app/actions";
import { buildShoppingListForWeek, getCurrentWeekPlan, getSettings, listRecipes } from "@/lib/store";
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

export const dynamic = "force-dynamic";

function macroBadgeClass(delta: number) {
  if (Math.abs(delta) <= 5) {
    return styles.macroGood;
  }

  if (Math.abs(delta) <= 10) {
    return styles.macroOkay;
  }

  return styles.macroOff;
}

export default function Home() {
  const settings = getSettings();
  const weekPlan = getCurrentWeekPlan();
  const recipes = listRecipes();

  if (!weekPlan) {
    throw new Error("Der aktuelle Wochenplan konnte nicht geladen werden.");
  }

  const shoppingGroups = buildShoppingListForWeek(weekPlan.startDate);

  const recipeCounts = {
    breakfast: recipes.filter((recipe) => recipe.mealType === "breakfast").length,
    lunch: recipes.filter((recipe) => recipe.mealType === "lunch").length,
    dinner: recipes.filter((recipe) => recipe.mealType === "dinner").length,
    snack: recipes.filter((recipe) => recipe.mealType === "snack").length,
  };

  const shoppingItemCount = shoppingGroups.reduce((sum, group) => sum + group.items.length, 0);
  const bestDay = [...weekPlan.days].sort((left, right) => left.score - right.score)[0];

  return (
    <main className={styles.page}>
      <nav className={styles.topNav}>
        <Link href="/">Dashboard</Link>
        <Link href="/rezepte">Rezepte</Link>
        <Link href="/einkaufsliste">Einkaufsliste</Link>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Glutenfreie Wochenplanung</p>
          <h1>Dein aktueller Wochenplan ist bereit.</h1>
          <p className={styles.lead}>
            Die App plant bereits mit deinem glutenfreien Rezeptbestand, deinen Makrozielen und
            einer Tagesoptimierung statt loser Einzelrezepte.
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
                <button className={styles.primaryButton} type="submit">
                  Woche neu generieren
                </button>
              </form>
              <Link className={styles.secondaryButton} href="/rezepte">
                Rezeptdatenbank öffnen
              </Link>
            </div>
            <div className={styles.inlineMeta}>
              <span>{weekPlan.days.length} Tage geplant</span>
              <span>{shoppingItemCount} Einkaufspositionen</span>
            </div>
          </div>
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
          <strong>{recipes.length}</strong>
          <span>gefilterte Rezepte aktiv</span>
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
                <dt>Glutenfrei</dt>
                <dd>immer aktiv</dd>
              </div>
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
          </article>

          <article className={styles.sectionCard}>
            <p className={styles.sectionKicker}>Nächster Ausbau</p>
            <h2>Was jetzt als Nächstes Sinn ergibt</h2>
            <ul className={styles.todoList}>
              <li>Einstellungsseite mit Formular an die bestehende Server Action anbinden</li>
              <li>Rezeptliste und Rezeptdetails als echte Routen ergänzen</li>
              <li>Tagesansicht und Einkaufsliste aus dem vorhandenen Store sichtbar machen</li>
              <li>Scheduler-Route für automatische Sonntags-Generierung ergänzen</li>
            </ul>
          </article>
        </aside>
      </section>
    </main>
  );
}
