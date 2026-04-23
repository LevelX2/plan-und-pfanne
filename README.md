# Plan und Pfanne

`Plan und Pfanne` wird aktuell auf eine lokale, statisch exportierbare PWA für GitHub Pages umgestellt.

Der Zielpfad ist:

- Auslieferung als installierbare PWA über GitHub Pages
- stabile App-Origin unter `https://<owner>.github.io/<repo>/`
- lokale Nutzung auf dem Handy
- keine Pflicht zu Benutzerkonten, Sessions oder serverseitigen APIs im Pages-Zielpfad

## Aktueller Zuschnitt des Pages-Zielpfads

Der GitHub-Pages-Build ist jetzt auf `Next.js static export` zugeschnitten:

- `output: "export"` in `next.config.ts`
- `trailingSlash: true` für statische Verzeichnisrouten
- `basePath` über `NEXT_PUBLIC_BASE_PATH`, damit die App sauber unter `/<repo>/` läuft
- PWA-Manifest, Service Worker und Registrierung berücksichtigen diesen Unterpfad
- GitHub Actions baut und deployt nach `out/`

Wichtig:

- Der frühere servergebundene Login ist im Pages-Zielpfad bewusst entschärft.
- Die früheren API-Routen liefern dort nur noch statische Legacy-Hinweise.
- Die vollständige lokale Datenhaltung wird in weiteren Schritten clientseitig ausgebaut.

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Für Tests auf dem Handy im selben WLAN:

```bash
npm run dev:handy
```

Dann die lokale IPv4-Adresse im Browser des Handys öffnen, zum Beispiel `http://192.168.178.23:3000`.

## Statischen Build lokal prüfen

```bash
npm run lint
npm run build
npm run preview
```

`npm run preview` serviert den Inhalt aus `out/` und entspricht damit dem GitHub-Pages-Zielpfad deutlich besser als ein klassischer Next-Server.

## GitHub Pages aktivieren

In GitHub:

1. Repository öffnen
2. `Settings`
3. `Pages`
4. `Build and deployment`
5. `Source = GitHub Actions`

Der Workflow liegt unter [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml).

## Basis-Pfad und URL

Standardmäßig baut der Workflow für eine GitHub-Projektseite:

- `NEXT_PUBLIC_BASE_PATH=/<repo>`
- `NEXT_PUBLIC_SITE_URL=https://<owner>.github.io/<repo>`

Für dieses Repository ist die erwartete App-URL also:

- `https://levelx2.github.io/plan-und-pfanne/`

Optional können später Repository-Variablen gesetzt werden:

- `PAGES_BASE_PATH`
- `PAGES_SITE_URL`

Damit lässt sich ein späterer Wechsel auf eine eigene Domain vorbereiten, ohne den Workflow neu zu schreiben.

## PWA-Verhalten unter GitHub Pages

Die PWA ist auf den GitHub-Pages-Unterpfad zugeschnitten:

- `manifest.ts` prefixiert `start_url`, `scope` und Icon-Pfade mit dem aktiven `basePath`
- `pwa-register.tsx` registriert den Service Worker unter `${basePath}/service-worker.js`
- `public/service-worker.js` leitet Cache-Scope und Offline-Fallbacks dynamisch aus `self.registration.scope` ab

Dadurch bleiben Manifest, Service Worker und Offline-Fallbacks auch unter `/<repo>/` konsistent.

## Bekannte Grenzen des aktuellen Migrationsstands

- Die Seiten für Einstellungen und Wochen-Neugenerierung zeigen im Pages-Zielpfad derzeit noch transparente Legacy-Hinweise statt echter lokaler Persistenz.
- Die früheren Routen `/anmelden`, `/abmelden` und `/api/*` bleiben als kompatible Hinweisrouten erhalten, übernehmen aber keine echte Serverfunktion mehr.
- Für den vollständigen Static-Export müssen dynamische Seiten außerhalb dieses Plattformbereichs weiterhin auf statische Parameter oder andere exportfähige Pfade zugeschnitten werden.

## Relevante Dateien für diesen Plattformpfad

- [next.config.ts](next.config.ts)
- [public/service-worker.js](public/service-worker.js)
- [src/app/layout.tsx](src/app/layout.tsx)
- [src/app/manifest.ts](src/app/manifest.ts)
- [src/app/pwa-register.tsx](src/app/pwa-register.tsx)
- [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)

## Referenzen

- [Next.js: Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [GitHub Docs: Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
