---
typ: konzept
status: aktiv
letzte_aktualisierung: 2026-04-23
quellen:
  - ../../../01 Rohquellen/repo-root/2026-04-22 Repository-Iststand-Analyse.md
  - ../../../01 Rohquellen/2026-04-23 Aktive Gerichte im Wochenplan und selektive Einkaufsliste.md
  - ../../../01 Rohquellen/externe-quellen/2026-04-23 Glutenfreie Rezeptquellen BBC Good Food.md
  - ../../../src/app/home-client.tsx
  - ../../../src/app/einkaufsliste/shopping-list-client.tsx
  - ../../../src/lib/planner.ts
  - ../../../src/lib/store.ts
  - ../../../src/lib/week-plan-selection.ts
  - ../../../src/lib/data/demo-recipes.ts
  - ../../../src/lib/data/imported-recipes.ts
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
- 70 Seed-Rezepte sind im aktuellen Datenbestand vorhanden.
- Darunter sind 28 zusätzliche glutenfreie Rezepte, die am 2026-04-23 aus externen Webquellen strukturiert in den Seed-Bestand übernommen wurden.
- Verteilung nach Mahlzeiten:
  - 17 Frühstücke
  - 19 Mittagessen
  - 20 Abendessen
  - 14 Snacks
- Glutenfreiheit ist im Seed-Bestand durchgängig gesetzt.

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
- Extern recherchierte Rezepte werden derzeit als kuratierte Seed-Datensätze in den Repository-Bestand zurückgeführt, nicht als lose Laufzeitimporte.
- Rezepte enthalten Makros, Zutaten, Zubereitung, Tags und die Kennzeichnung `glutenFree = true`.

## Ableitungen für Folgefunktionen
- Einkaufsliste und Wochenübersicht hängen direkt am Wochenplan.
- Einstellungen wirken auf die Planungslogik und müssen als fachlich relevante Quelle mitgedacht werden.
- Detailseiten für Rezepte und Tagespläne sind fachlich eng mit der Planlogik verknüpft.

## Aktive Filter- und Steuerlogik
- `glutenFreeOnly` bleibt derzeit effektiv auf `true`.
- `vegetarianSharePct`, `fishSharePct` und `meatSharePct` bilden einen gekoppelten Zielmix, der zusammen immer `100 %` ergibt.
- Dieser Zielmix wirkt im aktuellen Workspace als weiche Verteilung für `Mittagessen` und `Abendessen`.
- Frühstück und Snack bleiben davon ausgenommen, weil der aktuelle Rezeptpool dort fachlich unausgewogen ist.
- `excludedIngredients` entfernt Rezepte, deren Zutaten exakt auf die ausgeschlossenen Namen passen.
- `maxRecipeRepeatsPerWeek` beeinflusst Wiederholungsstrafen zusätzlich.

## Zielmix vegetarisch, Fisch und Fleisch
- Die Bedienung erfolgt im aktuellen Workspace über drei gekoppelte Regler im Einstellungsformular.
- Beim Verschieben eines Reglers werden die beiden übrigen automatisch neu verteilt, damit zusammen immer `100 %` erhalten bleiben.
- Die aktuelle Datenbank speichert dafür persistente Prozentwerte; bestehende lokale Datenbanken werden beim Start automatisch migriert.
- Der Planer behandelt den Mix bewusst als weiches Ziel statt als harten Filter, damit auch bei unausgewogenem Rezeptpool weiterhin ein Wochenplan erzeugbar bleibt.
- Im Dashboard und in den Einstellungen wird der aktive Mix als Teil des Planungsprofils sichtbar angezeigt.
- Die Rezeptbibliothek selbst wird durch den Mix nicht hart eingeschränkt; der Mix steuert die Wochenplanung, nicht die Sichtbarkeit der Rezepte.

## Einkaufslogik
- Die Einkaufsliste kann entweder aus allen geplanten Mahlzeiten der Woche oder nur aus aktiv ausgewählten Mahlzeiten abgeleitet werden.
- Zutaten werden nach Einkaufskategorie gruppiert und mengenbasiert zusammengeführt.
- Mengen werden für die Anzeige kaufpraktisch gerundet, die exakte Menge bleibt in Klammern sichtbar, wenn sich die Rundung ändert.

## Aktive Gerichte innerhalb des Wochenplans
- Zusätzlich zum erzeugten Wochenplan soll es einen separaten Auswahlzustand für geplante Gerichte geben.
- Dieser Auswahlzustand ist fachlich kein neuer Wochenplan, sondern eine nutzerseitige Aktivierung einzelner bereits geplanter Mahlzeiten.
- Die Aktivierung ist im aktuellen Workspace pro geplanter Mahlzeit direkt in der Wochenübersicht ein- und ausschaltbar.
- Der Initialzustand ist leer: Nach einer neuen Woche ist zunächst noch kein Gericht aktiv ausgewählt.
- Die Einkaufsliste unterstützt im aktuellen Workspace zwei Sichten:
  - alle geplanten Gerichte der Woche
  - nur aktiv ausgewählte Gerichte
- Wenn keine Gerichte aktiv sind und die Sicht auf aktive Gerichte steht, erscheint ein expliziter Leerzustand statt einer leeren, missverständlichen Zutatenliste.
- Die aktive Auswahl und der Listenmodus werden derzeit lokal pro Woche im Browser gespeichert; eine benutzerscharfe serverseitige Persistenz ist noch nicht umgesetzt.

## Offene Verifikation
- Die heuristische Planung ist verifiziert, aber ihre gewünschte Produktqualität und Erklärbarkeit sind noch nicht fachlich bewertet.
- Für Tagespläne und Einstellungen fehlt derzeit noch der vollständige UI-Durchstich, obwohl Teile der Fachlogik bereits vorhanden sind.
