---
typ: anforderung
status: ausgewertet
datum: 2026-04-30
quelle: Nutzeranforderung im aktuellen Codex-Thread
tags:
  - rezepte
  - zubereitung
  - mengen
  - kochansicht
---

# Rezeptgenaue Zubereitungen mit Mengen

## Kernaussage
Die Zubereitungstexte sollen nicht nach einem wiederkehrenden allgemeinen Schema wirken. Allgemeine Merksätze und pauschale Anfangs- oder Abschlusssätze sollen entfallen.

## Anforderungen
- Zubereitungsschritte sollen sich konkret auf das jeweilige Gericht beziehen.
- Die Schritte sollen die tatsächlich nötigen Handgriffe des Gerichts beschreiben.
- Wo es beim Kochen hilft, sollen Zutatenmengen im Schritttext erscheinen, zum Beispiel Eier, Grammangaben oder Flüssigkeitsmengen.
- Die Mengen sollen sich in der Kochansicht an der eingestellten Personenzahl orientieren.
- Die Rezepttexte sollen nicht wie ein 0815-Baukasten mit leicht ausgetauschten Begriffen wirken.
- Kleine gerichtsspezifische Tipps sind erwünscht, wenn sie zum jeweiligen Rezept passen.

## Umsetzungshinweis
Die frühere zentrale pauschale Anreicherung der Seed-Rezepte mit `Vorbereitung:`- und `Abschluss:`-Sätzen passt nicht mehr zum Zielbild. Stattdessen sollen die vorhandenen rezeptbezogenen Schritte direkt angezeigt und mengenfähig gerendert werden.
