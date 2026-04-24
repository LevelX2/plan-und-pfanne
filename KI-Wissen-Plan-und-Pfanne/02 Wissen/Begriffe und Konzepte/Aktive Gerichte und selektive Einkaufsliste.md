---
typ: konzept
status: aktiv
letzte_aktualisierung: 2026-04-23
quellen:
  - ../../../01 Rohquellen/2026-04-23 Aktive Gerichte im Wochenplan und selektive Einkaufsliste.md
  - ../../../src/app/page.tsx
  - ../../../src/app/home-client.tsx
  - ../../../src/app/einkaufsliste/page.tsx
  - ../../../src/app/einkaufsliste/shopping-list-client.tsx
  - ../../../src/lib/store.ts
  - ../../../src/lib/offline-store.ts
tags:
  - wochenplan
  - einkaufsliste
  - auswahl
  - offline
---

# Aktive Gerichte und selektive Einkaufsliste

## Zielbild
Der erzeugte Wochenplan bleibt vollständig erhalten. Zusätzlich soll der Nutzer einzelne bereits geplante Mahlzeiten aktivieren oder deaktivieren können, um daraus einen aktuellen Kochfokus für dieselbe Woche abzuleiten. Die Einkaufsliste soll wahlweise alle geplanten Gerichte oder nur die aktiv ausgewählten Gerichte berücksichtigen.

## Fachliche Grundentscheidung
- Es gibt weiterhin genau einen Wochenplan pro Woche.
- `Aktive Gerichte` sind kein zweiter Wochenplan und kein Filter auf den Planbestand.
- Die aktive Auswahl ist ein separater App-Zustand über bereits geplanten Mahlzeiten.
- Dadurch bleiben Wochenübersicht, Tagesansichten, Einkaufslogik und spätere Persistenz logisch sauber getrennt.

## Ebene der Auswahl
- Die Auswahl soll auf Ebene der geplanten Mahlzeit erfolgen, nicht nur auf Ebene des Rezepts.
- Wenn dasselbe Rezept mehrmals in derselben Woche vorkommt, muss jeder geplante Vorkommensfall getrennt steuerbar sein.
- Eine geeignete fachliche Identität ist daher nicht nur `recipeId`, sondern eine Kombination wie:
  - `date`
  - `mealType`
  - `recipeId`
- Falls später mehrere Mahlzeiten desselben Typs pro Tag möglich werden, braucht die Identität zusätzlich eine echte `plannedMealId`.

## Empfohlenes Zustandsmodell
### 1. Basis-Wochenplan
- enthält alle erzeugten Tage und Mahlzeiten der Woche
- bleibt unverändert sichtbar und fachlich vollständig

### 2. Aktive-Gerichte-Auswahl
- Datentyp als Menge von Meal-Keys, zum Beispiel `selectedMealKeys: string[]`
- Initialzustand leer
- ändert nur die nutzerseitige Selektion, nicht den Plan selbst

### 3. Sichtmodus der Einkaufsliste
- `active-only`
- `all-planned`
- Empfohlener Standard: `active-only`

## Begründung für den empfohlenen Standard
- Der Nutzerwunsch zielt auf einen tatsächlichen Kochfokus, nicht bloß auf eine alternative Anzeige.
- Bei leerer Auswahl ist ein klarer Leerzustand verständlicher als eine implizit vollständig befüllte Liste.
- `all-planned` bleibt als bewusste Vollansicht weiterhin wichtig und soll schnell erreichbar bleiben.

## Empfohlenes UI-Verhalten
### Wochenübersicht
- Jede Mahlzeit erhält einen klaren Schalter `aktiv` oder `nicht aktiv`.
- Zusätzlich sinnvolle Komfortaktionen:
  - `Alle auswählen`
  - `Alle abwählen`
  - `Tag auswählen`
  - `Tag abwählen`
- Die Wochenübersicht soll neben dem Wochentitel oder in einer Statuszeile sichtbar machen:
  - wie viele Mahlzeiten geplant sind
  - wie viele davon aktuell aktiv sind
- Der sichtbare Tagesstatus soll den Initialzustand ausdrücklich von einer Teilauswahl trennen:
  - `noch nicht aktiv`, wenn an diesem Tag noch keine Mahlzeit aktiviert ist
  - `teilweise aktiv`, wenn nur ein Teil der geplanten Mahlzeiten aktiviert ist
  - `aktiv geplant`, wenn alle geplanten Mahlzeiten dieses Tages aktiviert sind
- Statuslabel und Aktiv-Zähler eines Tages sollen möglichst nah beieinander stehen, damit nicht oben ein Zustand und weiter unten getrennt eine zweite Aktiv-Anzeige gesucht werden muss.
- Wenn an einem Tag noch keine Mahlzeit aktiviert ist, soll kein farbiges Aktiv-Statuslabel erscheinen; in diesem Leerzustand reicht ein neutraler Zähler wie `0 von 4 aktiv`.
- Verdichtete Tagessummen wie `Kalorien`, `Protein`, `Kohlenhydrate` und `Fett` sollen auf kleineren Karten responsiv auf mindestens zwei Kacheln pro Zeile schrumpfen können, statt unnötig früh auf Einzelspalten zu fallen.

### Einkaufsliste
- Oben ein sichtbarer Modus-Schalter zwischen:
  - `Aktive Gerichte`
  - `Alle geplanten Gerichte`
- Im Modus `Aktive Gerichte` und leerer Auswahl erscheint ein expliziter Leerzustand, zum Beispiel:
  - `Du hast noch keine Gerichte aktiviert.`
  - dazu ein direkter Link oder Hinweis zurück zur Wochenübersicht
- Im Modus `Alle geplanten Gerichte` wird weiterhin die vollständige Wochenliste gezeigt.

### Tagesansicht
- Optional dieselbe Aktivierungslogik pro Mahlzeit anzeigen, damit die Steuerung nicht nur auf dem Dashboard möglich ist.
- Für das MVP ist die Wochenübersicht als primärer Steuerort ausreichend.

## Einkaufslogik
- Die bestehende Aggregation von Zutaten nach Kategorie, Name und Einheit bleibt unverändert.
- Neu ist nur die Eingabemenge:
  - entweder alle geplanten Mahlzeiten der Woche
  - oder nur die aktiv ausgewählten Mahlzeiten
- Damit bleibt die bestehende Rundungs- und Gruppierungslogik wiederverwendbar.

## Persistenz im aktuellen Produktmodell
- Die Auswahl aktiver Gerichte und der zuletzt verwendete Sichtmodus der Einkaufsliste werden im aktuellen Workspace auf dem Gerät gespeichert.
- Der Schlüssel enthält mindestens die Woche, zum Beispiel über `startDate`.
- Sinnvoll bleibt eine Trennung zwischen:
  - Auswahlzustand der Woche
  - Abhakzustand einer konkreten Listenansicht

## Spätere Alternativen
- Falls das Produkt später Mehrgeräte-Nutzung oder Kontologik bekommt, kann dieselbe Auswahl zusätzlich an einen Nutzerkontext gebunden werden.
- Diese spätere Erweiterung ändert nichts an der fachlichen Trennung zwischen vollständigem Wochenplan, aktiver Auswahl und Sichtmodus.

## Reset- und Änderungsregeln
- Bei Neugenerierung einer Woche wird die aktive Auswahl zurückgesetzt.
- Begründung:
  - Der zugrunde liegende Plan kann sich vollständig ändern.
  - Ein automatisches Mapping alter Auswahl auf neue Mahlzeiten wäre fehleranfällig.
- Der Abhakzustand der Einkaufsliste soll nicht nur an die Woche, sondern auch an den Listenmodus gekoppelt sein.
- Wenn später aktiv ausgewählte Mahlzeiten serverseitig geändert werden, muss der Einkaufslisten-Abhakzustand auf verwaiste Positionen bereinigt werden.

## Leer- und Grenzfälle
- Keine aktiven Gerichte bei `active-only`:
  - klarer Leerzustand statt leerer Kategorien
- Alle Gerichte aktiv:
  - Ergebnis entspricht fachlich der Vollansicht
- Dasselbe Rezept an mehreren Tagen:
  - Auswahl bleibt pro geplantem Vorkommensfall getrennt
- Offline-Nutzung:
  - Auswahl und Modus sollten zusammen mit der Einkaufsliste lokal wiederherstellbar sein

## Minimale technische Umsetzung in sinnvollen Schritten
1. Meal-Key für jede geplante Mahlzeit definieren.
2. Client-seitigen Auswahlzustand auf dem Dashboard einführen.
3. Aktive Anzahl sichtbar machen und Mahlzeiten schaltbar machen.
4. Auswahlzustand lokal pro Woche speichern.
5. Einkaufsliste um Modus-Schalter und Leerzustand erweitern.
6. Einkaufsaggregation auf Basis einer übergebenen Mahlzeitenauswahl wiederverwenden.
7. Abhakstatus der Einkaufsliste an Woche plus Modus koppeln.

## Nutzen für spätere Ausbaustufen
- kompatibel mit Offline-Snapshots
- anschlussfähig für spätere Funktionen wie:
  - `heute kochen`
  - `bereits gekocht`
  - vorbereitete Einkaufsmodi pro Haushalt oder Einkaufstag
  - optionalen Export, Import oder späteren Geräteabgleich
