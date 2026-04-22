---
typ: konzept
status: aktiv
letzte_aktualisierung: 2026-04-22
quellen:
  - ../../../01 Rohquellen/repo-root/2026-04-22 Repository-Iststand-Analyse.md
  - ../../../src/lib/planner.ts
  - ../../../src/lib/store.ts
  - ../../../src/lib/data/demo-recipes.ts
tags:
  - fachlogik
  - rezepte
  - planung
---

# Produktbild und Kernlogik

## Fachlicher Kern
Die Anwendung verbindet Rezeptverwaltung mit automatisierter Wochenplanung. Die Planung arbeitet nicht bloß auf Ebene einzelner Rezepte, sondern auf Tagesplänen mit fester Mahlzeitenstruktur.

## Mahlzeitenmodell
- Frühstück
- Mittagessen
- Abendessen
- optional Snack

## Aktueller Rezeptpool
- 42 Demo-Rezepte sind im aktuellen Datenbestand vorhanden.
- Verteilung nach Mahlzeiten:
  - 10 Frühstücke
  - 12 Mittagessen
  - 11 Abendessen
  - 9 Snacks
- Glutenfreiheit ist im Demo-Bestand durchgängig gesetzt.

## Planungslogik im verifizierten Code
- Zielwerte werden pro Tag betrachtet.
- Die Tagesoptimierung orientiert sich an Makro-Zielwerten im Verhältnis `30 / 30 / 40`.
- Rezeptpools werden nach Mahlzeitentyp gebildet.
- Portionsfaktoren und Tages-Scoring werden berücksichtigt.
- Wiederholungen werden bestraft.
- Snacks werden genutzt, wenn `mealsPerDay >= 4`.
- Für jeden Tag werden viele Kandidaten erzeugt und der beste Score übernommen; die Wochenplanung bleibt dadurch heuristisch und zufallsbasiert.
- Als Zielkorridor gilt im aktuellen Code eine Abweichung von höchstens 5 Prozentpunkten je Makroverteilung.

## Rezeptanforderungen
- Glutenfreiheit ist als harte Filterbedingung vorgesehen.
- Der MVP arbeitet zunächst mit einem eingebauten Demo-Rezeptbestand.
- Rezepte enthalten Makros, Zutaten, Zubereitung, Tags und die Kennzeichnung `glutenFree = true`.

## Ableitungen für Folgefunktionen
- Einkaufsliste und Wochenübersicht hängen direkt am Wochenplan.
- Einstellungen wirken auf die Planungslogik und müssen als fachlich relevante Quelle mitgedacht werden.
- Detailseiten für Rezepte und Tagespläne sind fachlich eng mit der Planlogik verknüpft.

## Aktive Filter- und Steuerlogik
- `glutenFreeOnly` bleibt derzeit effektiv auf `true`.
- `vegetarian` filtert den Rezeptpool vor der Wochenplanung.
- `excludedIngredients` entfernt Rezepte, deren Zutaten exakt auf die ausgeschlossenen Namen passen.
- `reduceMeat` verschlechtert den Score für Fleischquellen wie Huhn, Pute und Rind.
- `maxRecipeRepeatsPerWeek` beeinflusst Wiederholungsstrafen zusätzlich.

## Einkaufslogik
- Die Einkaufsliste wird aus allen geplanten Mahlzeiten der Woche abgeleitet.
- Zutaten werden nach Einkaufskategorie gruppiert und mengenbasiert zusammengeführt.
- Mengen werden für die Anzeige kaufpraktisch gerundet, die exakte Menge bleibt in Klammern sichtbar, wenn sich die Rundung ändert.

## Offene Verifikation
- Die heuristische Planung ist verifiziert, aber ihre gewünschte Produktqualität und Erklärbarkeit sind noch nicht fachlich bewertet.
- Für Tagespläne und Einstellungen fehlt derzeit noch der vollständige UI-Durchstich, obwohl Teile der Fachlogik bereits vorhanden sind.
