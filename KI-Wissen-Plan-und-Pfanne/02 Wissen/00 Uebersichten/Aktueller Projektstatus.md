---
typ: status
status: aktiv
letzte_aktualisierung: 2026-04-23
quellen:
  - ../../../README.md
  - ../../../next.config.ts
  - ../../../package.json
  - ../../../src/app/page.tsx
  - ../../../src/app/home-client.tsx
  - ../../../src/app/rezepte/page.tsx
  - ../../../src/app/rezepte/recipes-client.tsx
  - ../../../src/app/tage/page.tsx
  - ../../../src/app/einkaufsliste/shopping-list-client.tsx
  - ../../../src/app/einstellungen/page.tsx
  - ../../../src/app/einstellungen/settings-form.tsx
  - ../../../src/app/anmelden/page.tsx
  - ../../../src/app/abmelden/page.tsx
  - ../../../src/app/manifest.ts
  - ../../../src/app/pwa-register.tsx
  - ../../../src/lib/auth.ts
  - ../../../src/lib/local-db.ts
  - ../../../src/lib/local-store.ts
  - ../../../src/lib/offline-store.ts
  - ../../../public/service-worker.js
  - ../../../.github/workflows/deploy-pages.yml
tags:
  - status
  - projektstand
---

# Aktueller Projektstatus

## Umgesetzt
- Produktnahe App-Routen sind statisch exportierbar vorhanden:
  `/`, `/rezepte`, `/tage`, `/einkaufsliste`, `/einstellungen`, `/anmelden`, `/abmelden`, `/api/health`, `/api/auth/logout` und `/api/scheduler/weekly`.
- Das eigentliche Produktmodell ist jetzt eine installierbare App für eine Person mit Daten auf dem Gerät.
- Dashboard, Rezepte, Tagesansicht, Einkaufsliste und Einstellungen lesen und schreiben ihre Fachdaten lokal über `IndexedDB`.
- `src/lib/local-db.ts` und `src/lib/local-store.ts` bilden die neue lokale Persistenzschicht für:
  `settings`, `recipes`, `weekPlans`, `history`, `meta` und `snapshots`.
- Die Wochenplanung wird lokal auf dem Gerät erzeugt; `Woche neu generieren` und Einstellungsänderungen laufen ohne Server Action.
- Die Rezeptbibliothek und die Tagesansicht wurden für den statischen Export auf Query-Parameter umgestellt:
  `/rezepte?recipe=<id>` und `/tage?date=YYYY-MM-DD`.
- Die Rezeptbibliothek ist für größere Bestände jetzt zweistufig organisiert:
  Mahlzeiten-Gruppen starten eingeklappt, darin erscheinen kompakte Rezeptzeilen, und Zutaten plus Zubereitung öffnen sich erst pro ausgewähltem Rezept.
- Aktive Gerichte, Einkaufs-Häkchen und ähnliche UI-Zustände bleiben zusätzlich lokal im Offline-Store erhalten.
- Die App ist jetzt auf statischen Export mit GitHub Pages zugeschnitten:
  `output: "export"`, `trailingSlash: true`, `images.unoptimized: true` und buildzeitlicher `basePath`.
- Manifest, Service Worker und PWA-Registrierung berücksichtigen den GitHub-Pages-Unterpfad.
- Ein GitHub-Actions-Workflow für Pages ist vorhanden und baut die App mit `NEXT_PUBLIC_BASE_PATH` und `NEXT_PUBLIC_SITE_URL`.
- Die Login-, Logout-, Auth- und Scheduler-Pfade sind im aktuellen Zuschnitt nur noch buildfreundliche Hinweisseiten oder statische Platzhalter.
- `npm run lint` lief am 2026-04-23 erfolgreich durch.
- `npm run build` lief am 2026-04-23 erfolgreich durch.
- `npm run build` mit `NEXT_PUBLIC_BASE_PATH=/plan-und-pfanne` und `NEXT_PUBLIC_SITE_URL=https://levelx2.github.io/plan-und-pfanne` lief am 2026-04-23 ebenfalls erfolgreich durch.

## Teilweise umgesetzt
- Die lokale Datenhaltung deckt bereits Einstellungen, Historie, Seed-Rezepte und Wochenplanung ab; ein echter Rezeptimport oder Feed-Abgleich ist noch nicht umgesetzt.
- Export, Wiederherstellung und Gerätewechsel sind noch nicht als Produktfunktion vorhanden.
- Die früheren serverseitigen Module wie `src/lib/store.ts` und `src/lib/db.ts` liegen noch im Repository, sind aber nicht mehr Teil des neuen primären Laufzeitpfads.
- Die Hinweisseiten `/anmelden` und `/abmelden` bleiben aus Kompatibilitätsgründen erhalten.

## Offen
- Dateiimport oder Feed-Mechanik für neue Rezepte fehlt noch.
- Export- und Backup-Pfad für lokale Daten fehlt noch.
- Ein produktnaher Geräte- und Update-Test auf iPhone und Android steht noch aus.
- Die Wissens- und Codebereinigung des alten Railway-/Auth-Zuschnitts ist noch nicht vollständig abgeschlossen.

## Wichtige Grenzen
- Der Wochenplan wird heuristisch und zufallsbasiert erzeugt; identische Einstellungen führen daher nicht zwingend zu reproduzierbaren Ergebnissen.
- Der Zielmix `vegetarisch / Fisch / Fleisch` bleibt bewusst eine Näherung und keine harte Garantie.
- Lokale Daten sind an dieselbe Origin gebunden; ein späterer Wechsel von Domain oder GitHub-Pages-Pfad trennt die Daten technisch von der installierten PWA.
- Browserdaten können manuell gelöscht oder unter Speicherdruck verworfen werden; ohne Export- oder Backup-Funktion gibt es dann keinen Wiederherstellungspfad.
- Es gibt aktuell keinen serverseitigen Sync und keine Benutzerkonten; das Produkt ist auf `eine Person, primär ein Gerät` zugeschnitten.
