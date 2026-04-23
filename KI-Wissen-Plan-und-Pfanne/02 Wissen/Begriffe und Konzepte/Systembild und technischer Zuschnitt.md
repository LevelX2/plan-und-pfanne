---
typ: konzept
status: aktiv
letzte_aktualisierung: 2026-04-23
quellen:
  - ../../../README.md
  - ../../../next.config.ts
  - ../../../package.json
  - ../../../src/app/layout.tsx
  - ../../../src/app/manifest.ts
  - ../../../src/app/pwa-register.tsx
  - ../../../src/app/page.tsx
  - ../../../src/app/rezepte/page.tsx
  - ../../../src/app/tage/page.tsx
  - ../../../src/lib/local-db.ts
  - ../../../src/lib/local-store.ts
  - ../../../src/lib/offline-store.ts
  - ../../../public/service-worker.js
  - ../../../.github/workflows/deploy-pages.yml
tags:
  - systembild
  - architektur
  - nextjs
  - pwa
---

# Systembild und technischer Zuschnitt

## Technischer Kern
- Next.js 16 mit App Router
- React 19
- TypeScript
- lokale Persistenz über `IndexedDB`
- Validierung mit `zod`

## Erkennbare Systembausteine
- `src/app/`: statisch exportierbare Seiten, PWA-Registrierung und Legacy-Platzhalter für frühere Serverpfade
- `src/lib/`: Fachlogik, lokale IndexedDB-Zugriffe, Hilfsfunktionen und Planungslogik
- `public/`: statische Assets, PWA-Dateien und Service Worker
- `.github/workflows/`: Build- und Deploy-Pfad für GitHub Pages

## Laufzeit- und Deployment-Bild
- lokale Entwicklung über `npm run dev`
- Handy-Test im gleichen WLAN über `npm run dev:handy`
- produktiver Zielpfad über GitHub Pages mit statischem Export
- `next.config.ts` nutzt `output: "export"`, `trailingSlash: true`, `images.unoptimized: true` und einen buildzeitlichen `basePath`
- `.github/workflows/deploy-pages.yml` baut und veröffentlicht den Ordner `out`
- Ziel-Origin für den aktuellen PWA-Pfad ist `https://levelx2.github.io/plan-und-pfanne/`
- `npm run lint`, `npm run build` und ein Build mit `NEXT_PUBLIC_BASE_PATH=/plan-und-pfanne` sind erfolgreich verifiziert

## Aktuelle Route- und Rendering-Lage
- produktive Routen im Workspace:
  - `/`
  - `/rezepte`
  - `/tage`
  - `/einkaufsliste`
  - `/einstellungen`
  - `/anmelden`
  - `/abmelden`
  - `/api/health`
  - `/api/auth/logout`
  - `/api/scheduler/weekly`
- Detailansichten für Rezepte und Tage laufen statisch über Query-Parameter:
  `/rezepte?recipe=<id>` und `/tage?date=YYYY-MM-DD`
- Die früheren dynamischen Seiten `/rezepte/[id]` und `/tage/[date]` wurden entfernt, damit der Static Export ohne parametrisierte Pfadgenerierung auskommt.
- Die zentralen Produktseiten arbeiten clientseitig auf lokaler Datenbasis.
- `anmelden`, `abmelden`, `auth-actions` und die API-Routen sind im aktuellen Zuschnitt nur noch Legacy- oder Platzhalterpfade und nicht mehr Teil eines echten Serverbetriebs.
- App-weite Fallback-Seiten für unerwartete Fehler und nicht gefundene Routen sind vorhanden.

## Persistenzbild
- `src/lib/local-db.ts` verwaltet die lokale App-Datenbank `gf-wochenplan-offline`.
- Vorhandene Stores sind:
  `snapshots`, `meta`, `settings`, `recipes`, `weekPlans` und `history`.
- `src/lib/local-store.ts` seeded Rezepte, liest und speichert Einstellungen, erzeugt Wochenpläne lokal und schreibt Historieneinträge.
- Wochenpläne werden lokal beim ersten Zugriff auf die aktuelle Woche automatisch erzeugt, falls noch keiner gespeichert ist.
- `src/lib/offline-store.ts` bleibt für UI-nahe Snapshots wie aktive Gerichte und Einkaufs-Häkchen relevant und nutzt dafür dieselbe IndexedDB-Basis.
- `src/lib/db.ts` und `src/lib/store.ts` liegen noch als frühere serverseitige Zwischenstufe im Repository, sind aber nicht mehr Teil des primären PWA-Laufzeitpfads.

## Offline- und PWA-Zuschnitt
- Manifest und App-Icons sind vorhanden.
- Ein Service Worker ist vorhanden.
- Der Service Worker berücksichtigt den GitHub-Pages-Unterpfad und cached App-Shell sowie gleich-originäre `GET`-Requests.
- Manifest, Service-Worker-Registrierung und Metadaten bilden `start_url`, `scope` und Asset-Pfade relativ zum konfigurierten `basePath`.
- Einstellungen, Historie, Rezeptbestand und Wochenpläne werden lokal in IndexedDB gehalten und bleiben über App-Updates hinweg nutzbar, solange die Origin stabil bleibt.
- Der reale Offlinescope umfasst jetzt die fachlich zentralen Produktseiten inklusive lokaler Schreibzugriffe für Einstellungen und Wochenregenerierung.

## Technische Vorsichtspunkte
- Wegen Next.js 16 sollen aktuelle lokale Next-Dokumente in `node_modules/next/dist/docs/` vor größeren Änderungen geprüft werden.
- Die lokale Datenhaltung ist an dieselbe Origin gebunden; ein späterer Wechsel von `github.io`-Pfad oder Domain trennt installierte PWA und Datenbestand technisch.
- Browserdaten bleiben best-effort: manuelles Löschen oder Speicherdruck kann lokale Daten entfernen.
- Alte serverseitige Artefakte im Repository dürfen nicht versehentlich wieder in den neuen PWA-Hauptpfad hineingezogen werden.
