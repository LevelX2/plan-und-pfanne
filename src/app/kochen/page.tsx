"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppNav } from "@/app/app-nav";
import {
  formatCalories,
  formatDateGerman,
  formatGrams,
  formatMealType,
  formatShoppingQuantity,
} from "@/lib/format";
import { getLocalPlannedMealForCooking, getScaledIngredientAmount } from "@/lib/local-store";
import type { DayPlan, PlannedMeal } from "@/lib/types";
import styles from "@/app/rezepte/recipes.module.css";

type CookingState = {
  day: DayPlan;
  meal: PlannedMeal;
};

function CookingPageContent() {
  const searchParams = useSearchParams();
  const mealId = searchParams.get("meal")?.trim() || "";
  const [state, setState] = useState<CookingState | null>(null);
  const [peopleCount, setPeopleCount] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCookingView() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const nextState = mealId ? await getLocalPlannedMealForCooking(mealId) : null;

        if (cancelled) {
          return;
        }

        setState(nextState);
        setPeopleCount(nextState?.meal.peopleCount ?? 1);
        if (!nextState) {
          setLoadError("Die geplante Mahlzeit wurde nicht gefunden.");
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "Die Kochansicht konnte nicht geladen werden.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCookingView();

    return () => {
      cancelled = true;
    };
  }, [mealId]);

  const meal = state?.meal ?? null;
  const day = state?.day ?? null;
  const recipe = meal?.recipe ?? null;

  return (
    <main className={styles.page}>
      <AppNav currentPath="/tage" />

      <section className={styles.detailHero}>
        <div className={styles.detailHeroText}>
          <p className={styles.eyebrow}>Rezept kochen</p>
          <h1>{recipe ? recipe.name : "Geplante Mahlzeit"}</h1>
          <p className={styles.lead}>
            {day && meal
              ? `${formatMealType(meal.mealType)} am ${formatDateGerman(day.date)}. Die Menge ist hier temporär änderbar und schreibt nicht zurück in den Tagesplan.`
              : "Öffne diese Ansicht direkt aus einer geplanten Mahlzeit."}
          </p>
        </div>

        <aside className={styles.macroPanel}>
          <p className={styles.sectionKicker}>Menge</p>
          <h2>{peopleCount} Personen</h2>
          <div className={styles.macroRow}>
            <button
              className={styles.detailLink}
              disabled={peopleCount <= 1}
              onClick={() => setPeopleCount((current) => Math.max(1, current - 1))}
              type="button"
            >
              -
            </button>
            <input
              max={12}
              min={1}
              onChange={(event) => setPeopleCount(Math.max(1, Math.min(12, Number(event.currentTarget.value))))}
              type="number"
              value={peopleCount}
            />
            <button
              className={styles.detailLink}
              disabled={peopleCount >= 12}
              onClick={() => setPeopleCount((current) => Math.min(12, current + 1))}
              type="button"
            >
              +
            </button>
          </div>
          {day ? (
            <Link className={styles.detailLink} href={`/tage?date=${encodeURIComponent(day.date)}`}>
              Zurück zum Tag
            </Link>
          ) : null}
        </aside>
      </section>

      {isLoading ? (
        <section className={styles.detailGrid}>
          <article className={styles.groupCard}>
            <p className={styles.sectionKicker}>App-Start</p>
            <h2>Kochansicht wird geladen.</h2>
          </article>
        </section>
      ) : null}

      {!isLoading && loadError ? (
        <section className={styles.detailGrid}>
          <article className={styles.groupCard}>
            <p className={styles.sectionKicker}>Fehler</p>
            <h2>Keine Kochansicht verfügbar.</h2>
            <p className={styles.description}>{loadError}</p>
            <Link className={styles.detailLink} href="/tage">
              Tagesdetail öffnen
            </Link>
          </article>
        </section>
      ) : null}

      {!isLoading && recipe && meal ? (
        <section className={styles.detailGrid}>
          <article className={styles.groupCard}>
            <p className={styles.sectionKicker}>Zutaten</p>
            <h2>Skaliert für {peopleCount} Personen</h2>
            <ul className={styles.ingredientList}>
              {recipe.ingredients.map((ingredient) => (
                <li key={`${recipe.id}-${ingredient.name}`}>
                  <div>
                    <strong>{ingredient.name}</strong>
                    <span>{ingredient.category}</span>
                  </div>
                  <span>
                    {formatShoppingQuantity(
                      getScaledIngredientAmount(recipe, peopleCount, ingredient.amount),
                      ingredient.unit,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </article>

          <article className={styles.groupCard}>
            <p className={styles.sectionKicker}>Zubereitung</p>
            <h2>Schritt für Schritt</h2>
            <div className={styles.macroRow}>
              <span>{formatCalories(recipe.calories)}</span>
              <span>{formatGrams(recipe.proteinG)} Protein</span>
              <span>{formatGrams(recipe.carbsG)} KH</span>
              <span>{formatGrams(recipe.fatG)} Fett</span>
            </div>
            <ol className={styles.instructions}>
              {recipe.instructions.map((step, index) => (
                <li key={`${recipe.id}-step-${index + 1}`}>
                  <span className={styles.stepNumber}>{index + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </article>
        </section>
      ) : null}
    </main>
  );
}

export default function CookingPage() {
  return (
    <Suspense fallback={null}>
      <CookingPageContent />
    </Suspense>
  );
}
