# KODEX-Stand

## Projekt

- Projektordner: `C:\Users\Lui\OneDrive\Projekte\plan-und-pfanne`
- Ziel: glutenfreie Wochenplan-App mit Tagesoptimierung auf Makro-Zielwerte
- Produktmodus aktuell: `Single-User ohne Login`
- Datenstrategie aktuell: eingebauter glutenfreier Start-Rezeptbestand plus lokaler SQLite-Laufzeitzustand

## Was im Workspace real vorhanden ist

- Next.js 16 mit App Router
- React 19
- TypeScript
- SQLite ueber `better-sqlite3`
- Validierung mit `zod`
- PWA-Grundlage mit Manifest, Icons und Service Worker

## Produktive Routen

- `/`
- `/rezepte`
- `/rezepte/[id]`
- `/tage/[date]`
- `/einkaufsliste`
- `/einstellungen`
- `/api/health`
- `/api/scheduler/weekly`

## Fachliche Kernbereiche

### `src/lib/db.ts`

- initialisiert SQLite
- legt Tabellen fuer Einstellungen, Rezepte, Wochenplaene, Tagesplaene und Mahlzeiten an
- seeded Standard-Einstellungen und Demo-Rezepte
- nutzt `data/planner.sqlite` als lokale Laufzeitdatenbank

### `src/lib/store.ts`

- liest Einstellungen und Rezepte
- filtert den Rezeptpool
- erzeugt und speichert Wochenplaene
- leitet Tagesansichten und Einkaufslisten ab
- stellt eine Scheduler-Funktion fuer die naechste Woche bereit

### `src/app/actions.ts`

- Server Action fuer manuelle Regenerierung
- Server Action fuer das Speichern der Einstellungen inklusive Ruecksprung nach `/einstellungen`

## UI-Stand

- Dashboard zeigt aktuelle Woche, Tageskarten, Makro-Abweichungen und Planungsprofil
- Rezeptbibliothek ist gruppiert und offline lesbar
- Rezept-Detailseiten sind vorhanden
- Tagesseiten sind vorhanden und mit dem Dashboard verknuepft
- Einkaufsliste ist vorhanden und speichert Abhakstatus lokal
- Einstellungsseite ist vorhanden und regeneriert die Woche beim Speichern

## Scheduler-Stand

- Route `/api/scheduler/weekly` ist umgesetzt
- `force=1` erzwingt die Generierung ausserhalb des Sonntags
- optionaler Schutz ueber `SCHEDULER_SECRET`

## Build- und Laufzeitlage

- `npm run lint` erfolgreich verifiziert
- `npm run build` erfolgreich verifiziert
- `next.config.ts` nutzt `output: "standalone"` und `serverExternalPackages: ["better-sqlite3"]`
- beim Turbopack-Build bleibt aktuell noch eine NFT-Warnung zur Dateinachverfolgung rund um den Datenbankpfad bestehen

## Wichtige Einordnung

- `README.md` und Produktstand sind wieder grob konsistent
- `data/planner.sqlite` ist kein versioniertes Demo-Artefakt, sondern lokaler Entwicklungs- und Nutzerzustand
- der alte Ordner `C:\Users\Lui\OneDrive\Projekte\gluten freie Rezepte` wirkt aktuell wie ein leerer OneDrive-Reparse-Restzustand, nicht wie eine aktiv gepflegte zweite Arbeitskopie
