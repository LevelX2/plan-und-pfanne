---
typ: status
status: aktiv
letzte_aktualisierung: 2026-04-22
quellen:
  - ../../01 Rohquellen/repo-root/2026-04-22 Repository-Iststand-Analyse.md
  - ../../../README.md
  - ../../../src/app/page.tsx
  - ../../../src/lib/store.ts
  - ../../../public/service-worker.js
tags:
  - status
  - projektstand
---

# Aktueller Projektstatus

## Umgesetzt
- Produktnahe App-Routen sind vorhanden: `/`, `/rezepte`, `/rezepte/[id]`, `/tage/[date]`, `/einkaufsliste`, `/einstellungen`, `/api/health` und `/api/scheduler/weekly`.
- Das Dashboard zeigt die aktuelle Woche, Tageskarten, Makroabweichungen, Planungsprofil, Rezeptanzahlen und Einkaufsumfang.
- Die Tagesansicht pro Datum ist vorhanden und verknüpft die Tagesplanung direkt mit den Rezeptdetails.
- Die Rezeptbibliothek ist nach Mahlzeitentyp gruppiert und bietet ausklappbare Zutaten- und Zubereitungsdetails sowie eine eigene Detailseite pro Rezept.
- Die Einkaufsliste wird aus dem aktuellen Wochenplan abgeleitet, nach Einkaufskategorien gruppiert und lokal mit Abhakstatus gespeichert.
- Die Einstellungslogik ist jetzt über eine reale Seite erreichbar; Speichern regeneriert die aktuelle Woche und führt zurück nach `/einstellungen`.
- SQLite ist nicht nur vorbereitet, sondern aktiv genutzt: `data/planner.sqlite` enthält Seed-Rezepte sowie bereits erzeugte Wochen- und Tagespläne mitsamt gespeicherten Mahlzeiten.
- Fachliche Kernmodule für Typen, Datumslogik, Formatierung, Datenbank, Store und Planungslogik sind angebunden und erzeugen die aktuelle Woche bei Bedarf automatisch.
- PWA-Basis mit Manifest, Icons, Service Worker und Anfrage auf persistenten Browser-Speicher ist vorhanden.
- `npm run lint` und `npm run build` liefen am 2026-04-22 erfolgreich durch; die Build-Ausgabe enthält weiterhin eine nicht blockierende Turbopack-Warnung zur NFT-Dateinachverfolgung.
- Die Scheduler-Route `/api/scheduler/weekly` ist vorhanden und per Request verifiziert; `force=1` erzwingt die Generierung auch außerhalb des Sonntags.

## Teilweise umgesetzt
- Der reale Offlinescope ist größer als im README beschrieben: Dashboard, Rezeptbibliothek und Einkaufsliste werden lokal abgesichert. Der Modus bleibt aber weitgehend lesend; serverseitige Änderungen funktionieren offline nicht.
- Railway-Deployment ist technisch vorbereitet; ein tatsächlich laufender Deploy ist aus dem Workspace selbst weiterhin nicht belegbar.
- Die Scheduler-Route ist lokal funktionsfähig, aber noch nicht an einen echten externen Cron- oder Hosting-Trigger angebunden.

## Offen
- Der Offlinescope, die Nutzungsgrenzen und das Synchronisationsversprechen sollten produktseitig noch expliziter geklärt werden.
- Der alte Ordner `C:\Users\Lui\OneDrive\Projekte\gluten freie Rezepte` ist noch als OneDrive-Reparse-Restzustand sichtbar und sollte kontrolliert entfernt oder bewusst als technischer Rest dokumentiert werden.

## Wichtige Grenzen
- Der Wochenplan wird heuristisch und zufallsbasiert erzeugt; identische Einstellungen führen daher nicht zwingend zu reproduzierbaren Ergebnissen.
- `next build` liefert weiterhin eine Warnung zur Turbopack-Dateinachverfolgung rund um den Datenbankpfad. Das ist kein aktueller Build-Blocker, aber ein technischer Nacharbeitskandidat.
