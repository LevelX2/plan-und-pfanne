---
typ: entscheidung
status: aktiv
letzte_aktualisierung: 2026-04-24
quellen:
  - ../../../01 Rohquellen/repo-root/2026-04-22 Repository-Startquellen.md
  - ../../../01 Rohquellen/2026-04-23 Benutzerkonzept und nutzerscharfer Zugriff.md
  - ../../../01 Rohquellen/2026-04-24 Umstellung auf Tageskonzept.md
  - ../../../KODEX_STAND.md
  - ../Begriffe und Konzepte/Benutzerkonzept und Verifikation.md
tags:
  - entscheidungen
  - mvp
---

# MVP-Leitentscheidungen

## Bisher erkennbare Leitentscheidungen
- Glutenfreiheit als harte fachliche Bedingung
- datumsbezogene Tagesplanung statt starrem Wochenplanmodell
- eingebauter Rezeptbestand als Startdatenbasis
- installierbare PWA als primärer Produktpfad
- Datenhaltung auf dem Gerät statt Kontologik im normalen App-Fluss
- Rezeptnachschub später optional über Import oder App-Update
- freie Zeitraumgenerierung ohne automatische Erstplanung
- pro Datum maximal ein Tagesplan
- Rezept-Kochansicht aus dem konkreten geplanten Mahlzeiten-Slot heraus
- Personenzahl skaliert Zutaten, Einkaufsliste und Kochansicht; Makros bleiben Tagesorientierung pro Person

## Historische Einordnung
- Der Workspace enthielt zwischenzeitlich auch einen serverzentrierten Zwischenstand mit Login, Sessions und nutzerbezogenen Daten.
- Diese Zwischenstufe ist nicht mehr das aktuelle Produktmodell, bleibt aber als technischer Vorzustand im Repository und in Teilen der Dokumentation sichtbar.
- Das frühere Wochenplanmodell ist ebenfalls durch das Tageskonzept abgelöst. Alte lokale Testdaten müssen nicht erhalten oder migriert werden.

## Einordnung
Diese Entscheidungen sind aus dem aktuellen Dokumentationsstand ableitbar. Sie gelten als belastbare Arbeitsannahmen, sollten aber bei größeren Produktänderungen ausdrücklich aktualisiert oder bestätigt werden.
