---
typ: nutzerquelle
status: ausgewertet
datum: 2026-04-24
tags:
  - tagesplanung
  - datenmodell
  - umsetzung
---

# Umstellung auf Tageskonzept

## Herkunft
Diese Rohquelle fasst das vom Nutzer am 2026-04-24 gelieferte Übergabe- und Umsetzungskonzept `Umstellung auf Tageskonzept` zusammen. Die Quelle wurde im Thread vollständig ausgewertet und anschließend umgesetzt.

## Kernaussagen
- Die alte starre Wochenplanung ist nicht erhaltenswert und soll fachlich durch datumsbezogene Tagesplanung ersetzt werden.
- Es gibt keine erhaltenswerten Altdaten; bestehende Testdaten dürfen gelöscht werden.
- Planung erfolgt immer auf Tagesebene.
- Pro Datum gibt es maximal einen Plan.
- Ein Planzeitraum ist nur noch Herkunfts- oder Erstellungsinformation.
- Der Nutzer wählt beim Generieren Startdatum, Enddatum und Standard-Personenzahl.
- Standard-Vorbelegung: Startdatum nächster Tag, Enddatum einige Tage später.
- Bei Überschneidungen muss vor Generierung oder Kopieren gewarnt werden.
- Rezeptzulassung muss je Mahlzeitentyp steuerbar sein.
- Gewichtungen sind `selten`, `normal`, `häufig` mit empfohlenen Werten `0.5`, `1.0`, `2.0`.
- Rezepte dürfen mehreren Mahlzeitentypen zugeordnet sein.
- Mittagessen und Abendessen sollen standardmäßig gegenseitig zulässig sein; Frühstück und Snack bleiben getrennt.
- Nutzeranpassungen an Rezeptzulassung und Gewichtung sollen App-Updates überdauern.
- Personenzahl wird beim Generieren gesetzt und pro Mahlzeit dauerhaft änderbar.
- Makroberechnung bleibt pragmatisch als Tagesorientierung pro Person; Personenzahl skaliert Zutaten, Einkaufsliste und Kochansicht.
- Mahlzeiten müssen nach Generierung bearbeitbar sein: Gericht tauschen, Personenzahl ändern, deaktivieren, Snacks hinzufügen.
- Deaktivierte Mahlzeiten bleiben sichtbar, zeigen `fällt aus` und fließen nicht in Makros, Einkaufsliste oder Kochansicht ein.
- Jede geplante Mahlzeit soll aus dem Tagesdetail direkt in eine Rezept-Kochansicht springen können.
- Die Kochansicht übernimmt zunächst die geplante Personenzahl, erlaubt aber eine temporäre Änderung ohne Rückschreiben in Planung oder Einkaufsliste.
- Die Einkaufsliste wird aus einem frei gewählten Datumsbereich erzeugt und berücksichtigt aktive Mahlzeiten mit Einkaufslisten-Flag.
- Historie funktioniert als Tagesliste beziehungsweise Datumsbereich.
- Historische Tage oder Zeiträume können als Vorlage kopiert werden:
  gleiche Länge 1:1, kürzer abschneiden, länger zusätzliche Tage generieren.
- Beim Kopieren werden nur Rezepte übernommen; Personenzahl, Aktivstatus und Einkaufslisten-Flag kommen aus aktuellen Defaults.
- In den Einstellungen gibt es eine Funktion `Alte Pläne löschen`.

## Umsetzungsentscheidungen im Thread
- Die lokale PWA-/IndexedDB-Architektur bleibt erhalten.
- Der Branch soll P1 bis P3 vollständig umsetzen.
- Die Personenzahländerung in der Kochansicht ist nur temporär.
- Das bisherige Konzept `Aktive Gerichte` wird fachlich durch zwei Flags ersetzt:
  `isEnabled` für `Mahlzeit findet statt` und `includeInShoppingList` für `in Einkaufsliste berücksichtigen`.
