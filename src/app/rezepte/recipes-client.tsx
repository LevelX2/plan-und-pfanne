"use client";

import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/app/app-nav";
import { formatCalories, formatGrams, formatMealType, formatShoppingQuantity } from "@/lib/format";
import {
  listLocalRecipeMealTypePreferences,
  listLocalRecipes,
  saveLocalRecipeMealTypePreference,
} from "@/lib/local-store";
import type { EffectiveRecipeMealTypePreference, FrequencyWeight, MealType, Recipe } from "@/lib/types";
import styles from "./recipes.module.css";

const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const satisfies MealType[];

const frequencyLabels: Record<FrequencyWeight, string> = {
  rare: "selten",
  normal: "normal",
  often: "häufig",
};

type RecipeState = {
  recipes: Recipe[];
  preferences: EffectiveRecipeMealTypePreference[];
};

async function loadRecipeState(): Promise<RecipeState> {
  const [recipes, preferences] = await Promise.all([
    listLocalRecipes({ applySettings: false }),
    listLocalRecipeMealTypePreferences(),
  ]);

  return {
    recipes,
    preferences,
  };
}

export function RecipesClient() {
  const [state, setState] = useState<RecipeState>({ recipes: [], preferences: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);
  const [openPlanningMealTypes, setOpenPlanningMealTypes] = useState<MealType[]>([]);
  const [openLibraryMealTypes, setOpenLibraryMealTypes] = useState<MealType[]>([]);
  const groupedRecipes = useMemo(
    () =>
      mealTypes.map((mealType) => ({
        mealType,
        recipes: state.recipes.filter((recipe) => recipe.mealType === mealType),
      })),
    [state.recipes],
  );

  async function refresh() {
    const nextState = await loadRecipeState();
    setState(nextState);
  }

  useEffect(() => {
    let cancelled = false;

    void loadRecipeState()
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

        setLoadError(error instanceof Error ? error.message : "Der Rezeptbestand konnte nicht geladen werden.");
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

  async function updatePreference(preference: EffectiveRecipeMealTypePreference, patch: {
    enabledForPlanning?: boolean;
    frequencyWeight?: FrequencyWeight;
  }) {
    await saveLocalRecipeMealTypePreference({
      recipeId: preference.recipe.id,
      mealType: preference.mealType,
      enabledForPlanning: patch.enabledForPlanning ?? preference.enabledForPlanning,
      frequencyWeight: patch.frequencyWeight ?? preference.frequencyWeight,
    });
    await refresh();
  }

  function toggleMealType(mealTypes: MealType[], mealType: MealType) {
    return mealTypes.includes(mealType)
      ? mealTypes.filter((entry) => entry !== mealType)
      : [...mealTypes, mealType];
  }

  return (
    <main className={styles.page}>
      <AppNav currentPath="/rezepte" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Rezeptauswahl</p>
          <h1>Welche Rezepte darf der Generator verwenden?</h1>
          <p className={styles.lead}>
            Pro Mahlzeitentyp entscheidest Du, welche Rezepte zugelassen sind und ob sie selten,
            normal oder häufig in die automatische Planung einfließen sollen.
          </p>
        </div>
        <div className={styles.heroStat}>
          <span>{isLoading ? "wird geladen" : "Rezepte"}</span>
          <strong>{state.recipes.length}</strong>
          <p>gespeicherte glutenfreie Optionen</p>
        </div>
      </section>

      {loadError ? (
        <section className={styles.groupStack}>
          <article className={styles.groupCard}>
            <p className={styles.sectionKicker}>Fehler</p>
            <h2>Die Rezepte konnten nicht geladen werden.</h2>
            <p className={styles.description}>{loadError}</p>
          </article>
        </section>
      ) : null}

      {!loadError ? (
        <section className={styles.groupStack}>
          {mealTypes.map((mealType) => {
            const preferences = state.preferences.filter((preference) => preference.mealType === mealType);
            const enabledCount = preferences.filter((preference) => preference.enabledForPlanning).length;
            const isGroupOpen = openPlanningMealTypes.includes(mealType);
            const groupId = `planning-${mealType}`;

            return (
              <article className={`${styles.groupCard} ${isGroupOpen ? styles.groupCardExpanded : ""}`} key={mealType}>
                <button
                  aria-controls={groupId}
                  aria-expanded={isGroupOpen}
                  className={styles.groupButton}
                  onClick={() =>
                    setOpenPlanningMealTypes((current) => toggleMealType(current, mealType))
                  }
                  type="button"
                >
                  <div>
                    <p className={styles.sectionKicker}>{enabledCount} zugelassen</p>
                    <h2>{formatMealType(mealType)}</h2>
                  </div>
                  <span className={styles.groupButtonMeta}>
                    <span>{preferences.length} Optionen</span>
                    <span className={styles.groupAction}>{isGroupOpen ? "zuklappen" : "aufklappen"}</span>
                    <span className={styles.toggleIcon}>{isGroupOpen ? "-" : "+"}</span>
                  </span>
                </button>

                {isGroupOpen ? (
                  <div className={styles.recipeGrid} id={groupId}>
                    {preferences.map((preference) => (
                      <article className={styles.recipeCard} key={`${preference.recipe.id}-${mealType}`}>
                        <div className={styles.recipeButton}>
                          <div className={styles.recipeTop}>
                            <div className={styles.recipeHeading}>
                              <h3>{preference.recipe.name}</h3>
                              <div className={styles.recipeSummaryRow}>
                                <span className={styles.summaryPill}>
                                  App-Vorschlag: {preference.defaultEnabled ? "ja" : "nein"}
                                </span>
                                <span className={styles.summaryPill}>
                                  {formatMealType(preference.recipe.mealType)}
                                </span>
                                <span className={styles.summaryPill}>
                                  {formatGrams(preference.recipe.proteinG)} Protein
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className={styles.mealLinks}>
                            <label>
                              <input
                                checked={preference.enabledForPlanning}
                                onChange={(event) =>
                                  void updatePreference(preference, {
                                    enabledForPlanning: event.currentTarget.checked,
                                  })
                                }
                                type="checkbox"
                              />{" "}
                              für Planung zulassen
                            </label>
                            <label>
                              Gewichtung
                              <select
                                disabled={!preference.enabledForPlanning}
                                onChange={(event) =>
                                  void updatePreference(preference, {
                                    frequencyWeight: event.currentTarget.value as FrequencyWeight,
                                  })
                                }
                                value={preference.frequencyWeight}
                              >
                                {Object.entries(frequencyLabels).map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      ) : null}

      <section className={styles.groupStack}>
        {groupedRecipes.map((group) => (
          <article
            className={`${styles.groupCard} ${openLibraryMealTypes.includes(group.mealType) ? styles.groupCardExpanded : ""}`}
            key={`library-${group.mealType}`}
          >
            <button
              aria-controls={`library-${group.mealType}`}
              aria-expanded={openLibraryMealTypes.includes(group.mealType)}
              className={styles.groupButton}
              onClick={() =>
                setOpenLibraryMealTypes((current) => toggleMealType(current, group.mealType))
              }
              type="button"
            >
              <div>
                <p className={styles.sectionKicker}>{group.recipes.length} Rezepte</p>
                <h2>{formatMealType(group.mealType)} in der Bibliothek</h2>
              </div>
              <span className={styles.groupButtonMeta}>
                <span className={styles.groupAction}>
                  {openLibraryMealTypes.includes(group.mealType) ? "zuklappen" : "aufklappen"}
                </span>
                <span className={styles.toggleIcon}>
                  {openLibraryMealTypes.includes(group.mealType) ? "-" : "+"}
                </span>
              </span>
            </button>

            {openLibraryMealTypes.includes(group.mealType) ? (
              <div className={styles.recipeGrid} id={`library-${group.mealType}`}>
                {group.recipes.map((recipe) => {
                  const isOpen = openRecipeId === recipe.id;

                  return (
                    <article className={`${styles.recipeCard} ${isOpen ? styles.recipeCardExpanded : ""}`} key={recipe.id}>
                      <button
                        aria-expanded={isOpen}
                        className={styles.recipeButton}
                        onClick={() => setOpenRecipeId(isOpen ? null : recipe.id)}
                        type="button"
                      >
                        <div className={styles.recipeTop}>
                          <div className={styles.recipeHeading}>
                            <h3>{recipe.name}</h3>
                            <div className={styles.recipeSummaryRow}>
                              <span className={styles.summaryPill}>{formatCalories(recipe.calories)}</span>
                              <span className={styles.summaryPill}>{formatGrams(recipe.proteinG)} Protein</span>
                              <span className={styles.summaryPill}>{recipe.prepTimeMinutes} Min.</span>
                            </div>
                          </div>
                          <span className={styles.toggleIcon}>{isOpen ? "-" : "+"}</span>
                        </div>
                      </button>

                      {isOpen ? (
                        <div className={styles.recipeExpandedContent}>
                          <p className={styles.description}>{recipe.description}</p>
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
        ))}
      </section>
    </main>
  );
}
