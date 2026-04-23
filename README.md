# Plan und Pfanne

Glutenfreie Wochenplan-App mit Rezeptbibliothek, Tagesansichten, Einkaufsliste, Einstellungen und lokalem SQLite-Store.

## Aktueller Produktstand

- Dashboard unter `/` mit aktueller Woche, Tageskarten und Makro-Abweichungen
- Rezeptbibliothek unter `/rezepte` und Detailseiten unter `/rezepte/[id]`
- Tagesseiten unter `/tage/[date]`
- Einkaufsliste unter `/einkaufsliste`
- Einstellungsseite unter `/einstellungen`
- Healthcheck unter `/api/health`
- Scheduler-Endpunkt unter `/api/scheduler/weekly`

## Lokaler Start

```bash
npm install
npm run dev
```

Für Tests auf dem Handy im selben WLAN:

```bash
npm run dev:handy
```

Dann die lokale IPv4-Adresse im Browser des Handys öffnen, zum Beispiel `http://192.168.178.23:3000`.

## Build und Qualität

```bash
npm run lint
npm run build
```

Stand 2026-04-23:

- `npm run lint` erfolgreich
- `npm run build` erfolgreich
- die frühere Turbopack-Warnung zur NFT-Dateinachverfolgung rund um den datenbanknahen Dateisystemzugriff tritt nach engerem SQLite-Pfadscoping in `src/lib/db.ts` nicht mehr auf

## Offline-Umfang

Die App ist als PWA vorbereitet und speichert derzeit nach vorherigem Online-Laden lokal:

- Dashboard-Snapshot
- Rezeptbibliothek
- Einkaufslistenstatus
- aktive Gerichtsauswahl pro Woche inklusive Einkaufslistenmodus

Offline ist der Modus aktuell bewusst weitgehend lesend. Dashboard, Rezeptbibliothek und Einkaufsliste bleiben nach vorherigem Laden nutzbar. Schreibende Server-Aktionen wie Speichern der Einstellungen oder Neugenerieren des Wochenplans brauchen weiterhin eine Verbindung.

Bei Offline-Navigation versucht der Service Worker zuerst die bereits gecachte Zielseite. Wenn diese nicht vorhanden ist, fällt er auf `/` und danach auf `/rezepte` zurück.

## Datenhaltung

- SQLite-Datei: `data/planner.sqlite`
- `data/*.sqlite` ist per `.gitignore` ausgeschlossen
- Die Datenbank ist damit als lokaler Laufzeit- und Entwicklungszustand gedacht, nicht als versioniertes Demo-Artefakt
- Wenn keine Datenbank vorhanden ist, werden Standard-Einstellungen und Demo-Rezepte automatisch angelegt

## Scheduler-Endpunkt

Der Endpunkt `/api/scheduler/weekly` erzeugt den Wochenplan für die nächste Woche.

- `GET /api/scheduler/weekly` führt die Standardlogik aus
- `GET /api/scheduler/weekly?force=1` erzwingt die Generierung auch außerhalb des Sonntags
- `POST /api/scheduler/weekly` ist ebenfalls verfügbar
- In Production ist `SCHEDULER_SECRET` aktuell Pflicht. Ohne gesetztes Secret antwortet die Route bewusst mit `503`, statt offen erreichbar zu sein.
- Wenn `SCHEDULER_SECRET` gesetzt ist, erwartet die Route entweder `Authorization: Bearer <secret>` oder `?token=<secret>`

## Fehlerbehandlung

- Das Formular unter `/einstellungen` zeigt erwartete Validierungs- und Speicherfehler inline an, statt die Seite mit einem harten Fehler abbrechen zu lassen.
- Für unerwartete Laufzeitfehler und nicht gefundene Seiten gibt es nutzerfreundliche App-Fallbacks.

## Aktive Gerichte und Einkaufsliste

- Im Dashboard lassen sich geplante Mahlzeiten pro Gericht, pro Tag oder für die ganze Woche aktivieren und deaktivieren.
- Die aktive Auswahl startet bewusst leer und bleibt lokal pro Woche gespeichert.
- Die Einkaufsliste unterstützt zwei Modi:
  - `aktive Gerichte`
  - `alle geplanten Gerichte`
- Im Modus `aktive Gerichte` zeigt die Einkaufsliste bei leerer Auswahl einen expliziten Leerzustand statt stillschweigend alle Zutaten an.
- Der Abhakstatus der Einkaufsliste wird lokal pro Woche und Listenkontext gespeichert.

## Deployment auf Railway

Das Projekt ist für Railway vorbereitet:

- `Dockerfile`
- `railway.toml`
- `output: "standalone"` in `next.config.ts`
- volumenfähiger Datenbankpfad über `DATA_DIR` oder `RAILWAY_VOLUME_MOUNT_PATH`
- enger auf `planner.sqlite` gescopter SQLite-Pfad in `src/lib/db.ts`, damit der Turbopack-Build den Dateisystemzugriff nicht unnötig breit traced

Aktueller Betriebsstand:

- Ein GitHub-Push allein führt derzeit offenbar nicht verlässlich zu einem Live-Deploy.
- Der produktive Stand wurde zuletzt manuell per Railway-CLI aus dem Projektverzeichnis ausgerollt.
- Verwendeter Weg:

```bash
railway up -s plan-und-pfanne
```

Voraussetzung dafür:

- Railway-CLI ist eingeloggt
- das lokale Verzeichnis ist mit dem Projekt `plan-und-pfanne` verknüpft
- Zielservice ist `plan-und-pfanne`

Empfehlung für persistente Daten:

- Volume mounten
- Mount Path auf `/data` oder `/app/data` setzen
- die SQLite-Datei nicht ins Repository aufnehmen
