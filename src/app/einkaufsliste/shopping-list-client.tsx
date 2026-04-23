"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppNav } from "@/app/app-nav";
import { formatDateRange, formatShoppingListQuantity } from "@/lib/format";
import { loadOfflineSnapshot, saveOfflineSnapshot } from "@/lib/offline-store";
import type { WeekPlan } from "@/lib/types";
import { LOCAL_PWA_STORAGE_NAMESPACE } from "@/lib/user-storage";
import {
  buildShoppingListGroupsForWeekPlan,
  countShoppingItems,
  createShoppingChecksStorageKey,
  createWeekPlanSignature,
  createWeekSelectionStorageKey,
  listWeekMealKeys,
  normalizeSelectedMealKeys,
  type ShoppingListMode,
  type WeekSelectionSnapshot,
} from "@/lib/week-plan-selection";
import styles from "./shopping.module.css";

type LocalStoreApi = {
  ensureLocalAppData?: () => Promise<unknown>;
  getCurrentLocalWeekPlan?: () => Promise<WeekPlan | null>;
};

type ShoppingSnapshot = {
  checkedIds: string[];
  savedAt: string;
};

function itemId(category: string, name: string, unit: string) {
  return `${category}::${name}::${unit}`;
}

async function loadCurrentWeekPlanFromLocalStore() {
  const api = (await import("@/lib/local-store")) as LocalStoreApi;

  if (typeof api.ensureLocalAppData === "function") {
    await api.ensureLocalAppData();
  }

  if (typeof api.getCurrentLocalWeekPlan !== "function") {
    throw new Error("Der lokale Wochenplan ist noch nicht verfügbar.");
  }

  return api.getCurrentLocalWeekPlan();
}

function ShoppingListContent({ weekPlan }: { weekPlan: WeekPlan }) {
  const [selectedMealKeys, setSelectedMealKeys] = useState<string[]>([]);
  const [shoppingMode, setShoppingMode] = useState<ShoppingListMode>("active-only");
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const selectionHydratedRef = useRef(false);
  const checksHydratedRef = useRef(false);
  const planSignature = createWeekPlanSignature(weekPlan);
  const totalPlannedMeals = listWeekMealKeys(weekPlan).length;
  const groups = buildShoppingListGroupsForWeekPlan(weekPlan, shoppingMode, selectedMealKeys);
  const allItemIds = groups.flatMap((group) =>
    group.items.map((item) => itemId(group.category, item.name, item.unit)),
  );
  const allItemIdsSnapshot = JSON.stringify(allItemIds);
  const checksStorageKey = createShoppingChecksStorageKey({
    storageNamespace: LOCAL_PWA_STORAGE_NAMESPACE,
    startDate: weekPlan.startDate,
    mode: shoppingMode,
    planSignature,
    selectedMealKeys,
  });

  useEffect(() => {
    let cancelled = false;
    selectionHydratedRef.current = false;

    void loadOfflineSnapshot<WeekSelectionSnapshot>(
      createWeekSelectionStorageKey(LOCAL_PWA_STORAGE_NAMESPACE, weekPlan.startDate),
    )
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

    void saveOfflineSnapshot(
      createWeekSelectionStorageKey(LOCAL_PWA_STORAGE_NAMESPACE, weekPlan.startDate),
      selectionSnapshot,
    ).catch((error) => {
      console.error("Aktive Gerichte konnten nicht gespeichert werden.", error);
    });
  }, [planSignature, selectedMealKeys, shoppingMode, weekPlan.startDate]);

  useEffect(() => {
    let cancelled = false;
    checksHydratedRef.current = false;

    const allowedIds = new Set(JSON.parse(allItemIdsSnapshot) as string[]);

    void loadOfflineSnapshot<ShoppingSnapshot>(checksStorageKey)
      .then((snapshot) => {
        const nextCheckedIds = snapshot?.checkedIds?.filter((id) => allowedIds.has(id)) ?? [];

        const frame = window.requestAnimationFrame(() => {
          if (cancelled) {
            return;
          }

          checksHydratedRef.current = true;
          setCheckedIds(nextCheckedIds);
        });

        return () => {
          window.cancelAnimationFrame(frame);
        };
      })
      .catch(() => {
        const frame = window.requestAnimationFrame(() => {
          if (cancelled) {
            return;
          }

          checksHydratedRef.current = true;
          setCheckedIds([]);
        });

        return () => {
          window.cancelAnimationFrame(frame);
        };
      });

    return () => {
      cancelled = true;
    };
  }, [allItemIdsSnapshot, checksStorageKey]);

  useEffect(() => {
    if (!checksHydratedRef.current) {
      return;
    }

    const snapshot: ShoppingSnapshot = {
      checkedIds,
      savedAt: new Date().toISOString(),
    };

    void saveOfflineSnapshot(checksStorageKey, snapshot).catch((error) => {
      console.error("Einkaufsliste konnte nicht offline gespeichert werden.", error);
    });
  }, [checkedIds, checksStorageKey]);

  function toggleItem(id: string) {
    setCheckedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  function clearChecks() {
    setCheckedIds([]);
  }

  const checkedCount = checkedIds.length;
  const totalCount = allItemIds.length;
  const percent = totalCount === 0 ? 0 : Math.round((checkedCount / totalCount) * 100);
  const selectedMealCount = selectedMealKeys.length;
  const isActiveOnlyMode = shoppingMode === "active-only";
  const isEmptyActiveSelection = isActiveOnlyMode && selectedMealCount === 0;
  const totalItemsLabel = countShoppingItems(groups);

  return (
    <section className={styles.listSection}>
      <div className={styles.toolbar}>
        <div className={styles.modePanel}>
          <p className={styles.sectionKicker}>Listenmodus</p>
          <div className={styles.modeButtons}>
            <button
              className={`${styles.modeButton} ${
                isActiveOnlyMode ? styles.modeButtonActive : styles.modeButtonInactive
              }`}
              onClick={() => setShoppingMode("active-only")}
              type="button"
            >
              Aktive Gerichte
            </button>
            <button
              className={`${styles.modeButton} ${
                shoppingMode === "all-planned" ? styles.modeButtonActive : styles.modeButtonInactive
              }`}
              onClick={() => setShoppingMode("all-planned")}
              type="button"
            >
              Alle geplanten Gerichte
            </button>
          </div>
          <p className={styles.modeSummary}>
            {selectedMealCount} von {totalPlannedMeals} Gerichten aktiv
          </p>
        </div>

        <div className={styles.progressCard}>
          <p className={styles.sectionKicker}>Einkaufsfortschritt</p>
          <strong>
            {checkedCount} / {totalCount}
          </strong>
          <span>
            {percent} % abgehakt bei {totalItemsLabel} Positionen
          </span>
        </div>

        <button className={styles.clearButton} onClick={clearChecks} type="button">
          Häkchen zurücksetzen
        </button>
      </div>

      {isEmptyActiveSelection ? (
        <section className={styles.emptyState}>
          <p className={styles.sectionKicker}>Noch keine Auswahl</p>
          <h2>Du hast noch keine Gerichte aktiviert.</h2>
          <p>
            Aktiviere zuerst in der Wochenübersicht die Gerichte, die du wirklich kochen möchtest.
            Danach erscheint hier automatisch die passende Einkaufsliste.
          </p>
          <div className={styles.emptyActions}>
            <Link className={styles.emptyLink} href="/">
              Zur Wochenübersicht
            </Link>
            <button
              className={styles.modeButton}
              onClick={() => setShoppingMode("all-planned")}
              type="button"
            >
              Stattdessen komplette Woche anzeigen
            </button>
          </div>
        </section>
      ) : null}

      {groups.length > 0 ? (
        <div className={styles.groupStack}>
          {groups.map((group) => (
            <article className={styles.groupCard} key={group.category}>
              <div className={styles.groupHeader}>
                <div>
                  <p className={styles.sectionKicker}>Kategorie</p>
                  <h2>{group.category}</h2>
                </div>
                <span>{group.items.length} Positionen</span>
              </div>

              <ul className={styles.itemList}>
                {group.items.map((item) => {
                  const id = itemId(group.category, item.name, item.unit);
                  const checked = checkedIds.includes(id);

                  return (
                    <li className={checked ? styles.itemChecked : styles.itemRow} key={id}>
                      <label className={styles.checkboxLabel}>
                        <input
                          checked={checked}
                          onChange={() => toggleItem(id)}
                          type="checkbox"
                        />
                        <span className={styles.fakeCheckbox} />
                        <span className={styles.itemText}>
                          <strong>{item.name}</strong>
                          <small>{formatShoppingListQuantity(item.totalAmount, item.unit)}</small>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function ShoppingListClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWeekPlan() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const nextWeekPlan = await loadCurrentWeekPlanFromLocalStore();

        if (cancelled) {
          return;
        }

        setWeekPlan(nextWeekPlan);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Die lokale Einkaufsliste konnte nicht geladen werden.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadWeekPlan();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalMeals = weekPlan?.days.reduce((sum, day) => sum + day.meals.length, 0) ?? 0;

  return (
    <main className={styles.page}>
      <AppNav currentPath="/einkaufsliste" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Mobile Einkaufsliste</p>
          <h1>Deine Woche ist lokal als Einkaufsliste bereit.</h1>
          <p className={styles.lead}>
            Öffne diese Seite auf dem Handy und hake die Zutaten direkt beim Einkaufen ab. Der
            Fortschritt bleibt zusammen mit deiner aktiven Auswahl nur auf diesem Gerät gespeichert.
          </p>
        </div>

        <div className={styles.heroStat}>
          <span>
            {isLoading ? "Lokale Datenbank wird vorbereitet" : weekPlan ? "Aktive Woche" : "Noch kein Plan"}
          </span>
          <strong>
            {weekPlan ? formatDateRange(weekPlan.startDate, weekPlan.endDate) : "Lokal"}
          </strong>
          <p>
            {weekPlan
              ? `${totalMeals} geplante Gerichte. Wechsle unten zwischen aktivem Kochfokus und kompletter Woche.`
              : "Sobald ein lokaler Wochenplan vorhanden ist, erscheint hier automatisch deine Einkaufsliste."}
          </p>
        </div>
      </section>

      {isLoading ? (
        <section className={styles.listSection}>
          <section className={styles.emptyState}>
            <p className={styles.sectionKicker}>Lokale Initialisierung</p>
            <h2>Die Einkaufsliste wird vorbereitet.</h2>
            <p>
              Beim ersten Start kann die lokale Datenbank kurz befüllt oder auf eine neue Version
              migriert werden.
            </p>
          </section>
        </section>
      ) : null}

      {loadError ? (
        <section className={styles.listSection}>
          <section className={styles.emptyState}>
            <p className={styles.sectionKicker}>Fehler</p>
            <h2>Die Einkaufsliste konnte nicht geladen werden.</h2>
            <p>{loadError}</p>
          </section>
        </section>
      ) : null}

      {!isLoading && !loadError && !weekPlan ? (
        <section className={styles.listSection}>
          <section className={styles.emptyState}>
            <p className={styles.sectionKicker}>Noch kein Wochenplan</p>
            <h2>Es ist noch keine lokale Woche hinterlegt.</h2>
            <p>
              Öffne zuerst das Dashboard oder lass den lokalen Seed-Lauf einen Wochenplan anlegen.
            </p>
          </section>
        </section>
      ) : null}

      {!isLoading && !loadError && weekPlan ? <ShoppingListContent weekPlan={weekPlan} /> : null}
    </main>
  );
}
