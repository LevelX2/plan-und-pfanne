# Repository-Iststand-Analyse

## Zweck
Diese Rohquellen-Referenz hält fest, welche Repository-Dateien und Verifikationen am 2026-04-22 für die vertiefte Ist-Stand-Analyse ausgewertet wurden.

## Vollständig oder gezielt ausgewertete Dateien
- [`README.md`](../../../README.md)
- [`KODEX_STAND.md`](../../../KODEX_STAND.md)
- [`package.json`](../../../package.json)
- [`next.config.ts`](../../../next.config.ts)
- [`railway.toml`](../../../railway.toml)
- [`Dockerfile`](../../../Dockerfile)
- [`eslint.config.mjs`](../../../eslint.config.mjs)
- [`public/service-worker.js`](../../../public/service-worker.js)
- [`src/app/layout.tsx`](../../../src/app/layout.tsx)
- [`src/app/page.tsx`](../../../src/app/page.tsx)
- [`src/app/home-client.tsx`](../../../src/app/home-client.tsx)
- [`src/app/pwa-register.tsx`](../../../src/app/pwa-register.tsx)
- [`src/app/manifest.ts`](../../../src/app/manifest.ts)
- [`src/app/rezepte/page.tsx`](../../../src/app/rezepte/page.tsx)
- [`src/app/rezepte/recipes-client.tsx`](../../../src/app/rezepte/recipes-client.tsx)
- [`src/app/rezepte/[id]/page.tsx`](../../../src/app/rezepte/[id]/page.tsx)
- [`src/app/einkaufsliste/page.tsx`](../../../src/app/einkaufsliste/page.tsx)
- [`src/app/einkaufsliste/shopping-list-client.tsx`](../../../src/app/einkaufsliste/shopping-list-client.tsx)
- [`src/app/actions.ts`](../../../src/app/actions.ts)
- [`src/app/api/health/route.ts`](../../../src/app/api/health/route.ts)
- [`src/lib/types.ts`](../../../src/lib/types.ts)
- [`src/lib/date.ts`](../../../src/lib/date.ts)
- [`src/lib/format.ts`](../../../src/lib/format.ts)
- [`src/lib/db.ts`](../../../src/lib/db.ts)
- [`src/lib/planner.ts`](../../../src/lib/planner.ts)
- [`src/lib/store.ts`](../../../src/lib/store.ts)
- [`src/lib/offline-store.ts`](../../../src/lib/offline-store.ts)
- [`src/lib/data/demo-recipes.ts`](../../../src/lib/data/demo-recipes.ts)

## Verifikationen am 2026-04-22
- `npm run lint` erfolgreich.
- `npm run build` erfolgreich.
- Build-Warnung aus `next build`: Turbopack meldet eine zu breit nachverfolgte NFT-Dateiliste im Zusammenhang mit `next.config.ts`, `src/lib/db.ts`, `src/lib/store.ts` und `src/app/page.tsx`.
- Read-only-Prüfung von `data/planner.sqlite`:
  - 42 Rezepte
  - 1 Wochenplan
  - 7 Tagespläne
  - 28 geplante Mahlzeiten
  - 1 Einstellungsdatensatz
- Verteilung des Demo-Rezeptbestands:
  - 10 Frühstücksrezepte
  - 12 Mittagsrezepte
  - 11 Abendessen
  - 9 Snacks

## Beobachtete Abweichungen zwischen Quellen
- `KODEX_STAND.md` beschreibt die Produkt-UI noch weitgehend als offen, obwohl der Workspace bereits mehrere produktnahe Routen und Client-Komponenten enthält.
- `README.md` beschreibt den Offlinescope enger als der aktuelle Code: neben der Rezeptbibliothek werden auch Dashboard-Snapshot und Einkaufsliste lokal gespeichert.
