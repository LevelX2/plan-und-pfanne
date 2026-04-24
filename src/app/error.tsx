"use client";

import Link from "next/link";
import { useEffect } from "react";
import styles from "./feedback.module.css";

type AppErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function AppError({ error, unstable_retry }: AppErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Unerwarteter Fehler</p>
        <h1>Die Ansicht konnte gerade nicht geladen werden.</h1>
        <p className={styles.copy}>
          Wahrscheinlich ist gerade beim Laden des Tagesplans oder der Daten etwas schiefgelaufen.
          Du kannst es direkt erneut versuchen oder auf eine stabile Hauptseite zurückgehen.
        </p>

        <div className={styles.actions}>
          <button className={styles.primaryButton} onClick={() => unstable_retry()} type="button">
            Erneut versuchen
          </button>
          <Link className={styles.secondaryButton} href="/">
            Zum Dashboard
          </Link>
        </div>

        <nav className={styles.nav}>
          <Link href="/rezepte">Rezepte</Link>
          <Link href="/einkaufsliste">Einkaufsliste</Link>
          <Link href="/einstellungen">Einstellungen</Link>
        </nav>
      </section>
    </main>
  );
}
