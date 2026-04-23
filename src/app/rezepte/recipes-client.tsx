"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppNav } from "@/app/app-nav";
import { formatCalories, formatGrams, formatMealType, formatShoppingQuantity } from "@/lib/format";
import type { MealType, Recipe } from "@/lib/types";
import styles from "./recipes.module.css";

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

async function listRecipesFromLocalStore() {
  const api = (await import("@/lib/local-store")) as LocalStoreApi;

  if (typeof api.ensureLocalAppData === "function") {
    await api.ensureLocalAppData();
  }

  if (typeof api.listLocalRecipes !== "function") {
    throw new Error("Die lokale Rezeptquelle ist noch nicht verfügbar.");
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
  const [activeRecipeId, setActiveRecipeId] = useState<string | null | undefined>(undefined);

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
            : "Die lokalen Rezepte konnten nicht geladen werden.",
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

  function toggleRecipe(recipeId: string) {
    setActiveRecipeId((current) => {
      const nextRecipeId = current === recipeId ? null : recipeId;
      updateRecipeQuery(nextRecipeId);
      return nextRecipeId;
    });
  }

  const groups = (["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((mealType) => ({
    mealType,
    label: mealTypeLabels[mealType],
    recipes: recipes.filter((recipe) => recipe.mealType === mealType),
  }));
  const resolvedActiveRecipeId = isRecipeAvailable(recipes, requestedRecipeId)
    ? requestedRecipeId
    : activeRecipeId === undefined
      ? (recipes[0]?.id ?? null)
      : isRecipeAvailable(recipes, activeRecipeId)
        ? activeRecipeId
        : (recipes[0]?.id ?? null);

  return (
    <main className={styles.page}>
      <AppNav currentPath="/rezepte" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Lokale Rezeptbibliothek</p>
          <h1>Deine Rezepte liegen direkt auf dem Handy.</h1>
          <p className={styles.lead}>
            Die PWA liest den Rezeptbestand aus der lokalen App-Datenbank. Neue Versionen der App
            oder spätere Importfunktionen können diesen Bestand erweitern, ohne dass du dafür eine
            Benutzerverwaltung brauchst.
          </p>
        </div>
        <div className={styles.heroStat}>
          <span>{isOffline ? "Offline-Modus" : isLoading ? "Lokale Daten werden geladen" : "Bereit"}</span>
          <strong>{recipes.length}</strong>
          <p>Rezepte in deiner lokalen Bibliothek</p>
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
            {isOffline ? "offline verfügbar" : "lokal aktuell"}
          </span>
          <p>
            Neue Rezepte kommen künftig über App-Updates oder einen Import. Deine vorhandenen
            lokalen Daten bleiben dabei erhalten.
          </p>
        </div>
      </section>

      {isLoading ? (
        <section className={styles.groupStack}>
          <article className={styles.groupCard}>
            <p className={styles.sectionKicker}>Lokale Initialisierung</p>
            <h2>Die Rezeptdaten werden vorbereitet.</h2>
            <p className={styles.description}>
              Beim ersten Start kann die lokale Datenbank kurz befüllt oder migriert werden.
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
            <h2>Es sind noch keine lokalen Rezepte vorhanden.</h2>
            <p className={styles.description}>
              Sobald die App Seed-Daten oder einen Import bereitstellt, tauchen die Rezepte hier
              automatisch auf.
            </p>
          </article>
        </section>
      ) : null}

      {!isLoading && !loadError && recipes.length > 0 ? (
        <section className={styles.groupStack}>
          {groups.map((group) => (
            <article className={styles.groupCard} key={group.mealType}>
              <div className={styles.groupHeader}>
                <div>
                  <p className={styles.sectionKicker}>{group.label}</p>
                  <h2>{group.recipes.length} Rezepte</h2>
                </div>
              </div>

              <div className={styles.recipeGrid}>
                {group.recipes.map((recipe) => {
                  const isOpen = resolvedActiveRecipeId === recipe.id;

                  return (
                    <article
                      className={`${styles.recipeCard} ${isOpen ? styles.recipeCardExpanded : ""}`}
                      key={recipe.id}
                    >
                      <button
                        className={styles.recipeButton}
                        type="button"
                        onClick={() => {
                          toggleRecipe(recipe.id);
                        }}
                      >
                        <div className={styles.recipeTop}>
                          <h3>{recipe.name}</h3>
                          <span>{recipe.prepTimeMinutes} Min.</span>
                        </div>

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
                            {recipe.vegetarian ? "vegetarisch" : recipe.proteinSource}
                          </span>
                        </div>

                        <span className={styles.detailToggle}>
                          {isOpen ? "Details ausblenden" : "Zutaten und Zubereitung öffnen"}
                        </span>
                      </button>

                      {isOpen ? (
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
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
