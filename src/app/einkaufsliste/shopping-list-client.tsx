"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./shopping.module.css";
import { formatShoppingListQuantity } from "@/lib/format";
import { loadOfflineSnapshot, saveOfflineSnapshot } from "@/lib/offline-store";
import type { ShoppingGroup } from "@/lib/types";

type ShoppingListClientProps = {
  groups: ShoppingGroup[];
  storageKey: string;
};

type ShoppingSnapshot = {
  checkedIds: string[];
  groups: ShoppingGroup[];
  savedAt: string;
};

function itemId(category: string, name: string, unit: string) {
  return `${category}::${name}::${unit}`;
}

export function ShoppingListClient({ groups, storageKey }: ShoppingListClientProps) {
  const allItemIds = groups.flatMap((group) =>
    group.items.map((item) => itemId(group.category, item.name, item.unit)),
  );
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const isHydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    isHydratedRef.current = false;

    const allowedIds = new Set(allItemIds);

    void loadOfflineSnapshot<ShoppingSnapshot>(storageKey)
      .then((snapshot) => {
        const nextCheckedIds = snapshot?.checkedIds?.filter((id) => allowedIds.has(id)) ?? [];

        const frame = window.requestAnimationFrame(() => {
          if (cancelled) {
            return;
          }

          isHydratedRef.current = true;
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

          isHydratedRef.current = true;
          setCheckedIds([]);
        });

        return () => {
          window.cancelAnimationFrame(frame);
        };
      });

    return () => {
      cancelled = true;
    };
  }, [allItemIds, storageKey]);

  useEffect(() => {
    if (!isHydratedRef.current) {
      return;
    }

    const snapshot: ShoppingSnapshot = {
      checkedIds,
      groups,
      savedAt: new Date().toISOString(),
    };

    void saveOfflineSnapshot(storageKey, snapshot).catch((error) => {
      console.error("Einkaufsliste konnte nicht offline gespeichert werden.", error);
    });
  }, [checkedIds, groups, storageKey]);

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

  return (
    <section className={styles.listSection}>
      <div className={styles.toolbar}>
        <div className={styles.progressCard}>
          <p className={styles.sectionKicker}>Einkaufsfortschritt</p>
          <strong>
            {checkedCount} / {totalCount}
          </strong>
          <span>{percent} % abgehakt</span>
        </div>

        <button className={styles.clearButton} onClick={clearChecks} type="button">
          Häkchen zurücksetzen
        </button>
      </div>

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
    </section>
  );
}
