---
typ: uebersicht
status: aktiv
letzte_aktualisierung: 2026-04-24
quellen:
  - ../../01 Rohquellen/repo-root/2026-04-22 Repository-Iststand-Analyse.md
  - ../../01 Rohquellen/2026-04-24 Umstellung auf Tageskonzept.md
  - ../../../README.md
  - ../../../KODEX_STAND.md
  - ../../../package.json
  - ../../../next.config.ts
  - ../../../src/lib/local-db.ts
  - ../../../src/lib/local-store.ts
  - ../../../tests/domain.test.cjs
tags:
  - quellenlage
  - aktualitaet
---

# Quellenlage und Aktualität

## Bereits ausgewertete Kernquellen
- `README.md`
- `KODEX_STAND.md`
- `package.json`
- `AGENTS.md`
- `next.config.ts`
- `eslint.config.mjs`
- `public/service-worker.js`
- zentrale App-Dateien unter `src/app/`
- zentrale Fach- und Persistenzdateien unter `src/lib/`
- automatisierte Domain-Tests unter `tests/domain.test.cjs`
- ältere Server-/Deployment-Quellen wie `railway.toml`, `Dockerfile` und `data/planner.sqlite` sind weiterhin als historische Quellen bekannt, aber nicht mehr primär für den aktuellen PWA-Produktpfad

## Aussagekraft der aktuellen Quellenlage
- Direkt gelesene Code-Dateien sind für den verifizierten Funktionsstand die stärkste Quelle.
- `README.md` und `KODEX_STAND.md` sind auf das Tageskonzept, die lokale PWA-Ausrichtung und den GitHub-Pages-Pfad nachgezogen.
- `package.json` ist belastbar für Stack, Versionen und Skripte.
- `next.config.ts`, `.github/workflows/deploy-pages.yml`, Manifest und Service Worker belegen den statischen Exportpfad mit konfigurierbarem `basePath`.
- `src/lib/local-db.ts` und `src/lib/local-store.ts` sind die maßgeblichen Quellen für den aktuellen IndexedDB- und Tagesplanungsstand.
- `npm test`, `npm run lint` und der GitHub-Pages-Build mit `NEXT_PUBLIC_BASE_PATH=/plan-und-pfanne` wurden am 2026-04-24 erneut erfolgreich verifiziert.

## Noch gezielt zu vertiefen
- produktnaher Geräte- und Update-Test auf iPhone und Android
- routegenaue Offline-Tests für App-Shell, Tagesdetail, Kochansicht und Einkaufsliste
- Backup-, Export- und Gerätewechselpfad für lokale IndexedDB-Daten
- Rezeptnachschub über Dateiimport, Feed, App-Update oder manuellen Editor
- spätere Bereinigung alter Server-, Auth-, SQLite- und Scheduler-Artefakte

## Priorität für nächste Verifikationen
1. Installierte PWA auf echten Mobilgeräten
2. Offline- und Updateverhalten unter der GitHub-Pages-Origin
3. Backup- und Exportbedarf
4. Bereinigung oder bewusste Kapselung alter Serverpfade
