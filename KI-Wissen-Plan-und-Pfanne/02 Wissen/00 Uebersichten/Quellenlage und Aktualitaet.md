---
typ: uebersicht
status: aktiv
letzte_aktualisierung: 2026-04-22
quellen:
  - ../../01 Rohquellen/repo-root/2026-04-22 Repository-Iststand-Analyse.md
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
- `railway.toml`
- `Dockerfile`
- `eslint.config.mjs`
- `public/service-worker.js`
- zentrale App-Dateien unter `src/app/`
- zentrale Fach- und Persistenzdateien unter `src/lib/`
- Read-only-Sichtung von `data/planner.sqlite`
- Verifikation durch `npm run lint` und `npm run build`

## Aussagekraft der aktuellen Quellenlage
- Direkt gelesene Code-Dateien sind für den verifizierten Funktionsstand die stärkste Quelle.
- `README.md` ist nützlich für Start, PWA-Ansatz und Deployment-Hinweise, bildet den realen Offlinescope aber nicht mehr vollständig ab.
- `KODEX_STAND.md` liefert ein gutes Zielbild und einen strukturierten Zwischenstand, ist für den aktuellen UI-Stand jedoch teilweise veraltet.
- `package.json` ist belastbar für Stack, Versionen und Skripte.
- `data/planner.sqlite` bestätigt, dass Seed-Daten und mindestens ein real erzeugter Wochenplan bereits vorliegen.
- Build und Lint belegen, dass der aktuelle Stand technisch grundsätzlich lauffähig ist, zeigen aber auch eine relevante Build-Warnung.

## Noch gezielt zu vertiefen
- tatsächliches Nutzerbild für fehlende Routen `/einstellungen` und `/tage/[date]`
- Entscheidung, ob und wie eine Scheduler-Route produktiv aktiviert werden soll
- Umgang mit der Turbopack-Warnung zur breiten Dateinachverfolgung
- genaues Produktversprechen für Offline-Nutzung, Synchronisation und Schreibzugriffe
- gewünschter Zielzustand für Deployment, Backup und Umgang mit bestehender SQLite-Demo- oder Nutzdatenlage

## Priorität für nächste Verifikationen
1. Fehlende oder nur indirekt referenzierte Routen
2. Offlinescope und Synchronisationsgrenzen
3. Scheduler- und Einstellungsfluss
4. Deployment- und Build-Warnung
