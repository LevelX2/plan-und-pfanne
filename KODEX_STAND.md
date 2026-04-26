# KODEX-Stand

## Projekt

- Projektordner: `C:\Users\Lui\OneDrive\Projekte\plan-und-pfanne`
- Ziel: glutenfreie Tagesplan-App mit Rezepten, Kochansicht und Einkaufsliste
- Produktmodus aktuell: lokale PWA ohne Login
- Datenstrategie aktuell: eingebauter glutenfreier Start-Rezeptbestand plus IndexedDB auf dem Gerät

## Was im Workspace real vorhanden ist

- Next.js 16 mit App Router
- React 19
- TypeScript
- IndexedDB für produktive lokale App-Daten
- Validierung mit `zod`
- PWA-Grundlage mit Manifest, Icons und Service Worker
- Frühere Login-, Logout- und API-Routen sind entfernt; die App läuft ohne Kontoverwaltung und ohne zentralen Scheduler.
- Legacy-Servermodule mit SQLite liegen noch im Repository, sind aber nicht der produktive PWA-Hauptpfad.

## Produktive Routen

- `/`
- `/planen`
- `/tage?date=YYYY-MM-DD`
- `/kochen?meal=<plannedMealId>`
- `/rezepte`
- `/einkaufsliste`
- `/historie`
- `/einstellungen`

## Fachliche Kernbereiche

### `src/lib/local-db.ts`

- verwaltet die lokale IndexedDB-Datenbank
- hält Stores für Einstellungen, Rezepte, Mahlzeitentypen, Rezeptzulassungen, Tagespläne, geplante Mahlzeiten, Meta und Snapshots
- verwirft alte Wochenplan-Testdaten durch das neue Schema

### `src/lib/local-store.ts`

- seeded Rezepte und Standardzuordnungen
- liest und speichert Einstellungen
- verwaltet Rezeptzulassung und Gewichtung je Mahlzeitentyp
- erzeugt freie Tagesplan-Zeiträume
- prüft Überschneidungen
- aktualisiert einzelne Mahlzeiten
- kopiert historische Tage und löscht alte Pläne

### `src/lib/planner.ts`

- optimiert auf Tagesebene gegen das Makroziel
- nutzt Rezeptzulassung je Mahlzeitentyp
- berücksichtigt Gewichtungen als weiche Scoring-Faktoren
- hält Makros als Ein-Personen-Tagesorientierung, während Personenzahlen Zutaten und Einkaufsliste skalieren

## UI-Stand

- Aktueller Plan zeigt geplante Tage, Mahlzeiten und Makros
- Generator erzeugt frei wählbare Datumsbereiche mit Überschneidungswarnung
- Tagesdetail erlaubt Gerichtstausch, Personenzahl, Ausfall-Schalter, Einkaufslisten-Flag und zusätzliche Snacks
- Kochansicht öffnet konkrete geplante Mahlzeiten mit temporär skalierbarer Personenzahl
- Rezeptseite pflegt Rezeptzulassung, Suche, Details und Gewichtung je Mahlzeitentyp
- Einkaufsliste aggregiert aktive Mahlzeiten aus einem Datumsbereich
- Historie zeigt Tageslisten und kopiert Quellzeiträume in neue Zielzeiträume
- Einstellungen pflegen Standard-Personenzahl, Kalorien, Makros und löschen alte Pläne

## Build- und Laufzeitlage

- `npm run lint` erfolgreich verifiziert
- `npm run build` erfolgreich verifiziert
- GitHub-Pages-Build mit `NEXT_PUBLIC_BASE_PATH=/plan-und-pfanne` erfolgreich verifiziert
- `next.config.ts` nutzt `output: "export"`, `trailingSlash: true`, `images.unoptimized: true` und einen buildzeitlichen `basePath`
- Die frühere Kompatibilität für `/anmelden`, `/abmelden` und statische `/api/*`-Platzhalter wurde entfernt.

## Wichtige Einordnung

- Die App plant nicht mehr als starres Wochenmodell, sondern als flexible Tagesplanung.
- Pro Datum gibt es maximal einen Plan.
- Alte lokale Wochenplan-Testdaten sind nicht erhaltenswert und werden nicht migriert.
- Lokale Daten bleiben an dieselbe App-Origin gebunden.
