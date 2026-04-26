---
typ: status
status: aktiv
letzte_aktualisierung: 2026-04-26
quellen:
  - ../../../01 Rohquellen/2026-04-24 Umstellung auf Tageskonzept.md
  - ../../../README.md
  - ../../../KODEX_STAND.md
  - ../../../src/app/home-client.tsx
  - ../../../src/app/planen/page.tsx
  - ../../../src/app/tage/page.tsx
  - ../../../src/app/kochen/page.tsx
  - ../../../src/app/rezepte/recipes-client.tsx
  - ../../../src/app/einkaufsliste/shopping-list-client.tsx
  - ../../../src/app/historie/page.tsx
  - ../../../src/app/einstellungen/page.tsx
  - ../../../src/lib/local-db.ts
  - ../../../src/lib/local-store.ts
  - ../../../src/lib/planner.ts
  - ../../../src/lib/types.ts
tags:
  - status
  - projektstand
---

# Aktueller Projektstatus

## Umgesetzt
- Die App ist fachlich vom starren Wochenplanmodell auf ein flexibles Tagesplanmodell umgestellt.
- Pro Datum gibt es maximal einen lokalen Tagesplan; ein Planzeitraum ist Herkunfts- beziehungsweise Erstellungsinformation.
- Produktive statisch exportierbare Routen sind vorhanden:
  `/`, `/planen`, `/tage`, `/kochen`, `/rezepte`, `/einkaufsliste`, `/historie` und `/einstellungen`.
- Frühere Login-, Logout- und statische API-Platzhalterrouten wurden entfernt; es gibt keinen aktuellen Kompatibilitätsbedarf für diese Pfade.
- Die lokale Persistenz nutzt IndexedDB mit Stores für:
  `settings`, `recipes`, `mealTypes`, `recipeDefaultMealTypeAssignments`, `userRecipeMealTypePreferences`, `plannedDays`, `plannedMeals`, `meta` und `snapshots`.
- Alte Wochenplan-Testdaten werden mit dem neuen lokalen Schema nicht migriert.
- Der Generator erzeugt frei wählbare Datumsbereiche, prüft Überschneidungen und überschreibt bestehende Tage erst nach Bestätigung.
- Das Tagesdetail erlaubt Gerichtstausch, Personenzahl je Mahlzeit, Deaktivieren, Einkaufslisten-Flag und zusätzliche Snacks.
- Jede aktive geplante Mahlzeit kann direkt in eine Rezept-Kochansicht geöffnet werden.
- Die Kochansicht übernimmt die geplante Personenzahl und erlaubt temporäres Skalieren, ohne die Planung zurückzuschreiben.
- Die Rezeptseite pflegt Rezeptzulassung und Gewichtung je Mahlzeitentyp, bietet eine Rezeptsuche über Zutaten und Zubereitungstexte und zeigt Rezeptdetails mit Umschaltung zwischen Zubereitung und Zutaten.
- Mittagessen und Abendessen sind standardmäßig gegenseitig zulässig; Frühstück und Snack bleiben standardmäßig getrennt.
- Die Einkaufsliste wird aus einem frei gewählten Datumsbereich erzeugt und berücksichtigt aktive Mahlzeiten mit Einkaufslisten-Flag.
- Die Historie zeigt geplante Tage und kann Quellzeiträume in neue Zielzeiträume kopieren.
- Die Einstellungen enthalten Standard-Personenzahl, Kalorienziel, Makroziele, Eiweißziel pro Person über Körpergewicht und g/kg, Snacks, Zielmix, ausgeschlossene Zutaten und das Löschen alter Pläne.
- Ein automatisierter Domain-Testlauf über `npm test` deckt zentrale Tageskonzept-Regeln für Datum, Eiweißziel, Tagesbewertung und Einkaufsliste ab.
- `npm test`, `npm run lint`, `npm run build` und der GitHub-Pages-Build mit `NEXT_PUBLIC_BASE_PATH=/plan-und-pfanne` sind am 2026-04-24 erfolgreich gelaufen.

## Teilweise umgesetzt
- Der alte Server-/SQLite-Pfad liegt weiterhin im Repository, ist aber nicht der primäre PWA-Laufzeitpfad.
- Der historische Begriff `WeekPlan` existiert noch als technische Kompatibilität in einigen Typen und Legacy-Modulen; die Produktoberfläche arbeitet jedoch auf Tagesplanung.
- Einkaufshäkchen sind in der neuen Einkaufsliste aktuell UI-Zustand während der Ansicht; ein langlebiger Abhakzustand pro Datumsbereich ist kein Schwerpunkt des Tageskonzept-Umbaus.

## Offen
- Dateiimport oder Feed-Mechanik für neue Rezepte fehlt weiterhin.
- Export- und Backup-Pfad für lokale Daten fehlt weiterhin.
- Ein produktnaher Geräte- und Update-Test auf iPhone und Android steht noch aus.
- Browser- oder Komponenten-Tests für komplette UI-Flows wie Überschneidungswarnung, Tagesdetail-Bearbeitung, Kochansicht und Historie-Kopieren fehlen weiterhin.
- Eine spätere Bereinigung der noch ungenutzten Legacy-Servermodule kann separat erfolgen.

## Wichtige Grenzen
- Die Planung bleibt heuristisch und zufallsbasiert; identische Einstellungen führen nicht zwingend zu reproduzierbaren Ergebnissen.
- Der Zielmix `vegetarisch / Fisch / Fleisch` bleibt bewusst eine Näherung und keine harte Garantie.
- Lokale Daten sind an dieselbe Origin gebunden; ein späterer Wechsel von Domain oder GitHub-Pages-Pfad trennt die Daten technisch von der installierten PWA.
- Browserdaten können manuell gelöscht oder unter Speicherdruck verworfen werden; ohne Export- oder Backup-Funktion gibt es dann keinen Wiederherstellungspfad.
