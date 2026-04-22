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

Fuer Tests auf dem Handy im selben WLAN:

```bash
npm run dev:handy
```

Dann die lokale IPv4-Adresse im Browser des Handys oeffnen, zum Beispiel `http://192.168.178.23:3000`.

## Build und Qualitaet

```bash
npm run lint
npm run build
```

Stand 2026-04-22:

- `npm run lint` erfolgreich
- `npm run build` erfolgreich
- beim Build bleibt aktuell noch eine Turbopack-Warnung zur NFT-Dateinachverfolgung rund um den datenbanknahen Dateisystemzugriff bestehen

## Offline-Umfang

Die App ist als PWA vorbereitet und speichert derzeit nach vorherigem Online-Laden lokal:

- Dashboard-Snapshot
- Rezeptbibliothek
- Einkaufslistenstatus

Offline ist der Modus aktuell weitgehend lesend. Schreibende Server-Aktionen wie Speichern der Einstellungen oder Neugenerieren des Wochenplans brauchen weiterhin eine Verbindung.

## Datenhaltung

- SQLite-Datei: `data/planner.sqlite`
- `data/*.sqlite` ist per `.gitignore` ausgeschlossen
- Die Datenbank ist damit als lokaler Laufzeit- und Entwicklungszustand gedacht, nicht als versioniertes Demo-Artefakt
- Wenn keine Datenbank vorhanden ist, werden Standard-Einstellungen und Demo-Rezepte automatisch angelegt

## Scheduler-Endpunkt

Der Endpunkt `/api/scheduler/weekly` erzeugt den Wochenplan fuer die naechste Woche.

- `GET /api/scheduler/weekly` fuehrt die Standardlogik aus
- `GET /api/scheduler/weekly?force=1` erzwingt die Generierung auch ausserhalb des Sonntags
- `POST /api/scheduler/weekly` ist ebenfalls verfuegbar
- Wenn `SCHEDULER_SECRET` gesetzt ist, erwartet die Route entweder `Authorization: Bearer <secret>` oder `?token=<secret>`

## Deployment auf Railway

Das Projekt ist fuer Railway vorbereitet:

- `Dockerfile`
- `railway.toml`
- `output: "standalone"` in `next.config.ts`
- volumenfaehiger Datenbankpfad ueber `DATA_DIR` oder `RAILWAY_VOLUME_MOUNT_PATH`

Aktueller Betriebsstand:

- Ein GitHub-Push allein fuehrt derzeit offenbar nicht verlaesslich zu einem Live-Deploy.
- Der produktive Stand wurde zuletzt manuell per Railway-CLI aus dem Projektverzeichnis ausgerollt.
- Verwendeter Weg:

```bash
railway up -s plan-und-pfanne
```

Voraussetzung dafuer:

- Railway-CLI ist eingeloggt
- das lokale Verzeichnis ist mit dem Projekt `plan-und-pfanne` verknuepft
- Zielservice ist `plan-und-pfanne`

Empfehlung fuer persistente Daten:

- Volume mounten
- Mount Path auf `/data` oder `/app/data` setzen
- die SQLite-Datei nicht ins Repository aufnehmen
