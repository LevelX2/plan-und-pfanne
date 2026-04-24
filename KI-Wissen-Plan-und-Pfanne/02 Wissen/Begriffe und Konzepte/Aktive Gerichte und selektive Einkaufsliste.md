---
typ: konzept
status: abgeloest
letzte_aktualisierung: 2026-04-24
quellen:
  - ../../../01 Rohquellen/2026-04-23 Aktive Gerichte im Wochenplan und selektive Einkaufsliste.md
  - ../../../01 Rohquellen/2026-04-24 Umstellung auf Tageskonzept.md
  - ../../../src/lib/types.ts
  - ../../../src/app/tage/page.tsx
  - ../../../src/app/einkaufsliste/shopping-list-client.tsx
tags:
  - einkaufsliste
  - auswahl
  - abgeloest
---

# Aktive Gerichte und selektive Einkaufsliste

## Einordnung
Diese Seite dokumentiert ein früheres Zwischenkonzept. Das Modell `Aktive Gerichte` innerhalb eines Wochenplans wurde durch das Tageskonzept abgelöst.

## Abgelöste frühere Idee
Früher sollte ein erzeugter Wochenplan vollständig erhalten bleiben und zusätzlich eine separate Auswahl aktiver Gerichte erhalten. Diese Auswahl sollte als Kochfokus und als Eingabe für die Einkaufsliste dienen.

## Aktuelles Ersatzmodell
Im Tageskonzept gibt es keine separate Wochenplan-Auswahl mehr. Stattdessen trägt jede geplante Mahlzeit zwei fachlich getrennte Flags:

- `isEnabled`
  - steuert, ob die Mahlzeit stattfindet
  - `false` bedeutet `fällt aus`
  - deaktivierte Mahlzeiten bleiben sichtbar, fließen aber nicht in Makros, Einkaufsliste oder Kochansicht ein
- `includeInShoppingList`
  - steuert, ob eine aktive Mahlzeit in die Einkaufsliste einfließt
  - dient für Fälle, in denen Zutaten bereits vorhanden sind oder bewusst nicht eingekauft werden sollen

## Konsequenz für die Einkaufsliste
- Die Einkaufsliste wird aus einem frei gewählten Datumsbereich erzeugt.
- Berücksichtigt werden nur aktive Mahlzeiten mit gesetztem Einkaufslisten-Flag.
- Es gibt keinen separaten Modus `Aktive Gerichte` gegenüber `Alle geplanten Gerichte` mehr.
- Der Nutzer steuert die Einkaufsliste direkt am konkreten Mahlzeiten-Slot.

## Weiterhin gültige Erkenntnisse aus dem alten Konzept
- Die Auswahl muss auf Ebene der geplanten Mahlzeit liegen, nicht nur auf Ebene des Rezepts.
- Dasselbe Rezept an unterschiedlichen Tagen oder in unterschiedlichen Slots bleibt getrennt steuerbar.
- Die Einkaufsliste aggregiert Zutaten nach Kategorie, Name und Einheit.
- UI-Zustände wie Einkaufs-Häkchen können weiterhin separat vom Planbestand betrachtet werden.
