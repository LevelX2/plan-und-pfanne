"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNav, type AppNavUser } from "@/app/app-nav";
import styles from "./recipes.module.css";
import { formatCalories, formatGrams, formatMealType, formatShoppingQuantity } from "@/lib/format";
import { saveOfflineSnapshot } from "@/lib/offline-store";
import { createUserScopedStorageKey } from "@/lib/user-storage";
import type { MealType, Recipe } from "@/lib/types";

const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Frühstück",
  lunch: "Mittagessen",
  dinner: "Abendessen",
  snack: "Snack",
};

type RecipeSnapshot = {
  recipes: Recipe[];
  savedAt: string;
};

type RecipesClientProps = {
  initialRecipes: Recipe[];
  storageNamespace: string;
  user: AppNavUser;
};

export function RecipesClient({ initialRecipes, storageNamespace, user }: RecipesClientProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(initialRecipes[0]?.id ?? null);
  const storageKey = createUserScopedStorageKey(storageNamespace, "recipes-snapshot-v2");

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
    if (initialRecipes.length === 0) {
      return;
    }

    const snapshot: RecipeSnapshot = {
      recipes: initialRecipes,
      savedAt: new Date().toISOString(),
    };

    void saveOfflineSnapshot(storageKey, snapshot).catch((error) => {
      console.error("Lokaler Rezeptspeicher konnte nicht aktualisiert werden.", error);
    });
  }, [initialRecipes, storageKey]);

  const groups = (["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((mealType) => ({
    mealType,
    label: mealTypeLabels[mealType],
    recipes: initialRecipes.filter((recipe) => recipe.mealType === mealType),
  }));

  return (
    <main className={styles.page}>
      <AppNav currentPath="/rezepte" user={user} />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Rezept-App für dein Handy</p>
          <h1>Deine Rezepte bleiben auch ohne WLAN auf dem Gerät.</h1>
          <p className={styles.lead}>
            Diese Ansicht speichert den Rezeptbestand lokal auf deinem Handy. Öffne die Seite
            später erneut online, damit neue oder geänderte Rezepte wieder synchronisiert werden.
          </p>
        </div>
        <div className={styles.heroStat}>
          <span>{isOffline ? "Offline-Modus" : "Bereit zum Speichern"}</span>
          <strong>{initialRecipes.length}</strong>
          <p>Rezepte im lokalen Handy-Speicher</p>
        </div>
      </section>

      <section className={styles.installCard}>
        <div>
          <p className={styles.sectionKicker}>Installieren</p>
          <h2>Zum Home-Bildschirm hinzufügen</h2>
          <p className={styles.installCopy}>
            Android: Browser-Menü und dann &quot;Installieren&quot;. iPhone: Teilen und dann
            &quot;Zum Home-Bildschirm&quot;. Offline ist hier bewusst vor allem die Rezeptbibliothek
            gedacht. Dashboard und Einkaufsliste können zuvor geladene Daten zeigen, Einstellungen
            und neue Generierungen brauchen aber weiterhin eine Verbindung.
          </p>
        </div>

        <div className={styles.installMeta}>
          <span className={isOffline ? styles.statusOffline : styles.statusOnline}>
            {isOffline ? "offline aktiv" : "online synchronisiert"}
          </span>
          <p>Öffne diese Seite online erneut, wenn du neue Rezepte oder geänderte Inhalte laden willst.</p>
        </div>
      </section>

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
                const isOpen = activeRecipeId === recipe.id;

                return (
                  <article
                    className={`${styles.recipeCard} ${isOpen ? styles.recipeCardExpanded : ""}`}
                    key={recipe.id}
                  >
                    <button
                      className={styles.recipeButton}
                      type="button"
                      onClick={() => {
                        setActiveRecipeId((current) => (current === recipe.id ? null : recipe.id));
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
                        {isOpen ? "Details ausblenden" : "Zutaten und Zubereitung offline öffnen"}
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
                                <span>{formatShoppingQuantity(ingredient.amount, ingredient.unit)}</span>
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

                          <Link className={styles.detailLink} href={`/rezepte/${recipe.id}`}>
                            Online-Detailseite für {formatMealType(recipe.mealType)} öffnen
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
    </main>
  );
}
