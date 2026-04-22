# KODEX-Stand

## Projekt

- Projektordner: `C:\Users\Lui\OneDrive\Projekte\gluten freie Rezepte`
- Ziel: glutenfreie Wochenplan-App mit Tagesoptimierung auf Makro-Zielwerte `30 / 30 / 40`
- Produktmodus aktuell: `Single-User ohne Login`
- Datenstrategie aktuell: eingebauter glutenfreier Start-Rezeptbestand

## Was bereits angelegt wurde

- Next.js-Projektgrundlage ist vorhanden.
- Zusätzliche Pakete wurden bereits in `package.json` eingetragen:
  - `better-sqlite3`
  - `zod`
  - `@types/better-sqlite3`
- Fachliche Grunddateien wurden bereits erstellt:
  - `src/lib/types.ts`
  - `src/lib/date.ts`
  - `src/lib/format.ts`
  - `src/lib/db.ts`
  - `src/lib/planner.ts`
  - `src/lib/store.ts`
  - `src/lib/data/demo-recipes.ts`
  - `src/app/actions.ts`

## Inhalt dieser Dateien

### `src/lib/types.ts`

- Typen fuer:
  - Mahlzeiten
  - Rezepte
  - Benutzereinstellungen
  - Tagesplan
  - Wochenplan
  - Einkaufsliste

### `src/lib/data/demo-recipes.ts`

- Eingebauter glutenfreier Rezeptbestand fuer MVP
- Enthaelt aktuell:
  - Fruehstueck
  - Mittagessen
  - Abendessen
  - Snacks
- Jedes Rezept hat:
  - Makros
  - Zutaten
  - Zubereitung
  - Tags
  - `glutenFree = true`

### `src/lib/db.ts`

- SQLite-Setup mit `better-sqlite3`
- Tabellen angelegt fuer:
  - `user_settings`
  - `recipes`
  - `weekly_plans`
  - `daily_plans`
  - `meals`
- Seed-Logik vorhanden:
  - Default-Einstellungen
  - Demo-Rezepte

### `src/lib/planner.ts`

- Heuristische Wochenplan-Generierung
- Logik vorhanden fuer:
  - Zielwerte pro Tag
  - Rezeptpools pro Mahlzeit
  - Portionsfaktoren
  - Tages-Scoring
  - Wiederholungsstrafen
  - Snack-Nutzung bei `mealsPerDay >= 4`

### `src/lib/store.ts`

- Datenzugriff auf Rezepte, Einstellungen und Plaene
- Speichern und Laden von Wochenplaenen
- Generierung der aktuellen Woche
- Einkaufsliste aus Wochenplan
- Scheduler-Helfer fuer Sonntags-Generierung

### `src/app/actions.ts`

- Server Actions fuer:
  - manuelle Regenerierung
  - Speichern der Einstellungen

## Wichtiger aktueller Stand

- Die fachliche Logik ist bereits teilweise vorbereitet.
- Das Frontend ist noch **nicht** auf die eigentliche App umgebaut.
- Aktuell sind noch die generischen Starter-Dateien aktiv:
  - `src/app/page.tsx`
  - `src/app/layout.tsx`
  - `src/app/globals.css`
  - `src/app/page.module.css`
- Die App zeigt deshalb noch nicht das geplante Produkt-UI.

## Was als Naechstes gebaut werden sollte

1. Layout und Navigation auf Produkt-UI umstellen
2. Dashboard fuer Wochenuebersicht bauen
3. Seiten anlegen:
   - `/rezepte`
   - `/rezepte/[id]`
   - `/tage/[date]`
   - `/einkaufsliste`
   - `/einstellungen`
4. Scheduler-Route bauen:
   - `/api/scheduler/weekly`
5. Lint und Build pruefen

## Fachliche Entscheidungen, die bereits geklaert sind

- Glutenfrei ist harte Filterbedingung
- Planung erfolgt auf Tagesebene, nicht pro Einzelrezept
- Standardstruktur:
  - Fruehstueck
  - Mittagessen
  - Abendessen
  - optional Snack
- Single-User-MVP ohne Login
- Architektur soll spaeter erweiterbar bleiben fuer:
  - E-Mail-Versand
  - Hosting
  - PWA
  - Mehrnutzerbetrieb

## Praktische Hinweise fuer Weiterarbeit

- Im neuen Ordner wurde nur der Projektinhalt kopiert, nicht `node_modules`.
- Vor lokaler Weiterarbeit dort zuerst:

```bash
npm install
npm run lint
npm run build
```

- Die SQLite-Datei wird spaeter unter `data/planner.sqlite` erzeugt, sobald die Datenbanklogik aktiv verwendet wird.

## Kurzfassung

- Projektbasis vorhanden
- fachliche Kernlogik teilweise vorbereitet
- Demo-Rezeptbestand vorhanden
- UI und Routing fuer die echte App noch offen
- guter Zwischenstand fuer naechsten Ausbau
