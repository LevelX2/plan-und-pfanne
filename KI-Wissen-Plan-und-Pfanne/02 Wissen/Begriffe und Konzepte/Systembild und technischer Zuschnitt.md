---
typ: konzept
status: aktiv
letzte_aktualisierung: 2026-04-30
quellen:
  - ../../../01 Rohquellen/2026-04-24 Umstellung auf Tageskonzept.md
  - ../../../README.md
  - ../../../next.config.ts
  - ../../../package.json
  - ../../../src/app/layout.tsx
  - ../../../src/app/manifest.ts
  - ../../../src/app/pwa-register.tsx
  - ../../../src/app/home-client.tsx
  - ../../../src/app/planen/page.tsx
  - ../../../src/app/tage/page.tsx
  - ../../../src/app/kochen/page.tsx
  - ../../../src/app/einkaufsliste/shopping-list-client.tsx
  - ../../../src/app/historie/page.tsx
  - ../../../src/app/rezepte/recipes-client.tsx
  - ../../../src/lib/local-db.ts
  - ../../../src/lib/local-store.ts
  - ../../../src/lib/planner.ts
  - ../../../src/lib/week-plan-selection.ts
  - ../../../public/service-worker.js
  - ../../../.github/workflows/deploy-pages.yml
tags:
  - systembild
  - architektur
  - nextjs
  - pwa
  - tagesplanung
---

# Systembild und technischer Zuschnitt

## Technischer Kern
- Next.js 16 mit App Router
- React 19
- TypeScript
- statischer Export für GitHub Pages
- lokale Persistenz über `IndexedDB`
- lokale Planungslogik ohne Serverpflicht

## Erkennbare Systembausteine
- `src/app/`: statisch exportierbare Seiten, PWA-Registrierung und querybasierte Detailansichten
- `src/lib/`: Fachlogik, lokale IndexedDB-Zugriffe, Seed-Daten, Einkaufslistenlogik und Planungsheuristik
- `public/`: statische Assets, PWA-Dateien und Service Worker
- `.github/workflows/`: Build- und Deploy-Pfad für GitHub Pages

## Laufzeit- und Deployment-Bild
- lokale Entwicklung über `npm run dev`
- Handy-Test im gleichen WLAN über `npm run dev:handy`
- produktiver Zielpfad über GitHub Pages mit statischem Export
- `next.config.ts` nutzt `output: "export"`, `trailingSlash: true`, `images.unoptimized: true` und einen buildzeitlichen `basePath`
- `.github/workflows/deploy-pages.yml` baut und veröffentlicht den Ordner `out`
- Ziel-Origin für den aktuellen PWA-Pfad ist `https://levelx2.github.io/plan-und-pfanne/`
- `npm run lint`, `npm run build` und ein Build mit `NEXT_PUBLIC_BASE_PATH=/plan-und-pfanne` sind für den Tagesplanungsstand erfolgreich verifiziert

## Aktuelle Route- und Rendering-Lage
- produktive Hauptseiten im Workspace:
  - `/`
  - `/planen`
  - `/tage`
  - `/kochen`
  - `/rezepte`
  - `/einkaufsliste`
  - `/historie`
  - `/einstellungen`
- Detailansichten laufen statisch über Query-Parameter:
  - `/tage?date=YYYY-MM-DD`
  - `/kochen?meal=<plannedMealId>`
- Die Produktseiten arbeiten clientseitig auf lokaler Datenbasis.
- Frühere Login-, Logout- und API-Platzhalterrouten wurden entfernt; der aktuelle Produktfluss hat keine Kontoverwaltung und keinen zentralen Scheduler.
- App-weite Fallback-Seiten für unerwartete Fehler und nicht gefundene Routen sind vorhanden.

## Persistenzbild
- `src/lib/local-db.ts` verwaltet die lokale App-Datenbank `gf-wochenplan-offline`.
- Die Datenbank steht aktuell auf Version `4`; Version `3` war die Umstellung auf das Tageskonzept, Version `4` ergänzt Rezept-Favoriten.
- Beim Upgrade von älteren lokalen Testständen werden die alten Wochenplan-Stores verworfen; es gibt bewusst keine Migration alter Testdaten.
- Aktuelle Stores:
  `snapshots`, `meta`, `settings`, `recipes`, `mealTypes`, `recipeDefaultMealTypeAssignments`, `userRecipeMealTypePreferences`, `userRecipeFavorites`, `plannedDays` und `plannedMeals`.
- `plannedDays.date` ist eindeutig; pro Datum gibt es maximal einen Tagesplan.
- `plannedMeals` speichert pro Slot Rezept, Mahlzeitentyp, Personenzahl, Aktivstatus, Einkaufslisten-Flag und Sortierung.
- App-Standardzuordnungen für Rezepte und nutzerseitige Rezeptpräferenzen sind getrennt, damit neue Seed-Daten Nutzeranpassungen nicht überschreiben.
- Rezept-Favoriten liegen getrennt im Store `userRecipeFavorites`, damit Markierungen nicht an Seed-Rezept-Updates gekoppelt sind.
- `src/lib/db.ts` und `src/lib/store.ts` liegen noch als frühere serverseitige Zwischenstufe im Repository, sind aber nicht Teil des primären PWA-Laufzeitpfads.

## Fachlicher Laufzeitfluss
- Der Startzustand erzeugt keinen Plan automatisch.
- Neue Pläne entstehen über `/planen` aus frei wählbarem Start- und Enddatum sowie einer Standard-Personenzahl.
- Überschneidungen mit bestehenden Tagesplänen werden vor Generierung oder Kopieren bestätigt.
- Tagesdetails unter `/tage` erlauben Rezepttausch, Personenzahl, Deaktivierung, Einkaufslisten-Flag und zusätzliche Snacks.
- Die Kochansicht unter `/kochen` öffnet eine konkrete geplante Mahlzeit mit temporär skalierbarer Personenzahl.
- Die Einkaufsliste aggregiert aktive und einkaufsrelevante Mahlzeiten eines frei gewählten Datumsbereichs.
- Die Historie arbeitet als Tagesliste und kann historische Tage oder Zeiträume in neue Zielzeiträume kopieren.

## Offline- und PWA-Zuschnitt
- Manifest und App-Icons sind vorhanden.
- Ein Service Worker ist vorhanden.
- Der Service Worker berücksichtigt den GitHub-Pages-Unterpfad und cached App-Shell sowie gleich-originäre `GET`-Requests.
- Manifest, Service-Worker-Registrierung und Metadaten bilden `start_url`, `scope` und Asset-Pfade relativ zum konfigurierten `basePath`.
- Einstellungen, Rezeptbestand, Rezeptpräferenzen, geplante Tage und geplante Mahlzeiten werden lokal gehalten und bleiben über App-Updates hinweg nutzbar, solange die Origin stabil bleibt.
- Die Einkaufsliste wird clientseitig aus diesen lokalen Plandaten erzeugt; Einkaufs-Häkchen sind im aktuellen Tageskonzept keine dauerhafte Kernpersistenz.

## Technische Vorsichtspunkte
- Wegen Next.js 16 sollen aktuelle lokale Next-Dokumente in `node_modules/next/dist/docs/` vor größeren Änderungen geprüft werden.
- Die lokale Datenhaltung ist an dieselbe Origin gebunden; ein späterer Wechsel von `github.io`-Pfad oder Domain trennt installierte PWA und Datenbestand technisch.
- Browserdaten bleiben best-effort: manuelles Löschen oder Speicherdruck kann lokale Daten entfernen.
- Alte serverseitige Artefakte im Repository dürfen nicht versehentlich wieder in den neuen PWA-Hauptpfad hineingezogen werden.
