---
typ: prozess
status: aktiv
letzte_aktualisierung: 2026-04-24
quellen:
  - ../../../01 Rohquellen/repo-root/2026-04-22 Repository-Startquellen.md
  - ../../../README.md
  - ../../../package.json
tags:
  - lokaler-start
  - entwicklung
  - test
---

# Lokaler Start von Entwicklung und Test

## Standardstart
1. `npm install`
2. `npm run dev`
3. im Browser `http://localhost:3000` öffnen

## Handy-Test im selben WLAN
1. `npm run dev:handy`
2. eigene IPv4-Adresse ermitteln, zum Beispiel mit `ipconfig`
3. am Handy `http://DEINE-IP:3000` öffnen

## Verfügbare Standardskripte
- `npm run dev`
- `npm run dev:handy`
- `npm test`
- `npm run build`
- `npm run lint`

## Wichtige Hinweise
- Für eine echte Installation auf dem Handy braucht die App laut README eine `HTTPS`-Adresse.
- Der lokale Handy-Test dient primär zur Sicht- und Funktionsprüfung im eigenen WLAN.
- Vor größeren Umbauten an Next.js-spezifischen Stellen sollten die lokalen Next-Dokumente geprüft werden.
- `npm run dev` und `npm run build` sollten nicht parallel im selben Workspace gegen denselben `.next`-Ordner laufen.
- Wenn im Dev-Server plötzlich `ENOENT`-Fehler zu `.next/dev/routes-manifest.json`, `app/.../page.js` oder fehlenden `webpack/*.pack.gz` auftauchen, ist meist der generierte Next-Output inkonsistent statt der Anwendungscode kaputt.
- Bewährte Reparatur für diesen Zustand:
  laufenden Dev-Server beenden, den Ordner `.next` löschen und danach `npm run dev` neu starten.
- Wenn auf `http://localhost:3000` ein Browserfehler wie `Hydration failed`, alte Texte oder alte Styles auftauchen, obwohl der Dev-Server selbst `200` liefert, ist oft ein veralteter Service Worker oder Offline-Cache aktiv statt ein echter Serverfehler.
- Für die lokale Entwicklung sollte die PWA-Registrierung deshalb nicht aktiv bleiben; in diesem Projekt räumt der Dev-Modus alte Registrierungen und `plan-und-pfanne-offline*`-Caches auf `localhost` jetzt automatisch auf.
