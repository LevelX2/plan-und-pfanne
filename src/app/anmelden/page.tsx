import Link from "next/link";
import styles from "./login.module.css";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Plan und Pfanne</p>
          <h1>Diese Seite wird nicht mehr verwendet.</h1>
          <p className={styles.lead}>
            Plan und Pfanne öffnet direkt das Dashboard. Dieser frühere Anmeldepfad bleibt nur
            erhalten, damit ältere Links und Lesezeichen nicht ins Leere laufen.
          </p>
          <p className={styles.statusSuccess}>
            Du kannst direkt mit der App weiterarbeiten.
          </p>
          <p>
            <Link href="/">Zum Dashboard</Link>
          </p>
        </section>

        <LoginForm nextPath="/" />
      </div>
    </main>
  );
}
