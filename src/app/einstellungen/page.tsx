import Link from "next/link";
import styles from "./settings.module.css";
import { regenerateCurrentWeekAction } from "@/app/actions";
import { SettingsForm } from "./settings-form";
import { formatCalories, formatGrams } from "@/lib/format";
import { getRecipeMixPoolStats, getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

function macroTargets(calorieTarget: number, proteinPct: number, carbsPct: number, fatPct: number) {
  return {
    protein: Number(((calorieTarget * proteinPct) / 100 / 4).toFixed(1)),
    carbs: Number(((calorieTarget * carbsPct) / 100 / 4).toFixed(1)),
    fat: Number(((calorieTarget * fatPct) / 100 / 9).toFixed(1)),
  };
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const settings = getSettings();
  const recipeMixPool = getRecipeMixPoolStats();
  const query = await searchParams;
  const targets = macroTargets(
    settings.calorieTarget,
    settings.macroProteinPct,
    settings.macroCarbsPct,
    settings.macroFatPct,
  );
  const statusSaved = query.status === "gespeichert";

  return (
    <main className={styles.page}>
      <nav className={styles.topNav}>
        <Link href="/">Dashboard</Link>
        <Link href="/rezepte">Rezepte</Link>
        <Link href="/einkaufsliste">Einkaufsliste</Link>
        <Link href="/einstellungen">Einstellungen</Link>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Planungsprofil</p>
          <h1>Dein Wochenplan soll zu deinem Alltag passen.</h1>
          <p className={styles.lead}>
            Hier steuerst du Kalorienziel, Makroverteilung, Mahlzeitenrhythmus, Zielmix für Mittag
            und Abend sowie Ausschlüsse. Beim Speichern wird die aktuelle Woche direkt mit den
            neuen Vorgaben neu erzeugt.
          </p>
        </div>

        <aside className={styles.heroPanel}>
          <div>
            <p className={styles.sectionKicker}>Aktiver Rahmen</p>
            <h2>{formatCalories(settings.calorieTarget)} pro Tag</h2>
            <p>
              Glutenfrei ist fest gesetzt. Der neue Zielmix wirkt als weiche Verteilung für
              Mittagessen und Abendessen im Wochenplan.
            </p>
          </div>

          {statusSaved ? <span className={styles.statusBadge}>Änderungen gespeichert</span> : null}

          <ul className={styles.macroPreview}>
            <li>
              <div>
                <span>Protein</span>
                <strong>{settings.macroProteinPct} %</strong>
              </div>
              <small>{formatGrams(targets.protein)}</small>
            </li>
            <li>
              <div>
                <span>Kohlenhydrate</span>
                <strong>{settings.macroCarbsPct} %</strong>
              </div>
              <small>{formatGrams(targets.carbs)}</small>
            </li>
            <li>
              <div>
                <span>Fett</span>
                <strong>{settings.macroFatPct} %</strong>
              </div>
              <small>{formatGrams(targets.fat)}</small>
            </li>
          </ul>
        </aside>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <article className={styles.formCard}>
            <p className={styles.sectionKicker}>Formular</p>
            <h2>Planungswerte anpassen</h2>
            <p className={styles.hint}>
              Makroverteilung und Zielmix müssen jeweils zusammen 100 % ergeben. Ausgeschlossene
              Zutaten trennst du mit Kommas.
            </p>

            <SettingsForm settings={settings} />
          </article>
        </div>

        <aside className={styles.sideColumn}>
          <article className={styles.summaryCard}>
            <p className={styles.sectionKicker}>Aktive Regeln</p>
            <h2>Was der Planer gerade beachtet</h2>
            <dl className={styles.summaryList}>
              <div>
                <dt>Glutenfrei</dt>
                <dd>immer aktiv</dd>
              </div>
              <div>
                <dt>Mahlzeitenfenster</dt>
                <dd>{settings.mealsPerDay === 4 ? "4 mit Snack" : "3 ohne Snack"}</dd>
              </div>
              <div>
                <dt>Zielmix</dt>
                <dd>
                  {settings.vegetarianSharePct} % vegetarisch, {settings.fishSharePct} % Fisch,{" "}
                  {settings.meatSharePct} % Fleisch
                </dd>
              </div>
              <div>
                <dt>Zutaten ausschließen</dt>
                <dd>{settings.excludedIngredients.length > 0 ? settings.excludedIngredients.join(", ") : "keine"}</dd>
              </div>
            </dl>
          </article>

          <article className={styles.statusCard}>
            <p className={styles.sectionKicker}>Sofortaktion</p>
            <h2>Diese Woche neu berechnen</h2>
            <p>
              Wenn du nur einen frischen Wochenvorschlag möchtest, kannst du die aktuelle Woche
              hier direkt neu generieren.
            </p>
            <form className={styles.actionRow} action={regenerateCurrentWeekAction}>
              <button className={styles.secondaryButton} type="submit">
                Woche neu generieren
              </button>
            </form>
          </article>

          <article className={styles.infoCard}>
            <p className={styles.sectionKicker}>Auswirkung</p>
            <h2>Welche Bereiche sich mit ändern</h2>
            <ul className={styles.mealList}>
              <li>
                <div>
                  <span>Dashboard</span>
                  <strong>Neue Tageskarten und neue Makroabweichungen</strong>
                </div>
              </li>
              <li>
                <div>
                  <span>Tagesseiten</span>
                  <strong>Aktualisierte Mahlzeiten pro Datum</strong>
                </div>
              </li>
              <li>
                <div>
                  <span>Einkaufsliste</span>
                  <strong>Frisch abgeleitete Zutaten für die aktuelle Woche</strong>
                </div>
              </li>
              <li>
                <div>
                  <span>Rezeptpool für den Mix</span>
                  <strong>
                    {recipeMixPool.counts.vegetarian} vegetarisch, {recipeMixPool.counts.fish} Fisch,{" "}
                    {recipeMixPool.counts.meat} Fleisch
                  </strong>
                </div>
              </li>
            </ul>
          </article>
        </aside>
      </section>
    </main>
  );
}
