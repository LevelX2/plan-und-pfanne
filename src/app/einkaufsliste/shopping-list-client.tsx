"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./shopping.module.css";
import { formatShoppingListQuantity } from "@/lib/format";
import { loadOfflineSnapshot, saveOfflineSnapshot } from "@/lib/offline-store";
import type { WeekPlan } from "@/lib/types";
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

type ShoppingListClientProps = {
  weekPlan: WeekPlan;
};

type ShoppingSnapshot = {
  checkedIds: string[];
  savedAt: string;
};

function itemId(category: string, name: string, unit: string) {
  return `${category}::${name}::${unit}`;
}

export function ShoppingListClient({ weekPlan }: ShoppingListClientProps) {
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
  const checksStorageKey = createShoppingChecksStorageKey({
    startDate: weekPlan.startDate,
    mode: shoppingMode,
    planSignature,
    selectedMealKeys,
  });

  useEffect(() => {
    let cancelled = false;
    selectionHydratedRef.current = false;

    void loadOfflineSnapshot<WeekSelectionSnapshot>(createWeekSelectionStorageKey(weekPlan.startDate))
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

    void saveOfflineSnapshot(createWeekSelectionStorageKey(weekPlan.startDate), selectionSnapshot).catch(
      (error) => {
        console.error("Aktive Gerichte konnten nicht gespeichert werden.", error);
      },
    );
  }, [planSignature, selectedMealKeys, shoppingMode, weekPlan.startDate]);

  useEffect(() => {
    let cancelled = false;
    checksHydratedRef.current = false;

    const allowedIds = new Set(allItemIds);

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
  }, [allItemIds, checksStorageKey]);

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
          <p className={styles.contextMeta}>
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
