"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppNav } from "@/app/app-nav";
import { formatCalories, formatGrams, formatMealType, formatShoppingQuantity } from "@/lib/format";
import type { MealType, Recipe } from "@/lib/types";
import styles from "./recipes.module.css";

const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;

const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Frühstück",
  lunch: "Mittagessen",
  dinner: "Abendessen",
  snack: "Snack",
};

type LocalStoreApi = {
  ensureLocalAppData?: () => Promise<unknown>;
  listLocalRecipes?: () => Promise<Recipe[]>;
};

function buildRecipeHref(recipeId: string) {
  return `/rezepte?recipe=${encodeURIComponent(recipeId)}`;
}

function isRecipeAvailable(recipes: Recipe[], recipeId: string | null) {
  return Boolean(recipeId && recipes.some((recipe) => recipe.id === recipeId));
}

function createCollapsedGroupState(): Record<MealType, boolean> {
  return {
    breakfast: false,
    lunch: false,
    dinner: false,
    snack: false,
  };
}

function findRecipeById(recipes: Recipe[], recipeId: string | null) {
  if (!recipeId) {
    return null;
  }

  return recipes.find((recipe) => recipe.id === recipeId) ?? null;
}

function getRecipeClassification(recipe: Recipe) {
  return recipe.vegetarian ? "vegetarisch" : recipe.proteinSource;
}

async function listRecipesFromLocalStore() {
  const api = (await import("@/lib/local-store")) as LocalStoreApi;

  if (typeof api.ensureLocalAppData === "function") {
    await api.ensureLocalAppData();
  }

  if (typeof api.listLocalRecipes !== "function") {
    throw new Error("Die Rezeptquelle ist noch nicht verfügbar.");
  }

  return api.listLocalRecipes();
}

export function RecipesClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedRecipeId = searchParams.get("recipe")?.trim() || null;

  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [openGroups, setOpenGroups] = useState<Record<MealType, boolean>>(() =>
    createCollapsedGroupState(),
  );

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
    let cancelled = false;

    async function loadRecipes() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const nextRecipes = await listRecipesFromLocalStore();

        if (cancelled) {
          return;
        }

        setRecipes(nextRecipes);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Der Rezeptbestand konnte nicht geladen werden.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRecipes();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!requestedRecipeId || recipes.length === 0 || isRecipeAvailable(recipes, requestedRecipeId)) {
      return;
    }

    router.replace(pathname, { scroll: false });
  }, [pathname, recipes, requestedRecipeId, router]);

  function updateRecipeQuery(recipeId: string | null) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (recipeId) {
      nextParams.set("recipe", recipeId);
    } else {
      nextParams.delete("recipe");
    }

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  const activeRecipe = findRecipeById(recipes, requestedRecipeId);
  const resolvedActiveRecipeId = activeRecipe?.id ?? null;
  const activeRecipeMealType = activeRecipe?.mealType ?? null;

  function toggleGroup(mealType: MealType) {
    const isOpen = openGroups[mealType] || activeRecipeMealType === mealType;
    const nextIsOpen = !isOpen;

    setOpenGroups((current) => ({ ...current, [mealType]: nextIsOpen }));

    if (!nextIsOpen && activeRecipeMealType === mealType) {
      updateRecipeQuery(null);
    }
  }

  function toggleRecipe(recipe: Recipe) {
    const isOpen = resolvedActiveRecipeId === recipe.id;
    const nextRecipeId = isOpen ? null : recipe.id;

    if (!isOpen) {
      setOpenGroups((current) =>
        current[recipe.mealType] ? current : { ...current, [recipe.mealType]: true },
      );
    }

    updateRecipeQuery(nextRecipeId);
  }

  const groups = mealTypes.map((mealType) => ({
    mealType,
    label: mealTypeLabels[mealType],
    recipes: recipes.filter((recipe) => recipe.mealType === mealType),
  }));

  return (
    <main className={styles.page}>
      <AppNav currentPath="/rezepte" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Rezeptbibliothek</p>
          <h1>Deine Rezepte sind sofort griffbereit.</h1>
          <p className={styles.lead}>
            Die App liest den Rezeptbestand aus ihrem Gerätespeicher. Neue App-Versionen oder
            spätere Importfunktionen können diesen Bestand erweitern, ohne dass dein bisheriger
            Verlauf verloren geht.
          </p>
        </div>
        <div className={styles.heroStat}>
          <span>{isOffline ? "Offline-Modus" : isLoading ? "Daten werden geladen" : "Bereit"}</span>
          <strong>{recipes.length}</strong>
          <p>Rezepte in deiner Bibliothek</p>
        </div>
      </section>

      <section className={styles.installCard}>
        <div>
          <p className={styles.sectionKicker}>Installieren</p>
          <h2>Als PWA auf dem Home-Bildschirm</h2>
          <p className={styles.installCopy}>
            Android: Browser-Menü und dann &quot;Installieren&quot;. iPhone: Teilen und dann
            &quot;Zum Home-Bildschirm&quot;. Danach bleibt diese Rezeptübersicht inklusive geöffneter
            Details auch ohne Verbindung nutzbar.
          </p>
        </div>

        <div className={styles.installMeta}>
          <span className={isOffline ? styles.statusOffline : styles.statusOnline}>
            {isOffline ? "offline verfügbar" : "auf diesem Gerät gespeichert"}
          </span>
          <p>
            Neue Rezepte kommen künftig über App-Updates oder einen Import. Deine vorhandenen
            Daten auf diesem Gerät bleiben dabei erhalten.
          </p>
        </div>
      </section>

      {isLoading ? (
        <section className={styles.groupStack}>
          <article className={styles.groupCard}>
            <p className={styles.sectionKicker}>App-Start</p>
            <h2>Die Rezeptdaten werden vorbereitet.</h2>
            <p className={styles.description}>
              Beim ersten Start kann der Gerätespeicher kurz befüllt oder migriert werden.
            </p>
          </article>
        </section>
      ) : null}

      {loadError ? (
        <section className={styles.groupStack}>
          <article className={styles.groupCard}>
            <p className={styles.sectionKicker}>Fehler</p>
            <h2>Die Rezepte konnten nicht geladen werden.</h2>
            <p className={styles.description}>{loadError}</p>
          </article>
        </section>
      ) : null}

      {!isLoading && !loadError && recipes.length === 0 ? (
        <section className={styles.groupStack}>
          <article className={styles.groupCard}>
            <p className={styles.sectionKicker}>Noch leer</p>
            <h2>Es sind noch keine Rezepte vorhanden.</h2>
            <p className={styles.description}>
              Sobald die App Startdaten oder einen Import bereitstellt, tauchen die Rezepte hier
              automatisch auf.
            </p>
          </article>
        </section>
      ) : null}

      {!isLoading && !loadError && recipes.length > 0 ? (
        <section className={styles.groupStack}>
          {groups.map((group) => {
            const isGroupOpen = openGroups[group.mealType] || activeRecipeMealType === group.mealType;

            return (
              <article
                className={`${styles.groupCard} ${isGroupOpen ? styles.groupCardExpanded : ""}`}
                key={group.mealType}
              >
                <div className={styles.groupHeader}>
                  <button
                    aria-controls={`recipe-group-${group.mealType}`}
                    aria-expanded={isGroupOpen}
                    className={styles.groupButton}
                    type="button"
                    onClick={() => {
                      toggleGroup(group.mealType);
                    }}
                  >
                    <div>
                      <p className={styles.sectionKicker}>{group.recipes.length} Rezepte</p>
                      <h2>{group.label}</h2>
                    </div>

                    <div className={styles.groupButtonMeta}>
                      <span className={styles.groupAction}>
                        {isGroupOpen ? "Einklappen" : "Aufklappen"}
                      </span>
                      <span className={styles.toggleIcon} aria-hidden="true">
                        {isGroupOpen ? "-" : "+"}
                      </span>
                    </div>
                  </button>
                </div>

                {isGroupOpen ? (
                  <div className={styles.recipeGrid} id={`recipe-group-${group.mealType}`}>
                    {group.recipes.map((recipe) => {
                      const isOpen = resolvedActiveRecipeId === recipe.id;

                      return (
                        <article
                          className={`${styles.recipeCard} ${isOpen ? styles.recipeCardExpanded : ""}`}
                          key={recipe.id}
                        >
                          <button
                            aria-controls={`recipe-details-${recipe.id}`}
                            aria-expanded={isOpen}
                            className={styles.recipeButton}
                            type="button"
                            onClick={() => {
                              toggleRecipe(recipe);
                            }}
                          >
                            <div className={styles.recipeTop}>
                              <div className={styles.recipeHeading}>
                                <h3>{recipe.name}</h3>

                                <div className={styles.recipeSummaryRow}>
                                  <span className={styles.summaryPill}>
                                    {getRecipeClassification(recipe)}
                                  </span>
                                  <span className={styles.summaryPill}>
                                    {recipe.prepTimeMinutes} Min.
                                  </span>
                                  <span className={styles.summaryPill}>
                                    {recipe.ingredients.length} Zutaten
                                  </span>
                                </div>
                              </div>

                              <span className={styles.toggleIcon} aria-hidden="true">
                                {isOpen ? "-" : "+"}
                              </span>
                            </div>

                            <span className={styles.detailToggle}>
                              {isOpen ? "Details verbergen" : "Details anzeigen"}
                            </span>
                          </button>

                          {isOpen ? (
                            <div className={styles.recipeExpandedContent} id={`recipe-details-${recipe.id}`}>
                              <div className={styles.recipePreview}>
                                <p className={styles.description}>{recipe.description}</p>

                                <div className={styles.macroRow}>
                                  <span>{formatCalories(recipe.calories)}</span>
                                  <span>{formatGrams(recipe.proteinG)} Protein</span>
                                  <span>{formatGrams(recipe.carbsG)} KH</span>
                                  <span>{formatGrams(recipe.fatG)} Fett</span>
                                </div>

                                <div className={styles.tagRow}>
                                  {recipe.tags.map((tag) => (
                                    <span className={styles.tag} key={tag}>
                                      {tag}
                                    </span>
                                  ))}
                                  <span className={styles.tagMuted}>
                                    {getRecipeClassification(recipe)}
                                  </span>
                                </div>
                              </div>

                              <div className={styles.recipeDetails}>
                                <div className={styles.recipeDetailColumn}>
                                  <p className={styles.sectionKicker}>Zutaten</p>
                                  <ul className={styles.ingredientList}>
                                    {recipe.ingredients.map((ingredient) => (
                                      <li key={`${recipe.id}-${ingredient.name}`}>
                                        <div>
                                          <strong>{ingredient.name}</strong>
                                          <span>{ingredient.category}</span>
                                        </div>
                                        <span>
                                          {formatShoppingQuantity(ingredient.amount, ingredient.unit)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className={styles.recipeDetailColumn}>
                                  <p className={styles.sectionKicker}>Zubereitung</p>
                                  <ol className={styles.instructions}>
                                    {recipe.instructions.map((step, index) => (
                                      <li key={`${recipe.id}-step-${index + 1}`}>
                                        <span className={styles.stepNumber}>{index + 1}</span>
                                        <p>{step}</p>
                                      </li>
                                    ))}
                                  </ol>

                                  <Link className={styles.detailLink} href={buildRecipeHref(recipe.id)}>
                                    Detailansicht für {formatMealType(recipe.mealType)} verlinken
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      ) : null}
    </main>
  );
}
