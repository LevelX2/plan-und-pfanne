---
typ: konzept
status: aktiv
letzte_aktualisierung: 2026-04-22
quellen:
  - ../../../01 Rohquellen/repo-root/2026-04-22 Repository-Iststand-Analyse.md
  - ../../../README.md
  - ../../../package.json
  - ../../../src/lib/db.ts
  - ../../../src/lib/store.ts
  - ../../../public/service-worker.js
tags:
  - systembild
  - architektur
  - nextjs
  - sqlite
---

# Systembild und technischer Zuschnitt

## Technischer Kern
- Next.js 16 mit App Router
- React 19
- TypeScript
- SQLite über `better-sqlite3`
- Validierung mit `zod`

## Erkennbare Systembausteine
- `src/app/`: Seiten, Layout, Server Actions und API-Routen
- `src/lib/`: Fachlogik, Datenzugriff, Hilfsfunktionen und Planungslogik
- `public/`: statische Assets, PWA-Dateien und Service Worker
- `data/`: aktiver Bereich für persistente SQLite-Daten

## Laufzeit- und Deployment-Bild
- lokale Entwicklung über `npm run dev`
- Handy-Test im gleichen WLAN über `npm run dev:handy`
- vorbereiteter Railway-Deploy mit Dockerfile, `railway.toml` und Healthcheck-Route
- volumenfähiger Datenbankpfad für persistente SQLite-Daten im Hosting über `DATA_DIR` oder `RAILWAY_VOLUME_MOUNT_PATH`
- `npm run lint` und `npm run build` sind aktuell erfolgreich verifiziert

## Aktuelle Route- und Rendering-Lage
- produktive Routen im Workspace:
  - `/`
  - `/rezepte`
  - `/rezepte/[id]`
  - `/tage/[date]`
  - `/einkaufsliste`
  - `/einstellungen`
  - `/api/health`
  - `/api/scheduler/weekly`
- Alle zentralen Seiten verwenden aktuell `force-dynamic`.
- Interaktive Oberflächen sind in Client-Komponenten ausgelagert, die Server-Komponenten liefern die initialen Daten aus dem Store.
- Die Scheduler-Route akzeptiert `GET` und `POST`; mit `force=1` lässt sich die Generierung der nächsten Woche außerhalb des Sonntags erzwingen.
- Wenn `SCHEDULER_SECRET` gesetzt ist, schützt die Scheduler-Route den Zugriff per Bearer-Header oder Query-Token.

## Persistenzbild
- `src/lib/db.ts` initialisiert SQLite, legt Tabellen an und seeded Standard-Einstellungen sowie Demo-Rezepte.
- `src/lib/store.ts` liest und filtert Rezepte, erzeugt Wochenpläne, speichert sie relational und leitet daraus Tagespläne und Einkaufslisten ab.
- Der aktuelle Workspace enthält bereits eine reale Datenbankdatei `data/planner.sqlite`.
- `data/*.sqlite` ist im Repository ignoriert; die Datei ist damit als lokaler Laufzeit- und Entwicklungszustand zu behandeln, nicht als versioniertes Demo-Artefakt.
- Wochenpläne werden beim ersten Zugriff auf die aktuelle Woche automatisch erzeugt, falls noch keiner gespeichert ist.

## Offline- und PWA-Zuschnitt
- Manifest und App-Icons sind vorhanden.
- Ein Service Worker ist vorhanden.
- Der Service Worker cached App-Shell und gleich-originäre `GET`-Requests und verwendet bei Offline-Navigation einen Fallback auf `/rezepte`.
- Dashboard-Snapshot, Rezeptbestand und Einkaufslistenstatus werden zusätzlich in IndexedDB gespeichert.
- Der reale Offlinescope umfasst damit aktuell Dashboard, Rezeptbibliothek und Einkaufsliste nach vorherigem Online-Laden.
- Offline-Schreibzugriffe auf serverseitige Funktionen wie Regenerierung oder Einstellungsänderung sind aktuell nicht vorgesehen.

## Technische Vorsichtspunkte
- Wegen Next.js 16 sollen aktuelle lokale Next-Dokumente in `node_modules/next/dist/docs/` vor größeren Änderungen geprüft werden.
- Der dokumentierte Projektstand kann dem Code leicht hinterherhinken, daher sind Detailaussagen gezielt zu verifizieren.
- `next.config.ts` nutzt inzwischen `serverExternalPackages: ["better-sqlite3"]`, damit der Produktions-Build mit Next.js 16 und Turbopack wieder erfolgreich läuft.
- `next build` meldet weiterhin eine Turbopack-Warnung über zu breite Dateinachverfolgung im Zusammenspiel von `next.config.ts`, Datenbankpfad und Store-Nutzung.
