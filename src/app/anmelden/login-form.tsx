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
          <p className={styles.eyebrow}>Hinweis</p>
          <h2>Zum Dashboard wechseln</h2>
          <p>
            Eine Anmeldung ist in der aktuellen App nicht vorgesehen. Wenn du hier gelandet bist,
            kannst du direkt zurück ins Dashboard springen.
          </p>
        </div>

        <div className={styles.form}>
          <p className={styles.statusSuccess}>
            Dieser Pfad bleibt nur erreichbar, damit ältere Verweise weiter funktionieren.
          </p>
          <Link className={styles.submitButton} href={nextPath}>
            Zum Dashboard
          </Link>
        </div>
      </section>

      <aside className={styles.sideCard}>
        <div className={styles.cardHeader}>
          <p className={styles.eyebrow}>Orientierung</p>
          <h2>Wofür der Pfad noch da ist</h2>
          <p>
            Manche alten Lesezeichen oder direkte Verweise können noch hier landen. Deshalb bleibt
            diese Seite erreichbar.
          </p>
        </div>

        <ul>
          <li>Die App startet direkt im Dashboard.</li>
          <li>Wochenplan, Rezepte und Einkaufsliste sind ohne Umweg erreichbar.</li>
          <li>Von hier aus kannst du jederzeit sofort zurückspringen.</li>
        </ul>
      </aside>
    </div>
  );
}
