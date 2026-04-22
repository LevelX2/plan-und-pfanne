import Link from "next/link";
import styles from "./shopping.module.css";
import { buildShoppingListForWeek, getCurrentWeekPlan } from "@/lib/store";
import { formatDateRange } from "@/lib/format";
import { ShoppingListClient } from "@/app/einkaufsliste/shopping-list-client";

export const dynamic = "force-dynamic";

export default function ShoppingListPage() {
  const weekPlan = getCurrentWeekPlan();

  if (!weekPlan) {
    throw new Error("Die Einkaufsliste konnte nicht geladen werden.");
  }

  const shoppingGroups = buildShoppingListForWeek(weekPlan.startDate);
  const totalItems = shoppingGroups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <main className={styles.page}>
      <nav className={styles.topNav}>
        <Link href="/">Dashboard</Link>
        <Link href="/rezepte">Rezepte</Link>
        <Link href="/einkaufsliste">Einkaufsliste</Link>
        <Link href="/einstellungen">Einstellungen</Link>
      </nav>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Mobile Einkaufsliste</p>
          <h1>Deine Woche ist als Einkaufsliste bereit.</h1>
          <p className={styles.lead}>
            Öffne diese Seite auf dem Handy und hake die Zutaten direkt beim Einkaufen ab. Der
            Fortschritt bleibt lokal im Browser für diese Woche gespeichert.
          </p>
        </div>

        <div className={styles.heroStat}>
          <span>Aktive Woche</span>
          <strong>{formatDateRange(weekPlan.startDate, weekPlan.endDate)}</strong>
          <p>
            {totalItems} Positionen in {shoppingGroups.length} Kategorien
          </p>
        </div>
      </section>

      <ShoppingListClient
        groups={shoppingGroups}
        storageKey={`shopping-checks:${weekPlan.startDate}`}
      />
    </main>
  );
}
