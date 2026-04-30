"use client";

import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/app/app-nav";
import { formatCalories, formatGrams, formatMealType, formatShoppingQuantity } from "@/lib/format";
import {
  listLocalRecipeFavorites,
  listLocalRecipeMealTypePreferences,
  listLocalRecipes,
  saveLocalRecipeFavorite,
  saveLocalRecipeMealTypePreference,
} from "@/lib/local-store";
import { renderRecipeInstructionDetails, renderRecipeInstructions } from "@/lib/recipe-instructions";
import type { EffectiveRecipeMealTypePreference, FrequencyWeight, MealType, Recipe } from "@/lib/types";
import styles from "./recipes.module.css";

const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const satisfies MealType[];

const frequencyLabels: Record<FrequencyWeight, string> = {
  rare: "selten",
  normal: "normal",
  often: "häufig",
};

const recipeIntroSeenKey = "plan-und-pfanne:recipe-intro-seen";

type RecipeState = {
  recipes: Recipe[];
  preferences: EffectiveRecipeMealTypePreference[];
  favoriteRecipeIds: string[];
};

type RecipeDetailTab = "preparation" | "ingredients";
type RecipeViewTab = "all" | "favorites";
type RecipeMode = "planning" | "library";

async function loadRecipeState(): Promise<RecipeState> {
  const [recipes, preferences, favoriteRecipeIds] = await Promise.all([
    listLocalRecipes({ applySettings: false }),
    listLocalRecipeMealTypePreferences(),
    listLocalRecipeFavorites(),
  ]);

  return {
    recipes,
    preferences,
    favoriteRecipeIds,
  };
}

export function RecipesClient() {
  const [state, setState] = useState<RecipeState>({ recipes: [], preferences: [], favoriteRecipeIds: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<RecipeViewTab>("all");
  const [activeRecipeMode, setActiveRecipeMode] = useState<RecipeMode>("library");
  const [openRecipeKey, setOpenRecipeKey] = useState<string | null>(null);
  const [recipeDetailTabs, setRecipeDetailTabs] = useState<Record<string, RecipeDetailTab>>({});
  const [openPlanningMealTypes, setOpenPlanningMealTypes] = useState<MealType[]>([]);
  const [openLibraryMealTypes, setOpenLibraryMealTypes] = useState<MealType[]>([]);
  const normalizedSearchQuery = normalizeSearch(searchQuery);
  const favoriteRecipeIdSet = useMemo(() => new Set(state.favoriteRecipeIds), [state.favoriteRecipeIds]);
  const matchingRecipeIds = useMemo(() => {
    if (!normalizedSearchQuery) {
      return new Set(state.recipes.map((recipe) => recipe.id));
    }

    const searchTerms = normalizedSearchQuery.split(" ").filter(Boolean);

    return new Set(
      state.recipes
        .filter((recipe) => recipeMatchesSearch(recipe, searchTerms))
        .map((recipe) => recipe.id),
    );
  }, [normalizedSearchQuery, state.recipes]);
  const filteredRecipes = useMemo(
    () => state.recipes.filter((recipe) => matchingRecipeIds.has(recipe.id)),
    [matchingRecipeIds, state.recipes],
  );
  const groupedRecipes = useMemo(
    () =>
      mealTypes.map((mealType) => ({
        mealType,
        recipes: filteredRecipes.filter((recipe) => recipe.mealType === mealType),
        totalRecipes: state.recipes.filter((recipe) => recipe.mealType === mealType).length,
      })),
    [filteredRecipes, state.recipes],
  );
  const favoriteRecipes = useMemo(
    () => filteredRecipes.filter((recipe) => favoriteRecipeIdSet.has(recipe.id)),
    [favoriteRecipeIdSet, filteredRecipes],
  );
  const hasSearch = normalizedSearchQuery.length > 0;

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

  useEffect(() => {
    let cancelled = false;

    try {
      if (window.localStorage.getItem(recipeIntroSeenKey)) {
        return () => {
          cancelled = true;
        };
      }

      window.localStorage.setItem(recipeIntroSeenKey, "1");
      window.queueMicrotask(() => {
        if (!cancelled) {
          setIsIntroOpen(true);
        }
      });
    } catch {
      // Die Anleitung bleibt im Fallback eingeklappt.
    }

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

  async function toggleFavorite(recipeId: string) {
    const nextIsFavorite = !favoriteRecipeIdSet.has(recipeId);
    await saveLocalRecipeFavorite(recipeId, nextIsFavorite);
    setState((current) => ({
      ...current,
      favoriteRecipeIds: nextIsFavorite
        ? Array.from(new Set([...current.favoriteRecipeIds, recipeId]))
        : current.favoriteRecipeIds.filter((favoriteRecipeId) => favoriteRecipeId !== recipeId),
    }));
  }

  function toggleMealType(mealTypes: MealType[], mealType: MealType) {
    return mealTypes.includes(mealType)
      ? mealTypes.filter((entry) => entry !== mealType)
      : [...mealTypes, mealType];
  }

  function getDetailTab(recipeId: string) {
    return recipeDetailTabs[recipeId] ?? "preparation";
  }

  function setDetailTab(recipeId: string, tab: RecipeDetailTab) {
    setRecipeDetailTabs((current) => ({
      ...current,
      [recipeId]: tab,
    }));
  }

  function toggleRecipeDetails(recipeKey: string, recipeId: string) {
    setOpenRecipeKey((current) => (current === recipeKey ? null : recipeKey));
    setDetailTab(recipeId, "preparation");
  }

  function renderFavoriteButton(recipe: Recipe) {
    const isFavorite = favoriteRecipeIdSet.has(recipe.id);

    return (
      <button
        aria-label={isFavorite ? `${recipe.name} aus Favoriten entfernen` : `${recipe.name} als Favorit markieren`}
        aria-pressed={isFavorite}
        className={isFavorite ? styles.favoriteButtonActive : styles.favoriteButton}
        onClick={(event) => {
          event.stopPropagation();
          void toggleFavorite(recipe.id);
        }}
        title={isFavorite ? "Favorit entfernen" : "Als Favorit markieren"}
        type="button"
      >
        {isFavorite ? "★" : "☆"}
      </button>
    );
  }

  function renderRecipeDetails(recipe: Recipe) {
    const activeTab = getDetailTab(recipe.id);
    const recipeInstructions = renderRecipeInstructionDetails(recipe);

    return (
      <div className={styles.recipeExpandedContent}>
        <p className={styles.description}>{recipe.description}</p>
        <div className={styles.recipeDetailTabs} role="tablist" aria-label={`Rezeptdetails für ${recipe.name}`}>
          <button
            aria-selected={activeTab === "preparation"}
            className={activeTab === "preparation" ? styles.recipeDetailTabActive : styles.recipeDetailTab}
            onClick={() => setDetailTab(recipe.id, "preparation")}
            role="tab"
            type="button"
          >
            Zubereitung
          </button>
          <button
            aria-selected={activeTab === "ingredients"}
            className={activeTab === "ingredients" ? styles.recipeDetailTabActive : styles.recipeDetailTab}
            onClick={() => setDetailTab(recipe.id, "ingredients")}
            role="tab"
            type="button"
          >
            Zutaten
          </button>
        </div>

        {activeTab === "preparation" ? (
          <div className={styles.recipeDetailColumn}>
            <p className={styles.sectionKicker}>Zubereitung</p>
            <ol className={styles.instructions}>
              {recipeInstructions.map((step, index) => (
                <li key={`${recipe.id}-step-${index + 1}`}>
                  <span className={styles.stepNumber}>{index + 1}</span>
                  <div>
                    <p>{step.text}</p>
                    {step.chips.length > 0 ? (
                      <span className={styles.instructionChips} aria-label="Hinweise zu diesem Schritt">
                        {step.chips.map((chip) => (
                          <span className={styles.instructionChip} key={`${recipe.id}-step-${index + 1}-${chip.kind}-${chip.label}`}>
                            <span aria-hidden="true">{chip.icon}</span>
                            {chip.label}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : (
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
        )}
      </div>
    );
  }

  return (
    <main className={styles.page}>
      <AppNav currentPath="/rezepte" />

      <section className={`${styles.hero} ${isIntroOpen ? styles.heroExpanded : styles.heroCompact}`}>
        {isIntroOpen ? (
          <>
            <div>
              <p className={styles.eyebrow}>Rezeptauswahl</p>
              <h1>Welche Rezepte darf der Generator verwenden?</h1>
              <div className={styles.leadStack} id="recipe-intro-text">
                <p>
                  Hier steuerst Du, welche Rezepte der Generator für Frühstück, Mittagessen,
                  Abendessen und Snacks verwenden darf.
                </p>
                <p>
                  Über die Suche findest Du Rezepte nach Namen, Zutaten oder Zubereitungsschritten.
                  Mit dem Stern sammelst Du Favoriten, und in den Mahlzeitentypen kannst Du festlegen,
                  ob ein Rezept selten, normal oder häufig in die automatische Planung einfließen soll.
                </p>
              </div>
              <button
                aria-controls="recipe-intro-text"
                aria-expanded={isIntroOpen}
                className={styles.introToggle}
                onClick={() => setIsIntroOpen(false)}
                type="button"
              >
                Anleitung einklappen
                <span className={styles.toggleIcon}>-</span>
              </button>
            </div>
            <div className={styles.heroStat}>
              <span>{isLoading ? "wird geladen" : "Rezepte"}</span>
              <strong>{state.recipes.length}</strong>
              <p>gespeicherte glutenfreie Optionen</p>
            </div>
          </>
        ) : (
          <>
            <div className={styles.compactRecipeCount}>
              <span>{isLoading ? "Rezepte werden geladen" : "Rezepte"}</span>
              <strong>{state.recipes.length}</strong>
            </div>
            <button
              aria-controls="recipe-intro-text"
              aria-expanded={isIntroOpen}
              className={styles.introToggle}
              onClick={() => setIsIntroOpen(true)}
              type="button"
            >
              Was kann ich hier machen?
              <span className={styles.toggleIcon}>+</span>
            </button>
            <span className={styles.visuallyHidden} id="recipe-intro-text">
              Anleitung zur Rezeptübersicht
            </span>
          </>
        )}
      </section>

      <section className={styles.searchPanel} aria-label="Rezepte suchen">
        <label htmlFor="recipe-search">
          <span className={styles.sectionKicker}>Suche</span>
          <strong>Rezept oder Zutat finden</strong>
        </label>
        <div className={styles.searchField}>
          <input
            id="recipe-search"
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            placeholder="z. B. Hüttenkäse, Lachs, Bowl oder Frühstück"
            type="search"
            value={searchQuery}
          />
          {searchQuery ? (
            <button onClick={() => setSearchQuery("")} type="button">
              löschen
            </button>
          ) : null}
        </div>
        <p className={styles.searchMeta}>
          {isLoading
            ? "Rezepte werden geladen."
            : `${filteredRecipes.length} von ${state.recipes.length} Rezepten passen zur Suche.`}
        </p>
      </section>

      <section className={styles.viewTabs} aria-label="Rezeptansicht wählen">
        <button
          aria-selected={activeViewTab === "all"}
          className={activeViewTab === "all" ? styles.viewTabActive : styles.viewTab}
          onClick={() => setActiveViewTab("all")}
          role="tab"
          type="button"
        >
          Alle Rezepte
        </button>
        <button
          aria-selected={activeViewTab === "favorites"}
          className={activeViewTab === "favorites" ? styles.viewTabActive : styles.viewTab}
          onClick={() => setActiveViewTab("favorites")}
          role="tab"
          type="button"
        >
          Favoriten
          <span>{state.favoriteRecipeIds.length}</span>
        </button>
      </section>

      {!loadError && activeViewTab === "all" ? (
        <section className={styles.modePanel} aria-label="Rezeptmodus wählen">
          <div>
            <p className={styles.sectionKicker}>Modus</p>
            <h2>{activeRecipeMode === "planning" ? "Planung bearbeiten" : "Rezepte ansehen"}</h2>
            <p>
              {activeRecipeMode === "planning"
                ? "Lege je Mahlzeittyp fest, welche Rezepte der Generator nutzen darf."
                : "Stöbere in der Rezeptbibliothek und öffne Zubereitung oder Zutaten."}
            </p>
          </div>
          <div className={styles.modeTabs} role="tablist" aria-label="Rezeptmodus">
            <button
              aria-selected={activeRecipeMode === "library"}
              className={activeRecipeMode === "library" ? styles.modeTabActive : styles.modeTab}
              onClick={() => setActiveRecipeMode("library")}
              role="tab"
              type="button"
            >
              Rezepte ansehen
            </button>
            <button
              aria-selected={activeRecipeMode === "planning"}
              className={activeRecipeMode === "planning" ? styles.modeTabActive : styles.modeTab}
              onClick={() => setActiveRecipeMode("planning")}
              role="tab"
              type="button"
            >
              Planung bearbeiten
            </button>
          </div>
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

      {!loadError && activeViewTab === "all" && activeRecipeMode === "planning" ? (
        <section className={styles.groupStack}>
          {mealTypes.map((mealType) => {
            const allPreferences = state.preferences.filter((preference) => preference.mealType === mealType);
            const preferences = allPreferences.filter((preference) => matchingRecipeIds.has(preference.recipe.id));
            const enabledCount = preferences.filter((preference) => preference.enabledForPlanning).length;
            const isGroupOpen = openPlanningMealTypes.includes(mealType);
            const showGroupContent = isGroupOpen || hasSearch;
            const groupId = `planning-${mealType}`;

            return (
              <article className={`${styles.groupCard} ${showGroupContent ? styles.groupCardExpanded : ""}`} key={mealType}>
                <button
                  aria-controls={groupId}
                  aria-expanded={showGroupContent}
                  className={styles.groupButton}
                  onClick={() =>
                    setOpenPlanningMealTypes((current) => toggleMealType(current, mealType))
                  }
                  type="button"
                >
                  <div>
                    <p className={styles.sectionKicker}>
                      {hasSearch ? `${preferences.length} Treffer` : `${enabledCount} zugelassen`}
                    </p>
                    <h2>{formatMealType(mealType)}</h2>
                  </div>
                  <span className={styles.groupButtonMeta}>
                    <span>{hasSearch ? `${allPreferences.length} Optionen gesamt` : `${preferences.length} Optionen`}</span>
                    <span className={styles.groupAction}>
                      {hasSearch ? "Treffer sichtbar" : showGroupContent ? "zuklappen" : "aufklappen"}
                    </span>
                    <span className={styles.toggleIcon}>{showGroupContent ? "-" : "+"}</span>
                  </span>
                </button>

                {showGroupContent ? (
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
                            {renderFavoriteButton(preference.recipe)}
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
                          <button
                            aria-expanded={openRecipeKey === `planning-${mealType}-${preference.recipe.id}`}
                            className={styles.recipeDetailTrigger}
                            onClick={() =>
                              toggleRecipeDetails(`planning-${mealType}-${preference.recipe.id}`, preference.recipe.id)
                            }
                            type="button"
                          >
                            {openRecipeKey === `planning-${mealType}-${preference.recipe.id}`
                              ? "Details schließen"
                              : "Zubereitung anzeigen"}
                          </button>
                        </div>
                        {openRecipeKey === `planning-${mealType}-${preference.recipe.id}`
                          ? renderRecipeDetails(preference.recipe)
                          : null}
                      </article>
                    ))}
                    {preferences.length === 0 ? (
                      <p className={styles.emptyState}>Keine passenden Rezepte in diesem Mahlzeitentyp.</p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      ) : null}

      {activeViewTab === "favorites" ? (
        <section className={styles.groupStack}>
          <article className={`${styles.groupCard} ${favoriteRecipes.length > 0 ? styles.groupCardExpanded : ""}`}>
            <div className={styles.groupHeaderRow}>
              <div>
                <p className={styles.sectionKicker}>
                  {hasSearch ? `${favoriteRecipes.length} Treffer` : `${state.favoriteRecipeIds.length} markiert`}
                </p>
                <h2>Favoriten</h2>
              </div>
              <span className={styles.groupAction}>Rezepte sind zunächst eingeklappt</span>
            </div>

            <div className={styles.recipeGrid}>
              {favoriteRecipes.map((recipe) => {
                const recipeKey = `favorite-${recipe.id}`;
                const isOpen = openRecipeKey === recipeKey;

                return (
                  <article className={`${styles.recipeCard} ${isOpen ? styles.recipeCardExpanded : ""}`} key={recipe.id}>
                    <div className={styles.recipeButton}>
                      <div className={styles.recipeTop}>
                        <div className={styles.recipeHeading}>
                          <h3>{recipe.name}</h3>
                          <div className={styles.recipeSummaryRow}>
                            <span className={styles.summaryPill}>{formatMealType(recipe.mealType)}</span>
                            <span className={styles.summaryPill}>{formatCalories(recipe.calories)}</span>
                            <span className={styles.summaryPill}>{formatGrams(recipe.proteinG)} Protein</span>
                          </div>
                        </div>
                        <span className={styles.recipeCardActions}>
                          {renderFavoriteButton(recipe)}
                          <span className={styles.toggleIcon}>{isOpen ? "-" : "+"}</span>
                        </span>
                      </div>
                      <button
                        aria-expanded={isOpen}
                        className={styles.recipeDetailTrigger}
                        onClick={() => toggleRecipeDetails(recipeKey, recipe.id)}
                        type="button"
                      >
                        {isOpen ? "Details schließen" : "Zubereitung anzeigen"}
                      </button>
                    </div>

                    {isOpen ? renderRecipeDetails(recipe) : null}
                  </article>
                );
              })}
              {favoriteRecipes.length === 0 ? (
                <p className={styles.emptyState}>
                  {hasSearch
                    ? "Keine Favoriten passen zur Suche."
                    : "Noch keine Favoriten markiert. Nutze den Stern an einem Rezept."}
                </p>
              ) : null}
            </div>
          </article>
        </section>
      ) : null}

      {activeViewTab === "all" && activeRecipeMode === "library" ? (
      <section className={styles.groupStack}>
        {groupedRecipes.map((group) => {
          const isGroupOpen = openLibraryMealTypes.includes(group.mealType);
          const showGroupContent = isGroupOpen || hasSearch;

          return (
            <article
              className={`${styles.groupCard} ${showGroupContent ? styles.groupCardExpanded : ""}`}
              key={`library-${group.mealType}`}
            >
              <button
                aria-controls={`library-${group.mealType}`}
                aria-expanded={showGroupContent}
                className={styles.groupButton}
                onClick={() =>
                  setOpenLibraryMealTypes((current) => toggleMealType(current, group.mealType))
                }
                type="button"
              >
                <div>
                  <p className={styles.sectionKicker}>
                    {hasSearch ? `${group.recipes.length} Treffer` : `${group.recipes.length} Rezepte`}
                  </p>
                  <h2>{formatMealType(group.mealType)} in der Bibliothek</h2>
                </div>
                <span className={styles.groupButtonMeta}>
                  {hasSearch ? <span>{group.totalRecipes} Rezepte gesamt</span> : null}
                  <span className={styles.groupAction}>
                    {hasSearch ? "Treffer sichtbar" : showGroupContent ? "zuklappen" : "aufklappen"}
                  </span>
                  <span className={styles.toggleIcon}>{showGroupContent ? "-" : "+"}</span>
                </span>
              </button>

              {showGroupContent ? (
                <div className={styles.recipeGrid} id={`library-${group.mealType}`}>
                  {group.recipes.map((recipe) => {
                    const recipeKey = `library-${recipe.id}`;
                    const isOpen = openRecipeKey === recipeKey;

                    return (
                      <article className={`${styles.recipeCard} ${isOpen ? styles.recipeCardExpanded : ""}`} key={recipe.id}>
                        <div className={styles.recipeButton}>
                          <div className={styles.recipeTop}>
                            <div className={styles.recipeHeading}>
                              <h3>{recipe.name}</h3>
                              <div className={styles.recipeSummaryRow}>
                                <span className={styles.summaryPill}>{formatCalories(recipe.calories)}</span>
                                <span className={styles.summaryPill}>{formatGrams(recipe.proteinG)} Protein</span>
                                <span className={styles.summaryPill}>{recipe.prepTimeMinutes} Min.</span>
                              </div>
                            </div>
                            <span className={styles.recipeCardActions}>
                              {renderFavoriteButton(recipe)}
                              <span className={styles.toggleIcon}>{isOpen ? "-" : "+"}</span>
                            </span>
                          </div>
                          <button
                            aria-expanded={isOpen}
                            className={styles.recipeDetailTrigger}
                            onClick={() => toggleRecipeDetails(recipeKey, recipe.id)}
                            type="button"
                          >
                            {isOpen ? "Details schließen" : "Zubereitung anzeigen"}
                          </button>
                        </div>

                        {isOpen ? renderRecipeDetails(recipe) : null}
                      </article>
                    );
                  })}
                  {group.recipes.length === 0 ? (
                    <p className={styles.emptyState}>Keine passenden Rezepte in diesem Mahlzeitentyp.</p>
                  ) : null}
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

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function recipeMatchesSearch(recipe: Recipe, searchTerms: string[]) {
  const searchableText = normalizeSearch(
    [
      recipe.name,
      recipe.description,
      formatMealType(recipe.mealType),
      recipe.proteinSource,
      ...recipe.tags,
      ...recipe.ingredients.flatMap((ingredient) => [ingredient.name, ingredient.category]),
      ...renderRecipeInstructions(recipe),
    ].join(" "),
  );

  return searchTerms.every((term) => searchableText.includes(term));
}
