---
typ: uebersicht
status: aktiv
letzte_aktualisierung: 2026-04-24
quellen:
  - ../../01 Rohquellen/2026-04-24 Umstellung auf Tageskonzept.md
  - ../../../README.md
  - Vorhandene Workspaces.md
tags:
  - projektueberblick
  - mvp
  - rezepte
  - tagesplanung
---

# Projektüberblick

## Kurzbild
`Plan und Pfanne` ist eine glutenfreie Tagesplanungs-, Rezept- und Einkaufslisten-App. Der aktuelle Produktkern kombiniert Rezeptsammlung, freie Datumsbereichsplanung, tagesbezogene Makroorientierung, direkte Kochansichten und eine daraus abgeleitete Einkaufsliste.

## Zielbild
- eine alltagstaugliche App für glutenfreie Essensplanung
- Fokus auf direkte Nutzung durch eine Person ohne Kontoverwaltung
- flexible Tagesplanung statt starrem Wochenplanmodell
- konkrete Kochunterstützung aus dem geplanten Mahlzeiten-Slot heraus
- installierbar auf dem Handy und für zentrale Ansichten offline nutzbar

## Nutzer- und Produktfokus
- Zielnutzer ist aktuell eine einzelne Person im privaten oder haushaltsnahen Kontext.
- Glutenfreiheit ist keine bloße Empfehlung, sondern fachlich als harte Filterbedingung angelegt.
- Die Planung ist tagesorientiert und will Makro-Zielwerte im Verhältnis `30 / 30 / 40` bestmöglich treffen.
- Der Nutzer kann jede geplante Mahlzeit nach der Generierung bearbeiten.
- Personenzahl skaliert Zutaten, Einkaufsliste und Kochansicht; Makros bleiben pragmatische Tagesorientierung pro Person.
- Die App speichert Einstellungen, Rezeptpräferenzen, Tagespläne und Verlauf auf dem Gerät; die Einkaufsliste wird daraus clientseitig erzeugt.

## Aktuell erkennbare Produktbausteine
- Rezeptbibliothek mit Rezeptzulassung je Mahlzeitentyp
- freie Planerzeugung über Start- und Enddatum
- Tagespläne mit Frühstück, Mittagessen, Abendessen und Snacks
- Tagesdetail mit Rezepttausch, Personenzahl, Deaktivierung und Einkaufslisten-Flag
- geplante Rezept-Kochansicht mit temporärer Mengenskalierung
- Einkaufsliste aus frei gewähltem Datumsbereich
- Historie mit Kopieren historischer Tage oder Zeiträume
- Einstellungen inklusive Standard-Personenzahl, Makrozielen und Löschen alter Pläne
- PWA- und Offline-Grundlage

## Projektgrenzen im aktuellen Stand
- Kein Mehrnutzerbetrieb und keine Kontoverwaltung im primären Produktfluss
- Noch kein Export-, Backup- oder Gerätewechselpfad
- Noch kein produktiver Dateiimport oder Feed für neue Rezepte
- Kein Mehrgeräteabgleich
- Alte Wochenplan-Testdaten werden beim lokalen Datenbankupgrade bewusst verworfen

## Verwandte Seiten
- [[Aktueller Projektstatus]]
- [[../Begriffe und Konzepte/Produktbild und Kernlogik]]
- [[../Begriffe und Konzepte/Systembild und technischer Zuschnitt]]
- [[../Entscheidungen/MVP-Leitentscheidungen]]
