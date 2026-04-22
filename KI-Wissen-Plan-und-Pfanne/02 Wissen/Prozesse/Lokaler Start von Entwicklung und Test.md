---
typ: prozess
status: aktiv
letzte_aktualisierung: 2026-04-22
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
- `npm run build`
- `npm run lint`

## Wichtige Hinweise
- Für eine echte Installation auf dem Handy braucht die App laut README eine `HTTPS`-Adresse.
- Der lokale Handy-Test dient primär zur Sicht- und Funktionsprüfung im eigenen WLAN.
- Vor größeren Umbauten an Next.js-spezifischen Stellen sollten die lokalen Next-Dokumente geprüft werden.
