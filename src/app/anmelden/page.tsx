import Link from "next/link";
import styles from "./login.module.css";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Plan und Pfanne</p>
          <h1>Die lokale PWA braucht keine Anmeldung mehr.</h1>
          <p className={styles.lead}>
            GitHub Pages liefert die App jetzt als statische, lokale Web-App aus. Benutzerkonten,
            Sessions und E-Mail-Codes sind in diesem Modus bewusst abgeschaltet.
          </p>
          <p className={styles.statusSuccess}>
            Öffne direkt das Dashboard. Die lokale Datenhaltung wird schrittweise auf dem Gerät
            ausgebaut.
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
