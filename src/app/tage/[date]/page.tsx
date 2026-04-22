import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./day.module.css";
import { addDays, getWeekStartForDate } from "@/lib/date";
import {
  formatCalories,
  formatDateGerman,
  formatDateRange,
  formatGrams,
  formatMealType,
  formatPercent,
} from "@/lib/format";
import { getDayPlan, weekDates } from "@/lib/store";

export const dynamic = "force-dynamic";

type DayPageProps = {
  params: Promise<{
    date: string;
  }>;
};

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default async function DayPage({ params }: DayPageProps) {
  const { date } = await params;

  if (!isIsoDate(date)) {
    notFound();
  }

  const day = getDayPlan(date);

  if (!day) {
    notFound();
  }

  const weekStart = getWeekStartForDate(date);
  const weekEnd = addDays(weekStart, 6);
  const dates = weekDates(weekStart);
  const previousDay = addDays(date, -1);
  const nextDay = addDays(date, 1);

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
          <p className={styles.eyebrow}>Tagesansicht</p>
          <h1>{day.weekdayLabel}</h1>
          <p className={styles.lead}>
            {formatDateGerman(day.date)} mit {day.meals.length} geplanten Mahlzeiten. Hier siehst
            du die Tagessumme, Makroverteilung und den direkten Sprung zu den Rezeptdetails.
          </p>
        </div>

        <aside className={styles.heroPanel}>
          <div>
            <p className={styles.sectionKicker}>Aktiver Tag</p>
            <h2>{formatDateRange(weekStart, weekEnd)}</h2>
            <p>Der Tageswert wird aus dem aktuell gespeicherten Wochenplan geladen.</p>
          </div>

          <span className={day.withinTolerance ? styles.badgeGood : styles.badgeWarn}>
            {day.withinTolerance ? "Makros im Zielkorridor" : "Makros außerhalb des Korridors"}
          </span>

          <div className={styles.heroActions}>
            <Link href={dates.includes(previousDay) ? `/tage/${previousDay}` : "/"}>
              Vorheriger Tag
            </Link>
            <Link href={dates.includes(nextDay) ? `/tage/${nextDay}` : "/"}>
              Nächster Tag
            </Link>
          </div>
        </aside>
      </section>

      <section className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <span className={styles.sectionKicker}>Kalorien</span>
          <strong>{formatCalories(day.totals.calories)}</strong>
          <p>Ziel: {formatCalories(day.targets.calories)}</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.sectionKicker}>Protein</span>
          <strong>{formatGrams(day.totals.protein)}</strong>
          <p>Ziel: {formatGrams(day.targets.protein)}</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.sectionKicker}>Kohlenhydrate</span>
          <strong>{formatGrams(day.totals.carbs)}</strong>
          <p>Ziel: {formatGrams(day.targets.carbs)}</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.sectionKicker}>Fett</span>
          <strong>{formatGrams(day.totals.fat)}</strong>
          <p>Ziel: {formatGrams(day.targets.fat)}</p>
        </article>
      </section>

      <article className={`${styles.sectionCard} ${styles.weekCard}`}>
        <p className={styles.sectionKicker}>Woche im Überblick</p>
        <h2>Springe direkt zwischen den Tagen</h2>
        <p className={styles.weekHint}>
          Die Tagesseite ist pro Datum erreichbar und greift auf denselben gespeicherten Wochenplan
          zurück wie das Dashboard.
        </p>
        <ul className={styles.weekStrip}>
          {dates.map((weekDate) => {
            const dayLabel = weekDate === day.date ? day.weekdayLabel : formatDateGerman(weekDate);
            return (
              <li key={weekDate}>
                <Link className={weekDate === day.date ? styles.activeDay : ""} href={`/tage/${weekDate}`}>
                  <span>{weekDate === day.date ? "Aktiver Tag" : "Datum"}</span>
                  <strong>{dayLabel}</strong>
                  <small>{formatDateGerman(weekDate)}</small>
                </Link>
              </li>
            );
          })}
        </ul>
      </article>

      <section className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <article className={styles.sectionCard}>
            <p className={styles.sectionKicker}>Mahlzeiten</p>
            <h2>Was heute geplant ist</h2>
            <div className={styles.mealList}>
              {day.meals.map((meal) => (
                <article className={styles.mealCard} key={`${day.date}-${meal.mealType}-${meal.recipe.id}`}>
                  <div className={styles.mealTop}>
                    <div>
                      <p>{formatMealType(meal.mealType)}</p>
                      <h3>{meal.recipe.name}</h3>
                    </div>
                    <span className={styles.badgeGood}>Faktor {meal.portionFactor.toFixed(2).replace(".", ",")}</span>
                  </div>

                  <p className={styles.mealDescription}>{meal.recipe.description}</p>

                  <div className={styles.mealMeta}>
                    <strong>{formatCalories(meal.calculated.calories)}</strong>
                    <strong>{formatGrams(meal.calculated.protein)} Protein</strong>
                    <strong>{formatGrams(meal.calculated.carbs)} KH</strong>
                    <strong>{formatGrams(meal.calculated.fat)} Fett</strong>
                  </div>

                  <div className={styles.mealLinks}>
                    <Link href={`/rezepte/${meal.recipe.id}`}>Rezept öffnen</Link>
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
                <p>Die Prozentwerte zeigen den Tagesmix unabhängig von der absoluten Kalorienmenge.</p>
              </div>

              <ul className={styles.macroList}>
                <li>
                  <div>
                    <span>Protein</span>
                    <strong>{formatPercent(day.macroPercents.protein)}</strong>
                  </div>
                  <small>Ziel: {formatPercent(day.targets.macroPercents.protein)}</small>
                </li>
                <li>
                  <div>
                    <span>Kohlenhydrate</span>
                    <strong>{formatPercent(day.macroPercents.carbs)}</strong>
                  </div>
                  <small>Ziel: {formatPercent(day.targets.macroPercents.carbs)}</small>
                </li>
                <li>
                  <div>
                    <span>Fett</span>
                    <strong>{formatPercent(day.macroPercents.fat)}</strong>
                  </div>
                  <small>Ziel: {formatPercent(day.targets.macroPercents.fat)}</small>
                </li>
                <li>
                  <div>
                    <span>Tages-Score</span>
                    <strong>{day.score.toFixed(1)}</strong>
                  </div>
                  <small>{day.withinTolerance ? "stabiler Tag" : "prüfenswerte Abweichung"}</small>
                </li>
              </ul>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
