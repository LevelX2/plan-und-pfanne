---
typ: risiko
status: aktiv
letzte_aktualisierung: 2026-04-24
quellen:
  - ../../../01 Rohquellen/2026-04-24 Umstellung auf Tageskonzept.md
  - ../../../KODEX_STAND.md
  - ../../../README.md
  - ../../../src/lib/local-db.ts
  - ../../../src/lib/local-store.ts
  - ../../../src/app/planen/page.tsx
  - ../../../src/app/tage/page.tsx
  - ../../../src/app/kochen/page.tsx
  - ../../../src/app/einkaufsliste/shopping-list-client.tsx
tags:
  - offen
  - pruefbedarf
  - risiko
  - tagesplanung
---

# Offene Fragen und Prüfbedarf

## Inzwischen geschlossene Punkte
- Die zuvor starre Wochenplanung wurde fachlich und technisch auf datumsbezogene Tagesplanung umgestellt.
- Der lokale PWA-Pfad mit IndexedDB und statischem Export bleibt der primäre Produktzuschnitt.
- Freie Zeitraumgenerierung, Überschneidungswarnung, Tagesdetail, Mahlzeitenbearbeitung, Kochansicht, Einkaufsliste, Historie, Kopieren historischer Tage und Löschen alter Pläne sind im Workspace umgesetzt.
- Rezeptzulassung je Mahlzeitentyp und Gewichtung `selten / normal / häufig` sind umgesetzt.
- Das frühere Modell `aktive Gerichte` wurde durch die zwei Slot-Flags `isEnabled` und `includeInShoppingList` ersetzt.
- Alte lokale Wochenplan-Testdaten müssen nicht migriert werden und werden beim IndexedDB-Upgrade bewusst verworfen.
- Der Zielmix `vegetarisch / Fisch / Fleisch` bleibt als weiche Heuristik für Mittag- und Abendessen erhalten.

## Verbleibende Produktfragen
- Ob und wann ein Export-, Backup- oder Gerätewechselpfad gebraucht wird, ist weiterhin offen.
- Ob neue Rezepte später per Dateiimport, Feed, App-Update oder manuellem Editor ergänzt werden, ist noch nicht final entschieden.
- Der aktuelle Rezeptpool reicht für praktische Planung, aber nicht für harte Garantien bei Makroverteilung oder vegetarisch/Fisch/Fleisch-Zielmix.
- Für die Kochansicht ist aktuell bewusst festgelegt, dass Mengenänderungen temporär bleiben; ob später eine Übernahme in die Planung angeboten wird, ist eine mögliche Ausbaufrage.

## Technische Prüfstellen
- Der Service Worker cached die App-Shell und gleich-originäre `GET`-Requests; routegenaue Offline-Tests auf echten Mobilgeräten stehen weiterhin aus.
- IndexedDB bleibt browser- und originabhängig. Manuelles Löschen, Speicherdruck oder ein Origin-Wechsel können lokale Daten entfernen.
- Die querybasierten Detailrouten `/tage?date=...` und `/kochen?meal=...` passen zum Static Export, sollten bei weiterer Navigationserweiterung bewusst beibehalten werden.
- Alte serverseitige Artefakte wie Auth-, SQLite- und Scheduler-Code liegen teilweise noch im Repository. Sie dürfen nicht versehentlich wieder zum produktiven Hauptpfad werden.
- Der alte Ordner `C:\Users\Lui\OneDrive\Projekte\gluten freie Rezepte` ist weiterhin als OneDrive-Reparse-Restzustand sichtbar und nicht automatisch bereinigt.

## Empfohlene nächste Prüfungen
1. Tagesplanung auf einem echten Smartphone als installierte PWA testen.
2. Manuelle Produktfälle aus der Tageskonzept-Vorgabe durchspielen:
   Generieren, Überschneidung, Bearbeitung, Snack, Deaktivierung, Kochansicht, Einkaufsliste, Historie, Kopieren und Löschen.
3. Backup- und Exportbedarf für lokale App-Daten entscheiden.
4. Alte serverseitige Kompatibilitätsartefakte später gezielt bereinigen, sobald klar ist, dass kein Rückfall auf den Serverpfad gebraucht wird.
