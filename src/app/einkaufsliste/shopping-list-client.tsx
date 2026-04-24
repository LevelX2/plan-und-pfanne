"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/app/app-nav";
import { DateStepper } from "@/app/date-stepper";
import { formatDateRange, formatShoppingListQuantity } from "@/lib/format";
import {
  getDefaultShoppingEndDate,
  getDefaultShoppingStartDate,
  listLocalPlannedDays,
} from "@/lib/local-store";
import { buildShoppingListGroupsForPlannedDays, countShoppingItems } from "@/lib/week-plan-selection";
import type { DayPlan } from "@/lib/types";
import styles from "./shopping.module.css";

type ShoppingSnapshot = {
  days: DayPlan[];
  loadedAt: string;
};

function itemId(category: string, name: string, unit: string) {
  return `${category}::${name}::${unit}`;
}

export function ShoppingListClient() {
  const [startDate, setStartDate] = useState(getDefaultShoppingStartDate());
  const [endDate, setEndDate] = useState(getDefaultShoppingEndDate());
  const [snapshot, setSnapshot] = useState<ShoppingSnapshot | null>(null);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    setLoadError(null);

    try {
      const days = await listLocalPlannedDays(startDate, endDate);
      setSnapshot({
        days,
        loadedAt: new Date().toISOString(),
      });
      setCheckedIds([]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Die Einkaufsliste konnte nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialShoppingList() {
      try {
        const days = await listLocalPlannedDays(startDate, endDate);
        if (cancelled) {
          return;
        }

        setSnapshot({
          days,
          loadedAt: new Date().toISOString(),
        });
        setCheckedIds([]);
        setLoadError(null);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Die Einkaufsliste konnte nicht geladen werden.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialShoppingList();

    return () => {
      cancelled = true;
    };
  }, [endDate, startDate]);

  const groups = useMemo(
    () => buildShoppingListGroupsForPlannedDays(snapshot?.days ?? []),
    [snapshot],
  );
  const activeMeals = snapshot?.days.flatMap((day) =>
    day.meals.filter((meal) => meal.isEnabled !== false && meal.includeInShoppingList !== false),
  ) ?? [];
  const totalItems = countShoppingItems(groups);
  const allItemIds = groups.flatMap((group) =>
    group.items.map((item) => itemId(group.category, item.name, item.unit)),
  );
  const checkedCount = checkedIds.length;
  const percent = totalItems === 0 ? 0 : Math.round((checkedCount / totalItems) * 100);

  function toggleItem(id: string) {
    setCheckedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  function clearChecks() {
    setCheckedIds([]);
  }

  function updateStartDate(nextStartDate: string) {
    setStartDate(nextStartDate);
    if (endDate < nextStartDate) {
      setEndDate(nextStartDate);
    }
  }

  function updateEndDate(nextEndDate: string) {
    setEndDate(nextEndDate);
  }

  return (
    <main className={styles.page}>
      <AppNav currentPath="/einkaufsliste" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Einkaufsliste</p>
          <h1>Zutaten aus Deinem Datumsbereich.</h1>
          <p className={styles.lead}>
            Die Liste berücksichtigt aktive Mahlzeiten, Personenzahlen, getauschte Gerichte und
            zusätzliche Snacks. Deaktivierte Mahlzeiten und abgewählte Einkaufspositionen bleiben außen vor.
          </p>
        </div>

        <div className={styles.heroStat}>
          <span>{isLoading ? "wird geladen" : "Zeitraum"}</span>
          <strong>{formatDateRange(startDate, endDate)}</strong>
          <p>{activeMeals.length} Mahlzeiten fließen in die Einkaufsliste ein.</p>
        </div>
      </section>

      <section className={styles.listSection}>
        <div className={styles.toolbar}>
          <div className={styles.modePanel}>
            <p className={styles.sectionKicker}>Datumsbereich</p>
            <div className={styles.modeButtons}>
              <DateStepper id="shoppingStart" label="Start" onChange={updateStartDate} value={startDate} />
              <DateStepper id="shoppingEnd" label="Ende" min={startDate} onChange={updateEndDate} value={endDate} />
              <button
                className={`${styles.modeButton} ${styles.modeButtonActive}`}
                onClick={() => void refresh()}
                type="button"
              >
                Liste aktualisieren
              </button>
            </div>
            <p className={styles.modeSummary}>
              {snapshot?.days.length ?? 0} Tage, {activeMeals.length} relevante Mahlzeiten
            </p>
          </div>

          <div className={styles.progressCard}>
            <p className={styles.sectionKicker}>Einkaufsfortschritt</p>
            <strong>
              {checkedCount} / {totalItems}
            </strong>
            <span>{percent} % abgehakt</span>
          </div>

          <button className={styles.clearButton} onClick={clearChecks} type="button">
            Häkchen zurücksetzen
          </button>
        </div>

        {isLoading ? (
          <section className={styles.emptyState}>
            <p className={styles.sectionKicker}>App-Start</p>
            <h2>Die Einkaufsliste wird vorbereitet.</h2>
          </section>
        ) : null}

        {loadError ? (
          <section className={styles.emptyState}>
            <p className={styles.sectionKicker}>Fehler</p>
            <h2>Die Einkaufsliste konnte nicht geladen werden.</h2>
            <p>{loadError}</p>
          </section>
        ) : null}

        {!isLoading && !loadError && snapshot && snapshot.days.length === 0 ? (
          <section className={styles.emptyState}>
            <p className={styles.sectionKicker}>Noch kein Plan</p>
            <h2>Für diesen Zeitraum gibt es keine geplanten Tage.</h2>
            <p>Erzeuge zuerst einen Planzeitraum oder wähle einen anderen Datumsbereich.</p>
            <div className={styles.emptyActions}>
              <Link className={styles.emptyLink} href="/planen">
                Plan generieren
              </Link>
            </div>
          </section>
        ) : null}

        {!isLoading && !loadError && snapshot && snapshot.days.length > 0 && groups.length === 0 ? (
          <section className={styles.emptyState}>
            <p className={styles.sectionKicker}>Leer</p>
            <h2>Keine Zutaten für diesen Ausschnitt.</h2>
            <p>
              Prüfe im Tagesdetail, ob Mahlzeiten deaktiviert sind oder nicht in der Einkaufsliste
              berücksichtigt werden.
            </p>
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
                          <input checked={checked} onChange={() => toggleItem(id)} type="checkbox" />
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

        {allItemIds.length > 0 ? null : null}
      </section>
    </main>
  );
}
