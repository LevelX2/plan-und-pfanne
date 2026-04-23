---
typ: risiko
status: aktiv
letzte_aktualisierung: 2026-04-23
quellen:
  - ../../../01 Rohquellen/repo-root/2026-04-22 Repository-Iststand-Analyse.md
  - ../../../01 Rohquellen/2026-04-23 Benutzerkonzept und nutzerscharfer Zugriff.md
  - ../../../01 Rohquellen/2026-04-23 Aktive Gerichte im Wochenplan und selektive Einkaufsliste.md
  - ../../../KODEX_STAND.md
  - ../../../README.md
  - ../../../src/app/actions.ts
  - ../../../src/lib/store.ts
tags:
  - offen
  - pruefbedarf
  - risiko
---

# Offene Fragen und Prüfbedarf

## Inzwischen geschlossene Punkte
- Die zuvor fehlenden Routen `/einstellungen`, `/tage/[date]` und `/api/scheduler/weekly` sind inzwischen real umgesetzt.
- `README.md` und `KODEX_STAND.md` wurden auf den aktuellen Produktstand nachgezogen.
- Die SQLite-Datei im Projektverzeichnis ist nun als lokaler Laufzeit- und Entwicklungszustand eingeordnet; `data/*.sqlite` bleibt unversioniert.
- Erwartete Formularfehler unter `/einstellungen` führen nicht mehr in harte Laufzeitabbrüche, sondern werden inline behandelt.
- Für unerwartete Fehler und nicht gefundene Seiten gibt es nutzerfreundliche Fallback-Seiten.
- Die Scheduler-Route ist in Production ohne `SCHEDULER_SECRET` nicht mehr offen erreichbar.
- Der Zielmix `vegetarisch / Fisch / Fleisch` ist jetzt als gekoppelter Dreiregler, als persistente Einstellung und als weiche Heuristik für Mittag- und Abendessen umgesetzt.

## Verbleibende Produktfragen
- Welches Produktversprechen soll offline gelten:
  - nur lesender Zugriff auf zuletzt geladene Inhalte
  - oder mittelfristig eine breitere, echte Offline-App mit Änderungen und Synchronisation
- Braucht die zufallsbasierte Wochenplanung später Reproduzierbarkeit, mehr Erklärbarkeit oder einen Vergleich zwischen altem und neuem Plan.
- Soll die neue Scheduler-Route nur ein technischer Endpunkt bleiben oder als echter Cron- beziehungsweise Hosting-Trigger produktiv angebunden werden.

## Technische Prüfstellen
- Der aktuelle Workspace arbeitet für Einstellungen, Wochenplan und Einkaufsliste noch singleton-basiert ohne verifizierte Benutzerkonten. Für einen öffentlich erreichbaren Betrieb ist die Umstellung auf benutzerscharfen Zugriff priorisiert.
- Der Service Worker cached breit genug für einen nützlichen Lesemodus, aber Cache-Invaliderung und Offline-Verhalten pro Route sind noch nicht explizit getestet.
- Alle Hauptseiten laufen mit `force-dynamic`, obwohl der Build statische Artefakte für einzelne Assets erzeugt. Die beabsichtigte Caching- und Renderstrategie sollte bei weiterem Ausbau bewusst entschieden werden.
- Die Scheduler-Route ist lokal und live verifiziert, aber der produktive Zielkontext für Secret-Verwaltung, Aufrufquelle und Monitoring ist noch nicht final entschieden.
- Der aktuelle Demo-Rezeptpool ist für eine exakte Dreierverteilung unausgewogen:
  - Snacks sind vollständig vegetarisch.
  - Frühstücke enthalten nur sehr wenige Fisch- und Fleischoptionen.
  - Abendessen sind deutlich fleischlastiger als vegetarisch.
  Daraus folgt weiterhin, dass der umgesetzte Zielmix bewusst nur als Näherung und nicht als starre Prozentgarantie behandelt wird.
- Der alte Ordner `C:\Users\Lui\OneDrive\Projekte\gluten freie Rezepte` ist weiterhin als OneDrive-Reparse-Restzustand sichtbar und nicht automatisch bereinigt.

## Empfohlene nächste Wissens- oder Umsetzungsprüfungen
1. Anmeldung, Verifikation und benutzerscharfen Datenzugriff auf Basis des neuen Benutzerkonzepts umsetzen.
2. Offlinescope in Produkttexten und Wissensbasis weiter konkretisieren: lesender Modus gegen echte Offline-Synchronisation.
3. Entscheiden, wie die Scheduler-Route produktiv ausgelöst, abgesichert und überwacht werden soll.
4. Den alten OneDrive-Restordner kontrolliert bereinigen, sobald klar ist, dass kein externer Dateiplatzhalter oder Rückfallbedarf mehr besteht.
