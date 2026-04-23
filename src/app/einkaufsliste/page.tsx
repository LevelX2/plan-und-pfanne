import { AppNav } from "@/app/app-nav";
import styles from "./shopping.module.css";
import { requireUser } from "@/lib/auth";
import { formatDateRange } from "@/lib/format";
import { ShoppingListClient } from "@/app/einkaufsliste/shopping-list-client";
import { getCurrentWeekPlan } from "@/lib/store";
import { createUserStorageNamespace } from "@/lib/user-storage";

export const dynamic = "force-dynamic";

export default async function ShoppingListPage() {
  const user = await requireUser("/einkaufsliste");
  const weekPlan = getCurrentWeekPlan(user.id);

  if (!weekPlan) {
    throw new Error("Die Einkaufsliste konnte nicht geladen werden.");
  }

  const totalMeals = weekPlan.days.reduce((sum, day) => sum + day.meals.length, 0);

  return (
    <main className={styles.page}>
      <AppNav
        currentPath="/einkaufsliste"
        user={{
          email: user.email,
          displayName: user.displayName,
        }}
      />

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
            {totalMeals} geplante Gerichte. Wechsle unten zwischen aktivem Kochfokus und kompletter
            Woche.
          </p>
        </div>
      </section>

      <ShoppingListClient
        storageNamespace={createUserStorageNamespace(user.id)}
        weekPlan={weekPlan}
      />
    </main>
  );
}
