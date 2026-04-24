"use client";

import Image from "next/image";
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
  createUserScopedStorageKey,
  LOCAL_PWA_STORAGE_NAMESPACE,
} from "@/lib/user-storage";
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
import type { Recipe, RecipeMixCategory, UserSettings, WeekPlan } from "@/lib/types";
import * as localStore from "@/lib/local-store";

function normalizeBasePath(value: string | undefined) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return "";
  }

  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

const DASHBOARD_BRAND_SRC = `${normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH)}/brand-mark-dashboard.png`;

type RecipeCounts = {
  breakfast: number;
  lunch: number;
  dinner: number;
  snack: number;
};

type RecipeMixPoolStats = {
  total: number;
  counts: Record<RecipeMixCategory, number>;
};

type HomeSnapshot = {
  settings: UserSettings;
  weekPlan: WeekPlan;
  recipeCounts: RecipeCounts;
  recipeMixPool: RecipeMixPoolStats | null;
  rawSettings: unknown;
  rawWeekPlan: unknown;
  rawRecipeMixPool: unknown;
  loadedAt: string;
};

type LocalStatusEntry = {
  label: string;
  value: string;
  hint?: string;
};

type DayActivationStatus = {
  className: string;
  countLabel: string;
  summaryLabel: string | null;
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

function resolveDayActivationStatus(selectedMealCount: number, totalMealCount: number): DayActivationStatus {
  const normalizedTotalMealCount = Math.max(totalMealCount, 0);
  const normalizedSelectedMealCount = Math.max(
    0,
    Math.min(selectedMealCount, normalizedTotalMealCount),
  );

  if (normalizedTotalMealCount === 0 || normalizedSelectedMealCount === 0) {
    return {
      className: styles.statusIdle,
      countLabel: `0 von ${normalizedTotalMealCount} aktiv`,
      summaryLabel: null,
    };
  }

  if (normalizedSelectedMealCount === normalizedTotalMealCount) {
    return {
      className: styles.statusGood,
      countLabel: `${normalizedSelectedMealCount} von ${normalizedTotalMealCount} aktiv`,
      summaryLabel: "aktiv geplant",
    };
  }

  return {
    className: styles.statusWarn,
    countLabel: `${normalizedSelectedMealCount} von ${normalizedTotalMealCount} aktiv`,
    summaryLabel: "teilweise aktiv",
  };
}

function formatSavedAt(isoString: string) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoString));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNestedRecord(value: unknown, keys: string[]) {
  if (!isRecord(value)) {
    return null;
  }

  for (const key of keys) {
    const candidate = value[key];
    if (isRecord(candidate)) {
      return candidate;
    }
  }

  return null;
}

function isWeekPlan(value: unknown): value is WeekPlan {
  return (
    isRecord(value) &&
    typeof value.startDate === "string" &&
    typeof value.endDate === "string" &&
    typeof value.generatedAt === "string" &&
    Array.isArray(value.days)
  );
}

function isUserSettings(value: unknown): value is UserSettings {
  return (
    isRecord(value) &&
    typeof value.calorieTarget === "number" &&
    typeof value.macroProteinPct === "number" &&
    typeof value.macroCarbsPct === "number" &&
    typeof value.macroFatPct === "number" &&
    typeof value.mealsPerDay === "number" &&
    Array.isArray(value.excludedIngredients)
  );
}

function isRecipe(value: unknown): value is Recipe {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.mealType === "string"
  );
}

function isRecipeMixPoolStats(value: unknown): value is RecipeMixPoolStats {
  if (!isRecord(value) || typeof value.total !== "number") {
    return false;
  }

  const counts = value.counts;
  return (
    isRecord(counts) &&
    typeof counts.vegetarian === "number" &&
    typeof counts.fish === "number" &&
    typeof counts.meat === "number"
  );
}

function unwrapSettings(value: unknown) {
  if (isUserSettings(value)) {
    return value;
  }

  const nested = readNestedRecord(value, ["settings", "data"]);
  return isUserSettings(nested) ? nested : null;
}

function unwrapWeekPlan(value: unknown) {
  if (isWeekPlan(value)) {
    return value;
  }

  const nested = readNestedRecord(value, ["weekPlan", "plan", "data"]);
  return isWeekPlan(nested) ? nested : null;
}

function unwrapRecipes(value: unknown): Recipe[] | null {
  if (Array.isArray(value) && value.every(isRecipe)) {
    return value;
  }

  if (!isRecord(value)) {
    return null;
  }

  const candidate = value.recipes;
  return Array.isArray(candidate) && candidate.every(isRecipe) ? candidate : null;
}

function unwrapRecipeMixPool(value: unknown) {
  if (isRecipeMixPoolStats(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return null;
  }

  const nested = value.recipeMixPool ?? value.mixPool ?? value.data;
  return isRecipeMixPoolStats(nested) ? nested : null;
}

function createRecipeCounts(recipes: Recipe[]): RecipeCounts {
  return {
    breakfast: recipes.filter((recipe) => recipe.mealType === "breakfast").length,
    lunch: recipes.filter((recipe) => recipe.mealType === "lunch").length,
    dinner: recipes.filter((recipe) => recipe.mealType === "dinner").length,
    snack: recipes.filter((recipe) => recipe.mealType === "snack").length,
  };
}

function resolveLocalStoreFunction<TArgs extends unknown[], TResult>(names: string[]) {
  const record = localStore as Record<string, unknown>;

  for (const name of names) {
    const candidate = record[name];
    if (typeof candidate === "function") {
      return candidate as (...args: TArgs) => Promise<TResult>;
    }
  }

  throw new Error(`Der App-Speicher unterstützt ${names.join(" / ")} noch nicht.`);
}

function ensureLocalAppData() {
  return resolveLocalStoreFunction<[], unknown>(["ensureLocalAppData", "initLocalAppData"])();
}

function getLocalSettings() {
  return resolveLocalStoreFunction<[], unknown>(["getLocalSettings", "loadLocalSettings"])();
}

function getCurrentLocalWeekPlan() {
  return resolveLocalStoreFunction<[], unknown>([
    "getCurrentLocalWeekPlan",
    "loadCurrentLocalWeekPlan",
  ])();
}

function listLocalRecipes() {
  return resolveLocalStoreFunction<[], unknown>(["listLocalRecipes", "getLocalRecipes"])();
}

async function getLocalRecipeMixPoolStats() {
  try {
    return await resolveLocalStoreFunction<[], unknown>([
      "getLocalRecipeMixPoolStats",
      "getRecipeMixPoolStats",
      "getLocalRecipePoolStats",
    ])();
  } catch (error) {
    if (error instanceof Error && error.message.includes("Lokaler Store unterstützt")) {
      return null;
    }

    throw error;
  }
}

function extractTimestamp(value: unknown, keys: string[]) {
  if (!isRecord(value)) {
    return null;
  }

  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === "string" && !Number.isNaN(Date.parse(candidate))) {
      return candidate;
    }
  }

  return null;
}

function buildStatusEntries(snapshot: HomeSnapshot): LocalStatusEntry[] {
  const entries: LocalStatusEntry[] = [
    {
      label: "Woche erstellt",
      value: formatSavedAt(snapshot.weekPlan.generatedAt),
      hint: "Dieser Stand stammt direkt aus dem Gerätespeicher.",
    },
    {
      label: "Zuletzt geladen",
      value: formatSavedAt(snapshot.loadedAt),
      hint: "Dashboard und Einstellungen wurden aus dem Gerätespeicher geladen.",
    },
  ];

  const settingsSavedAt = extractTimestamp(snapshot.rawSettings, [
    "savedAt",
    "updatedAt",
    "lastSavedAt",
  ]);
  if (settingsSavedAt) {
    entries.push({
      label: "Einstellungen gespeichert",
      value: formatSavedAt(settingsSavedAt),
    });
  }

  const importTimestamp = extractTimestamp(snapshot.rawRecipeMixPool, [
    "lastImportAt",
    "lastImportedAt",
    "importedAt",
    "fetchedAt",
  ]);
  if (importTimestamp) {
    entries.push({
      label: "Rezeptbestand ergänzt",
      value: formatSavedAt(importTimestamp),
      hint: "Nur sichtbar, wenn ein Importzeitpunkt vorliegt.",
    });
  }

  if (snapshot.recipeMixPool) {
    entries.push({
      label: "Mix-gesteuerter Pool",
      value: `${snapshot.recipeMixPool.total} Rezepte`,
      hint:
        `${snapshot.recipeMixPool.counts.vegetarian} vegetarisch, ` +
        `${snapshot.recipeMixPool.counts.fish} Fisch, ${snapshot.recipeMixPool.counts.meat} Fleisch`,
    });
  }

  return entries;
}

async function loadHomeSnapshot() {
  await ensureLocalAppData();

  const [rawSettings, rawWeekPlan, rawRecipes, rawRecipeMixPool] = await Promise.all([
    getLocalSettings(),
    getCurrentLocalWeekPlan(),
    listLocalRecipes(),
    getLocalRecipeMixPoolStats(),
  ]);

  const settings = unwrapSettings(rawSettings);
  if (!settings) {
    throw new Error("Die Einstellungen konnten nicht geladen werden.");
  }

  const weekPlan = unwrapWeekPlan(rawWeekPlan);
  if (!weekPlan) {
    throw new Error("Der Wochenplan konnte nicht geladen werden.");
  }

  const recipes = unwrapRecipes(rawRecipes);
  if (!recipes) {
    throw new Error("Der Rezeptbestand konnte nicht gelesen werden.");
  }

  return {
    settings,
    weekPlan,
    recipeCounts: createRecipeCounts(recipes),
    recipeMixPool: unwrapRecipeMixPool(rawRecipeMixPool),
    rawSettings,
    rawWeekPlan,
    rawRecipeMixPool,
    loadedAt: new Date().toISOString(),
  } satisfies HomeSnapshot;
}

function LocalNav() {
  return (
    <nav className={styles.topNav}>
      <Link aria-current="page" href="/">
        Dashboard
      </Link>
      <Link href="/rezepte">Rezepte</Link>
      <Link href="/einkaufsliste">Einkaufsliste</Link>
      <Link href="/einstellungen">Einstellungen</Link>
    </nav>
  );
}

export function HomeClient() {
  const [snapshot, setSnapshot] = useState<HomeSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isIntroExpanded, setIsIntroExpanded] = useState(false);
  const [selectedMealKeys, setSelectedMealKeys] = useState<string[]>([]);
  const [shoppingMode, setShoppingMode] = useState<ShoppingListMode>("active-only");
  const selectionHydratedRef = useRef(false);
  const storageNamespace = LOCAL_PWA_STORAGE_NAMESPACE;

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

    void loadHomeSnapshot()
      .then((nextSnapshot) => {
        if (cancelled) {
          return;
        }

        setSnapshot(nextSnapshot);
        setLoadError(null);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Das Dashboard konnte nicht geladen werden.";
        setLoadError(message);
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

  async function refreshHomeSnapshot() {
    const nextSnapshot = await loadHomeSnapshot();
    setSnapshot(nextSnapshot);
    setLoadError(null);
  }
  const settings = snapshot?.settings ?? null;
  const weekPlan = snapshot?.weekPlan ?? null;
  const recipeCounts = snapshot?.recipeCounts ?? null;
  const recipeMixPool = snapshot?.recipeMixPool ?? null;
  const loadedAt = snapshot?.loadedAt ?? null;
  const planSignature = weekPlan ? createWeekPlanSignature(weekPlan) : "";
  const allMealKeys = weekPlan ? listWeekMealKeys(weekPlan) : [];
  const selectedMealKeySet = new Set(selectedMealKeys);
  const uniqueSelectedMealKeys = [...selectedMealKeySet];
  const allShoppingItemCount = weekPlan
    ? countShoppingItems(buildShoppingListGroupsForWeekPlan(weekPlan, "all-planned", []))
    : 0;
  const activeShoppingItemCount = weekPlan
    ? countShoppingItems(
        buildShoppingListGroupsForWeekPlan(weekPlan, "active-only", uniqueSelectedMealKeys),
      )
    : 0;
  const totalMealCount = allMealKeys.length;
  const selectedMealCount = selectedMealKeySet.size;
  const bestDay = weekPlan
    ? [...weekPlan.days].sort((left, right) => left.score - right.score)[0] ?? null
    : null;
  const statusEntries = snapshot ? buildStatusEntries(snapshot) : [];

  useEffect(() => {
    if (!weekPlan) {
      selectionHydratedRef.current = false;
      return;
    }

    let cancelled = false;
    selectionHydratedRef.current = false;

    void loadOfflineSnapshot<WeekSelectionSnapshot>(
      createWeekSelectionStorageKey(storageNamespace, weekPlan.startDate),
    )
      .then((storedSnapshot) => {
        if (cancelled) {
          return;
        }

        if (storedSnapshot?.planSignature === planSignature) {
          setSelectedMealKeys(normalizeSelectedMealKeys(weekPlan, storedSnapshot.selectedMealKeys));
          setShoppingMode(storedSnapshot.shoppingMode);
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
  }, [planSignature, storageNamespace, weekPlan, weekPlan?.startDate]);

  useEffect(() => {
    if (!weekPlan || !selectionHydratedRef.current) {
      return;
    }

    const normalizedSelectedMealKeys = [...new Set(selectedMealKeys)];
    const selectionSnapshot: WeekSelectionSnapshot = {
      planSignature,
      selectedMealKeys: normalizedSelectedMealKeys,
      shoppingMode,
      savedAt: new Date().toISOString(),
    };

    void saveOfflineSnapshot(
      createWeekSelectionStorageKey(storageNamespace, weekPlan.startDate),
        selectionSnapshot,
    ).catch((error) => {
      console.error("Aktive Gerichte konnten nicht gespeichert werden.", error);
    });
  }, [planSignature, selectedMealKeys, shoppingMode, storageNamespace, weekPlan, weekPlan?.startDate]);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    void saveOfflineSnapshot(
      createUserScopedStorageKey(storageNamespace, "home-snapshot-v3"),
      snapshot,
    ).catch((error) => {
      console.error("Das Dashboard konnte nicht zwischengespeichert werden.", error);
    });
  }, [snapshot, storageNamespace]);

  if (isLoading && !snapshot) {
    return (
      <main className={styles.page}>
        <LocalNav />
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Plan und Pfanne</p>
            <h1>Dein Dashboard wird vorbereitet.</h1>
            <p className={styles.lead}>
              Einstellungen, Wochenplan und Rezeptbestand werden aus dem Gerätespeicher geladen.
            </p>
          </div>

          <div className={styles.heroPanel}>
            <p className={styles.panelLabel}>App-Start</p>
            <h2>Daten auf diesem Gerät vorbereiten</h2>
            <p className={styles.panelCopy}>
              Die App füllt den Startbestand und bereitet die aktuelle Woche für die erste Nutzung
              vor.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!snapshot || !settings || !weekPlan || !recipeCounts || !loadedAt) {
    return (
      <main className={styles.page}>
        <LocalNav />
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Plan und Pfanne</p>
            <h1>Das Dashboard konnte nicht geladen werden.</h1>
            <p className={styles.lead}>
              {loadError ?? "Bitte prüfe den App-Speicher oder initialisiere die App-Daten erneut."}
            </p>
          </div>

          <div className={styles.heroPanel}>
            <p className={styles.panelLabel}>Status</p>
            <h2>Start fehlgeschlagen</h2>
            <p className={styles.panelCopy}>
              Ohne gespeicherte Daten kann die App keinen Wochenplan anzeigen.
            </p>
          </div>
        </section>
      </main>
    );
  }

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
      <LocalNav />

      <section className={styles.hero}>
        <div className={`${styles.heroText} ${!isIntroExpanded ? styles.heroTextCollapsed : ""}`}>
          <div className={styles.heroTitleRow}>
            <Image
              alt="Plan und Pfanne"
              className={styles.heroBrandImage}
              height={420}
              priority
              src={DASHBOARD_BRAND_SRC}
              width={420}
            />
            <h1 className={styles.heroVisuallyHidden}>Plan und Pfanne</h1>
          </div>
          {isIntroExpanded ? (
            <p className={styles.lead}>
              Plan und Pfanne ist deine Koch- und Planungszentrale für den Alltag. Die App speichert
              Wochenplan, aktivierte Gerichte, persönliche Ziele, Einkaufshäkchen und den aktuellen
              Rezeptbestand auf diesem Gerät, damit du auch unterwegs und offline weiterarbeiten
              kannst. Auf der Startseite siehst du auf einen Blick, welche Tage schon aktiv geplant
              sind, wie gut Kalorien und Makros zu deinem Ziel passen und welche Gerichte wirklich
              in die Einkaufsliste einfließen. In der Rezeptübersicht kannst du den Bestand kompakt
              durchsuchen und einzelne Gerichte nur dann aufklappen, wenn du Zutaten oder
              Zubereitung brauchst. Die Einkaufsliste konzentriert sich anschließend wahlweise nur
              auf deine aktiven Gerichte oder auf die komplette Woche, damit du beim Einkaufen und
              Kochen genau den Ausschnitt vor dir hast, der gerade sinnvoll ist. Weitere Rezepte
              kannst du später per Import oder über eine Quelle ergänzen.
            </p>
          ) : null}
          <button
            aria-expanded={isIntroExpanded}
            className={styles.heroToggleButton}
            onClick={() => setIsIntroExpanded((current) => !current)}
            type="button"
          >
            {isIntroExpanded ? "Weniger anzeigen" : "Mehr zur App"}
          </button>
        </div>

        <div className={styles.heroPanel}>
          <p className={styles.panelLabel}>Aktive Woche</p>
          <h2>{formatDateRange(weekPlan.startDate, weekPlan.endDate)}</h2>
          <p className={styles.panelCopy}>
            {describeMealPlanMode(settings.mealsPerDay)} bei {formatCalories(settings.calorieTarget)}{" "}
            und Makroziel {settings.macroProteinPct}/{settings.macroCarbsPct}/{settings.macroFatPct}.
            {" "}Mix: {settings.vegetarianSharePct}/{settings.fishSharePct}/{settings.meatSharePct}.
          </p>
          <p className={styles.panelLabel}>
            Zuletzt neu geplant: {formatSavedAt(weekPlan.generatedAt)}
          </p>

          <div className={styles.heroActions}>
            <div className={styles.actionRow}>
              <RegenerateWeekForm
                buttonClassName={styles.primaryButton}
                errorMessageClassName={styles.actionFeedbackError}
                idleLabel="Woche neu planen"
                layoutClassName={styles.regenerateAction}
                onSuccess={refreshHomeSnapshot}
                pendingLabel="Plant Woche neu ..."
                successMessageClassName={styles.actionFeedbackSuccess}
              />
              <Link className={styles.secondaryButton} href="/rezepte">
                Rezeptdatenbank öffnen
              </Link>
            </div>
            <div className={styles.inlineMeta}>
              <span>{weekPlan.days.length} Tage geplant</span>
              <span>{allShoppingItemCount} Einkaufspositionen gesamt</span>
              <span>
                {recipeMixPool ? `${recipeMixPool.total} Mix-Rezepte steuerbar` : "Rezeptpool aktiv"}
              </span>
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
          <p className={styles.sectionKicker}>Speicherung und Verbindung</p>
          <h2>{isOffline ? "Offline weiterplanen" : "Auf diesem Gerät gespeichert"}</h2>
          <p className={styles.offlineCopy}>
            {isOffline
              ? "Wochenplan, aktive Gerichte, Einkaufshäkchen und Einstellungen bleiben auch ohne Verbindung nutzbar. Nur Rezeptimporte oder neue App-Versionen warten auf später."
              : "Die App speichert Wochenplan, Einstellungen und Einkaufshäkchen auf diesem Gerät. Solange du online bist, kannst du zusätzlich neue Rezeptquellen abrufen oder eine frisch veröffentlichte Version übernehmen."}
          </p>
        </div>
        <div className={styles.offlineMeta}>
          <span className={isOffline ? styles.statusWarn : styles.statusGood}>
            {isOffline ? "offline nutzbar" : "bereit und auf diesem Gerät gespeichert"}
          </span>
          <p>Zuletzt neu geplant: {formatSavedAt(weekPlan.generatedAt)}</p>
          <p>Zuletzt auf diesem Gerät geladen: {formatSavedAt(loadedAt)}</p>
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
          <strong>{bestDay?.weekdayLabel ?? "Aktuelle Woche"}</strong>
          <span>{bestDay ? qualityLabel(bestDay.score) : "noch in Arbeit"}</span>
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
                Jede Karte zeigt Tagessumme, Makroabweichung und die geplanten Mahlzeiten aus dem
                aktuellen Wochenplan. Aktiviere hier die Gerichte, die du wirklich kochen möchtest.
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
                <Link className={styles.selectionLinkButton} href="/einkaufsliste">
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
                const selectedDayMealCount = dayMealKeys.filter((mealKey) =>
                  selectedMealKeySet.has(mealKey),
                ).length;
                const dayActivationStatus = resolveDayActivationStatus(
                  selectedDayMealCount,
                  dayMealKeys.length,
                );

                return (
                  <article className={styles.dayCard} key={day.date}>
                    <div className={styles.dayTop}>
                      <div>
                        <h3>{day.weekdayLabel}</h3>
                        <p>{formatDateGerman(day.date)}</p>
                      </div>
                      <div className={styles.dayStatusGroup}>
                        {dayActivationStatus.summaryLabel ? (
                          <span className={dayActivationStatus.className}>
                            {dayActivationStatus.summaryLabel}
                          </span>
                        ) : null}
                        <span className={styles.statusCount}>{dayActivationStatus.countLabel}</span>
                      </div>
                    </div>

                    <div className={styles.dayTotals}>
                      <div className={styles.dayTotalCard}>
                        <span>Kalorien</span>
                        <strong>{formatCalories(day.totals.calories)}</strong>
                      </div>
                      <div className={styles.dayTotalCard}>
                        <span>Protein</span>
                        <strong>{formatGrams(day.totals.protein)}</strong>
                      </div>
                      <div className={styles.dayTotalCard}>
                        <span>Kohlenhydrate</span>
                        <strong>{formatGrams(day.totals.carbs)}</strong>
                      </div>
                      <div className={styles.dayTotalCard}>
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
                        );
                      })}
                    </ul>

                    <Link
                      className={styles.textLink}
                      href={`/tage?date=${encodeURIComponent(day.date)}`}
                    >
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
            <p className={styles.sectionKicker}>Verlauf</p>
            <h2>Was auf diesem Gerät zuletzt passiert ist</h2>
            <ul className={styles.todoList}>
              {statusEntries.map((entry) => (
                <li key={entry.label}>
                  <strong>{entry.label}: </strong>
                  {entry.value}
                  {entry.hint ? ` - ${entry.hint}` : ""}
                </li>
              ))}
            </ul>
          </article>

          <article className={styles.sectionCard}>
            <p className={styles.sectionKicker}>Auf diesem Gerät</p>
            <h2>Was die App schon direkt speichert</h2>
            <ul className={styles.todoList}>
              <li>Wochenplan mit Tageskarten, Mahlzeiten und Tagessummen</li>
              <li>Aktive Gerichte, Planungsprofil und Einkaufshäkchen bleiben auf diesem Gerät erhalten</li>
              <li>Woche jederzeit neu planen und sofort weiterverwenden</li>
              <li>Rezeptbibliothek mit Zutaten, Zubereitung und aufklappbaren Details</li>
              <li>Als nächster Schritt: weitere Rezepte per Import oder Quelle ergänzen</li>
            </ul>
          </article>

          {loadError ? (
            <article className={styles.sectionCard}>
              <p className={styles.sectionKicker}>Hinweis</p>
              <h2>Letzter Ladehinweis</h2>
              <p className={styles.offlineCopy}>{loadError}</p>
            </article>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
