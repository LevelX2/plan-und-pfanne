import styles from "./login.module.css";
import { LoginForm } from "./login-form";
import { getSafeNextPath, redirectIfAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    status?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated();

  const query = await searchParams;
  const nextPath = getSafeNextPath(query.next);
  const wasLoggedOut = query.status === "abgemeldet";

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Plan und Pfanne</p>
          <h1>Dein persönlicher Wochenplan gehört nur Dir.</h1>
          <p className={styles.lead}>
            Melde Dich mit einem E-Mail-Code an. Danach siehst Du nur Deine eigenen Einstellungen,
            Wochenpläne, aktiven Gerichte und Einkaufslisten.
          </p>
          {wasLoggedOut ? (
            <p className={styles.statusSuccess}>Du bist auf diesem Gerät abgemeldet.</p>
          ) : null}
        </section>

        <LoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}
