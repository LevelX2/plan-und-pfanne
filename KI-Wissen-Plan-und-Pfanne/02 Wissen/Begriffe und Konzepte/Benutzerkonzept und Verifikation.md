---
typ: konzept
status: aktiv
letzte_aktualisierung: 2026-04-23
quellen:
  - ../../../src/lib/auth.ts
  - ../../../src/app/actions.ts
  - ../../../src/app/auth-actions.ts
  - ../../../src/app/anmelden/page.tsx
  - ../../../src/app/abmelden/page.tsx
  - ../../../src/app/page.tsx
  - ../../../src/app/home-client.tsx
  - ../../../src/app/einstellungen/page.tsx
  - ../../../src/app/einkaufsliste/page.tsx
  - ../../../src/app/api/auth/logout/route.ts
  - ../../../src/lib/local-store.ts
tags:
  - benutzer
  - authentifizierung
  - verifikation
  - datenschutz
  - einkaufsliste
---

# Benutzerkonzept, Verifikation und Datenzugriff

## Anlass
Der aktuelle Produktzuschnitt ist eine installierbare App für eine Person mit Daten auf dem Gerät.

Damit verschiebt sich auch das Benutzerkonzept:
- keine Pflicht-Anmeldung
- keine Session als Kern des Produktflusses
- keine serverseitige Nutzertrennung als Hauptmechanismus
- persönliche Daten bleiben lokal im Browser-Speicher derselben installierten PWA

## Zielbild
- Es gibt genau einen primären Anwender.
- Die App soll ohne Benutzerverwaltung direkt vom Handy aus nutzbar sein.
- Persönliche Daten wie Einstellungen, Historie, Wochenstände und Einkaufsfortschritt bleiben lokal auf dem Gerät.
- Der Rezeptbestand ist im aktuellen Stand ebenfalls lokal und wird zunächst aus Seed-Daten befüllt.

## Verifikation im aktuellen Produktmodell
Im aktuellen Produktmodell gibt es innerhalb der App derzeit keine eigentliche Benutzerverifikation.

Stattdessen gilt:
- die App-Origin auf GitHub Pages ist die technische Identität der installierten PWA
- der Datenzugriff erfolgt lokal innerhalb derselben Browser-Origin
- der Besitz des Geräts beziehungsweise des installierten Browser-Profils ersetzt die frühere Session-Logik

## Umgesetzter Workspace-Stand
- `src/lib/auth.ts` liefert im aktuellen Zuschnitt nur noch einen lokalen Platzhalter-Nutzer:
  `lokal@plan-und-pfanne.app`
- `requestLoginCode`, `verifyLoginCode`, Logout und Session-Prüfungen sind bewusst entschärft und bauen keinen echten Login mehr auf.
- `/anmelden` und `/abmelden` bleiben als neutrale Kompatibilitätsseiten erhalten, statt einen produktiven Auth-Flow auszuführen.
- Dashboard, Einstellungen, Rezepte, Tage und Einkaufsliste arbeiten ohne Pflicht-Login.
- Die fachlichen Daten liegen im lokalen Store statt in benutzerscharfer Serverpersistenz.

## Datenzugriff im aktuellen Zuschnitt
- Einstellungen, Wochenpläne, Historie und lokale Rezeptdaten liegen in IndexedDB.
- Aktive Gerichte und Einkaufs-Häkchen werden zusätzlich lokal pro Woche und Kontext gespeichert.
- Der aktuelle Zugriffsschutz ist damit nicht kontobasiert, sondern geräte- und originbasiert.

## Was der aktuelle Zuschnitt bewusst nicht bietet
- keine Mehrgeräte-Synchronisation
- keine serverseitige Trennung mehrerer Nutzer
- kein Teilen über Accounts oder Einladungen
- keine Wiederherstellung nach Geräteverlust ohne zukünftige Export- oder Backup-Funktion

## Frühere Zwischenstufe als Alternative, nicht als aktueller Stand
Im Workspace gab es zwischenzeitlich bereits einen passwortlosen E-Mail-Code-Ansatz mit Sessions und benutzerscharfem Datenzugriff.

Diese Richtung ist für den aktuellen lokalen PWA-Pfad nicht mehr der Zielzustand, bleibt aber als denkbare spätere Alternative relevant, falls das Produkt wieder auf
- Mehrgeräte-Nutzung
- Teilen
- serverseitigen Sync
- oder gehosteten Betrieb
umgestellt werden soll.

## Noch offene Punkte
- Ein Export- oder Backup-Konzept für lokale Daten fehlt noch.
- Für einen späteren Gerätewechsel gibt es noch keinen nutzerfreundlichen Wiederherstellungspfad.
- Wenn das Produktmodell erneut Richtung Hosting oder Mehrbenutzer kippt, muss das Benutzerkonzept bewusst neu entschieden statt stillschweigend reaktiviert werden.
