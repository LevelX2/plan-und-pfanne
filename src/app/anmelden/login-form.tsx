import Link from "next/link";
import styles from "./login.module.css";

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  return (
    <div className={styles.grid}>
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <p className={styles.eyebrow}>Lokaler Modus</p>
          <h2>Direkt starten statt einloggen</h2>
          <p>
            Für GitHub Pages und den lokalen PWA-Betrieb haben wir den früheren Login deaktiviert.
            Die App soll mittelfristig vollständig mit lokalen Gerätedaten laufen.
          </p>
        </div>

        <div className={styles.form}>
          <p className={styles.statusSuccess}>
            Dieser Bereich bleibt vorerst als Legacy-Hinweis bestehen, damit alte Links nicht ins
            Leere laufen.
          </p>
          <Link className={styles.submitButton} href={nextPath}>
            Zum Dashboard
          </Link>
        </div>
      </section>

      <aside className={styles.sideCard}>
        <div className={styles.cardHeader}>
          <p className={styles.eyebrow}>Migration</p>
          <h2>Was sich geändert hat</h2>
          <p>
            Der servergebundene Login wurde aus dem GitHub-Pages-Zielpfad entfernt, damit der
            statische Export nicht an Cookies, Sessions oder Mailversand hängt.
          </p>
        </div>

        <ul>
          <li>Installationen laufen künftig über GitHub Pages unter einem stabilen Unterpfad.</li>
          <li>Service Worker und Manifest berücksichtigen jetzt den GitHub-Pages-Basis-Pfad.</li>
          <li>Formulare für echte lokale Speicherung folgen mit dem clientseitigen Datenmodell.</li>
        </ul>
      </aside>
    </div>
  );
}
