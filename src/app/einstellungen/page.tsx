import Link from "next/link";
import styles from "./settings.module.css";
import { regenerateCurrentWeekAction, saveSettingsAction } from "@/app/actions";
import { formatCalories, formatGrams } from "@/lib/format";
import { getSettings } from "@/lib/store";

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
            Hier steuerst du Kalorienziel, Makroverteilung, Mahlzeitenrhythmus und Ausschlüsse.
            Beim Speichern wird die aktuelle Woche direkt mit den neuen Vorgaben neu erzeugt.
          </p>
        </div>

        <aside className={styles.heroPanel}>
          <div>
            <p className={styles.sectionKicker}>Aktiver Rahmen</p>
            <h2>{formatCalories(settings.calorieTarget)} pro Tag</h2>
            <p>
              Glutenfrei ist fest gesetzt. Die Formulareingaben wirken auf Wochenplan,
              Tagesansichten und Einkaufsliste.
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
              Die Makroverteilung muss zusammen 100 % ergeben. Ausgeschlossene Zutaten trennst du
              mit Kommas.
            </p>

            <form action={saveSettingsAction}>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label htmlFor="calorieTarget">Kalorienziel pro Tag</label>
                  <input
                    defaultValue={settings.calorieTarget}
                    id="calorieTarget"
                    max={5000}
                    min={1200}
                    name="calorieTarget"
                    step={50}
                    type="number"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="mealsPerDay">Mahlzeiten pro Tag</label>
                  <select defaultValue={String(settings.mealsPerDay)} id="mealsPerDay" name="mealsPerDay">
                    <option value="3">3 Mahlzeiten</option>
                    <option value="4">4 Mahlzeiten mit Snack</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="macroProteinPct">Protein in %</label>
                  <input
                    defaultValue={settings.macroProteinPct}
                    id="macroProteinPct"
                    max={60}
                    min={20}
                    name="macroProteinPct"
                    step={1}
                    type="number"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="macroCarbsPct">Kohlenhydrate in %</label>
                  <input
                    defaultValue={settings.macroCarbsPct}
                    id="macroCarbsPct"
                    max={60}
                    min={10}
                    name="macroCarbsPct"
                    step={1}
                    type="number"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="macroFatPct">Fett in %</label>
                  <input
                    defaultValue={settings.macroFatPct}
                    id="macroFatPct"
                    max={50}
                    min={10}
                    name="macroFatPct"
                    step={1}
                    type="number"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="maxRecipeRepeatsPerWeek">Maximale Wiederholungen pro Woche</label>
                  <select
                    defaultValue={String(settings.maxRecipeRepeatsPerWeek)}
                    id="maxRecipeRepeatsPerWeek"
                    name="maxRecipeRepeatsPerWeek"
                  >
                    <option value="1">1 Wiederholung</option>
                    <option value="2">2 Wiederholungen</option>
                    <option value="3">3 Wiederholungen</option>
                    <option value="4">4 Wiederholungen</option>
                  </select>
                </div>

                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label htmlFor="excludedIngredients">Ausgeschlossene Zutaten</label>
                  <textarea
                    defaultValue={settings.excludedIngredients.join(", ")}
                    id="excludedIngredients"
                    name="excludedIngredients"
                    placeholder="zum Beispiel Pilze, Sellerie, Koriander"
                  />
                </div>

                <div className={`${styles.checkboxGrid} ${styles.fullWidth}`}>
                  <label className={styles.checkboxLabel}>
                    <input defaultChecked={settings.vegetarian} name="vegetarian" type="checkbox" />
                    <span className={styles.checkboxText}>
                      <strong>Vegetarisch planen</strong>
                      <span>Berücksichtigt nur vegetarische Rezepte im Wochenplan.</span>
                    </span>
                  </label>

                  <label className={styles.checkboxLabel}>
                    <input defaultChecked={settings.reduceMeat} name="reduceMeat" type="checkbox" />
                    <span className={styles.checkboxText}>
                      <strong>Fleisch reduzieren</strong>
                      <span>Schiebt fleischlastige Kombinationen im Planer weiter nach hinten.</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className={styles.actionRow}>
                <button className={styles.primaryButton} type="submit">
                  Änderungen speichern und Woche neu planen
                </button>
              </div>
            </form>
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
                <dt>Vegetarisch</dt>
                <dd>{settings.vegetarian ? "ja" : "nein"}</dd>
              </div>
              <div>
                <dt>Fleisch reduzieren</dt>
                <dd>{settings.reduceMeat ? "ja" : "nein"}</dd>
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
            </ul>
          </article>
        </aside>
      </section>
    </main>
  );
}
