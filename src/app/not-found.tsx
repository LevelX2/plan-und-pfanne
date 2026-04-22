import Link from "next/link";
import styles from "./feedback.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Nicht gefunden</p>
        <h1>Diese Seite gibt es hier gerade nicht.</h1>
        <p className={styles.copy}>
          Vielleicht ist der Link veraltet oder die angefragte Tages- oder Rezeptseite passt nicht
          zum aktuellen Stand. Über die Hauptnavigation kommst du schnell wieder an die wichtigen
          Bereiche.
        </p>

        <div className={styles.actions}>
          <Link className={styles.primaryButton} href="/">
            Zum Dashboard
          </Link>
          <Link className={styles.secondaryButton} href="/rezepte">
            Zur Rezeptbibliothek
          </Link>
        </div>

        <nav className={styles.nav}>
          <Link href="/einkaufsliste">Einkaufsliste</Link>
          <Link href="/einstellungen">Einstellungen</Link>
        </nav>
      </section>
    </main>
  );
}
