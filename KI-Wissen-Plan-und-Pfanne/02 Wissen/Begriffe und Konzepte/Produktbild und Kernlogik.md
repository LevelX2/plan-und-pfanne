---
typ: konzept
status: aktiv
letzte_aktualisierung: 2026-04-24
quellen:
  - ../../../01 Rohquellen/2026-04-24 Umstellung auf Tageskonzept.md
  - ../../../src/lib/planner.ts
  - ../../../src/lib/local-store.ts
  - ../../../src/lib/types.ts
  - ../../../src/app/planen/page.tsx
  - ../../../src/app/tage/page.tsx
  - ../../../src/app/kochen/page.tsx
  - ../../../src/app/einkaufsliste/shopping-list-client.tsx
  - ../../../src/app/rezepte/recipes-client.tsx
  - ../../../src/lib/data/demo-recipes.ts
  - ../../../src/lib/data/imported-recipes.ts
tags:
  - fachlogik
  - rezepte
  - planung
  - tagesplanung
---

# Produktbild und Kernlogik

## Fachlicher Kern
`Plan und Pfanne` verbindet Rezeptverwaltung, automatische glutenfreie Tagesplanung, konkrete Kochansichten und eine daraus abgeleitete Einkaufsliste. Die Planung ist nicht mehr wochengebunden, sondern arbeitet auf einzelnen Datumswerten.

## Tagesmodell
- Planung erfolgt auf Tagesebene.
- Pro Datum gibt es maximal einen Plan.
- Ein Planzeitraum ist nur Herkunfts- oder Erstellungsinformation.
- Es gibt keine parallelen aktiven oder inaktiven Planversionen.
- Ein Tagesplan enthält Frühstück, Mittagessen, Abendessen und optional Snacks.

## Mahlzeitenmodell
- Frühstück
- Mittagessen
- Abendessen
- Snack

Jede geplante Mahlzeit trägt:
- Rezept
- Mahlzeitentyp
- Personenzahl
- `isEnabled` für `Mahlzeit findet statt`
- `includeInShoppingList` für `in Einkaufsliste berücksichtigen`
- Sortierung innerhalb des Tages

## Aktueller Rezeptpool
- 74 Seed-Rezepte sind im aktuellen Datenbestand vorhanden.
- Darunter sind 28 zusätzliche glutenfreie Rezepte, die am 2026-04-23 aus externen Webquellen strukturiert in den Seed-Bestand übernommen wurden.
- Verteilung nach primärem Mahlzeitentyp:
  - 17 Frühstücke
  - 19 Mittagessen
  - 20 Abendessen
  - 18 Snacks
- Standard-Snacks enthalten jetzt unter anderem Proteinshakes und glutenfreie Proteinriegel-Varianten mit 30 %, 40 %, 50 % und 60 % Eiweißanteil.
- Glutenfreiheit ist im Seed-Bestand durchgängig gesetzt.

## Rezeptzulassung und Gewichtung
- Die App verwendet nicht automatisch alle Rezepte für jeden Mahlzeitentyp.
- Je Mahlzeitentyp kann gesteuert werden, ob ein Rezept für die automatische Planung zulässig ist.
- Gewichtungen:
  - `selten` = 0,5
  - `normal` = 1,0
  - `häufig` = 2,0
- Die Gewichtung ist ein weicher Scoring-Faktor und kein harter Zwang.
- Frühstück und Snack bleiben standardmäßig nur ihrem primären Typ zugeordnet.
- Mittagessen und Abendessen sind standardmäßig gegenseitig zulässig.
- Nutzeranpassungen an Zulassung und Gewichtung liegen getrennt von App-Standardzuordnungen und sollen Seed-Updates überdauern.

## Planungslogik
- Der Nutzer wählt beim Generieren Startdatum, Enddatum und Standard-Personenzahl.
- Standard-Vorbelegung: Startdatum nächster Tag, Enddatum einige Tage später.
- Der Generator prüft Überschneidungen und überschreibt bestehende Tage nur nach Bestätigung.
- Zielwerte werden pro Tag betrachtet.
- Die Tagesoptimierung orientiert sich an der Makroverteilung:
  30 % Kohlenhydrate, 30 % Fett, 40 % Eiweiß.
- Makros bleiben eine pragmatische Ein-Personen-Tagesorientierung.
- Das Eiweißziel kann pro Standard-Person aus Körpergewicht und Gramm Eiweiß pro Kilogramm Körpergewicht gepflegt werden.
- Für die Tagesbewertung verwendet die App den Durchschnitt der aktiven Standard-Personen als Eiweißziel pro Person.
- Die Personenzahl skaliert Zutaten, Einkaufsliste und Kochansicht, aber nicht die Tagesmakros als Mehrpersonen-Gesamtsumme.
- Für jeden Tag werden Kandidaten erzeugt und anhand von Makroabweichung, Wiederholungen, Zielmix und Gewichtung bewertet.

## Mahlzeitenbearbeitung
Nach der Generierung ist jede geplante Mahlzeit im Tagesdetail bearbeitbar:
- Gericht austauschen
- Personenzahl dauerhaft ändern
- Mahlzeit deaktivieren
- Einkaufslisten-Berücksichtigung ein- oder ausschalten
- Snacks hinzufügen

Deaktivierte Mahlzeiten:
- bleiben als Slot sichtbar
- zeigen fachlich `fällt aus`
- fließen nicht in Tagesmakros ein
- fließen nicht in die Einkaufsliste ein
- öffnen keine Kochansicht

## Rezept-Kochansicht
- Aus dem Tagesdetail führt jede aktive geplante Mahlzeit direkt in die Kochansicht.
- Die Kochansicht ist auf den konkreten geplanten Slot bezogen.
- Angezeigt werden Rezeptname, geplanter Tag, Mahlzeitentyp, geplante Personenzahl, skalierte Zutaten und Zubereitungsschritte.
- Die Personenzahl ist in der Kochansicht temporär änderbar.
- Temporäre Änderungen in der Kochansicht schreiben nicht zurück in Planung, Tagesmakros oder Einkaufsliste.

## Einkaufslogik
- Die Einkaufsliste wird aus einem frei gewählten Datumsbereich erzeugt.
- Berücksichtigt werden nur Mahlzeiten mit:
  - `isEnabled = true`
  - `includeInShoppingList = true`
- Zutaten werden nach Kategorie, Name und Einheit zusammengeführt.
- Für die Einkaufsliste werden bekannte Einkaufsäquivalente vor dem Zusammenführen normalisiert; `Ei`, `Eier` und `Eiweiß` werden aktuell als `Eier` in Stück ausgewiesen, Eiweiß in Gramm mit 30 g pro Ei.
- Mengen werden anhand der Personenzahl je Mahlzeit skaliert.
- Deaktivierte Mahlzeiten und abgewählte Einkaufslisten-Mahlzeiten bleiben außen vor.

## Historie und Kopieren
- Die Historie funktioniert als Tagesliste beziehungsweise Datumsbereich.
- Jeder Tag bleibt ein eigener Datensatz mit Metadaten zu Quelle, Planzeitraum und Kopierquelle.
- Historische Quellzeiträume können in neue Zielzeiträume kopiert werden.
- Gleiche Länge wird 1:1 kopiert.
- Kürzere Zielzeiträume schneiden die Vorlage ab.
- Längere Zielzeiträume kopieren vorhandene Tage und generieren zusätzliche Tage neu.
- Beim Kopieren werden nur Rezepte übernommen; Personenzahl, Aktivstatus und Einkaufslisten-Flag kommen aus aktuellen Defaults.

## Offene Verifikation
- Die neue Tagesplanung ist technisch gebaut und mit Lint/Build verifiziert.
- Ein produktnaher Test auf echten Mobilgeräten steht weiterhin aus.
