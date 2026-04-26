---
typ: konzept
status: aktiv
letzte_aktualisierung: 2026-04-26
quellen:
  - ../../../src/app/page.tsx
  - ../../../src/app/home-client.tsx
  - ../../../src/app/einstellungen/page.tsx
  - ../../../src/app/einkaufsliste/page.tsx
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
- Persönliche Daten wie Einstellungen, Rezeptpräferenzen, Tagespläne und Historie bleiben lokal auf dem Gerät.
- Der Rezeptbestand ist im aktuellen Stand ebenfalls lokal und wird zunächst aus Seed-Daten befüllt.

## Verifikation im aktuellen Produktmodell
Im aktuellen Produktmodell gibt es innerhalb der App derzeit keine eigentliche Benutzerverifikation.

Stattdessen gilt:
- die App-Origin auf GitHub Pages ist die technische Identität der installierten PWA
- der Datenzugriff erfolgt lokal innerhalb derselben Browser-Origin
- der Besitz des Geräts beziehungsweise des installierten Browser-Profils ersetzt die frühere Session-Logik

## Umgesetzter Workspace-Stand
- Frühere Login-, Logout- und Auth-Platzhalter wurden aus dem App-Routing entfernt.
- Es gibt keinen aktuellen Kompatibilitätsbedarf für `/anmelden`, `/abmelden` oder frühere statische Auth-/Scheduler-API-Pfade.
- Dashboard, Einstellungen, Rezepte, Tage und Einkaufsliste arbeiten ohne Pflicht-Login.
- Die fachlichen Daten liegen im lokalen Store statt in benutzerscharfer Serverpersistenz.

## Datenzugriff im aktuellen Zuschnitt
- Einstellungen, Tagespläne, geplante Mahlzeiten, Historie und lokale Rezeptdaten liegen in IndexedDB.
- Aktivstatus und Einkaufslisten-Berücksichtigung liegen direkt an der geplanten Mahlzeit über `isEnabled` und `includeInShoppingList`.
- Einkaufshäkchen sind im aktuellen Tageskonzept kein langlebiger Kernzustand der lokalen Datenbank.
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
