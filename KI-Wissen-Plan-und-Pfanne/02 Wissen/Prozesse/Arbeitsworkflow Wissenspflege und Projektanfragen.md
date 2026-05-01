---
typ: prozess
status: aktiv
letzte_aktualisierung: 2026-04-23
quellen:
  - ../../00 Steuerung/Regeldatei KI-Wissenspflege.md
  - ../../01 Rohquellen/2026-04-23 Finito-Sequenz fuer Thread-Abschluss.md
tags:
  - workflow
  - wissenspflege
  - projektarbeit
---

# Arbeitsworkflow Wissenspflege und Projektanfragen

## Kurzfassung
Dieser Workflow beschreibt, wie die Wissensbasis im Alltag genutzt und gepflegt wird. Er stellt sicher, dass neue Informationen nicht im Chat verloren gehen und dass Antworten sowie Projektaufgaben zuerst auf dem vorhandenen Wissensbestand aufbauen.

## Zielbild
- Neue Quellen werden als Rohquellen aufgenommen oder referenziert und in bestehendes Wissen integriert.
- Projektfragen werden zuerst gegen die Wissensbasis beantwortet.
- Wiederverwendbare Ergebnisse aus Analysen, Entscheidungen oder Aufgaben fließen zurück in die Wissensbasis.
- Zustandsübersichten und Chronik bleiben getrennt: `Aktueller Projektstatus` zeigt den verdichteten Ist-Zustand, das `Log` hält relevante zeitliche Abfolgen, Entscheidungen, Verifikationen und Abschlussstände fest.

## Fall 1: Neue Quelle aufnehmen
### Typischer Auslöser
- Du gibst mir eine Datei, einen Text, ein Konzept oder einen Link und sagst sinngemäß: `Nimm das in die Projekt-Wissensbasis auf.`

### Ablauf
1. Quelle in `01 Rohquellen` ablegen oder als Rohquellen-Referenz erfassen.
2. Quelle vollständig lesen oder vollständig auswerten.
3. Betroffene Wissensseiten im Index und im bestehenden Wiki identifizieren.
4. Bestehende Seiten aktualisieren oder neue Seiten anlegen.
5. Verlinkungen und Quellenbasis ergänzen.
6. Index aktualisieren, falls neue relevante Seiten entstanden sind.
7. Log nach Relevanzregel aktualisieren.

## Fall 2: Frage zum Projekt beantworten
### Typischer Auslöser
- Du fragst nach Planung, Rezeptlogik, Offline-Verhalten, Architektur, Deployment, Datenmodell, UI oder aktuellem Projektstand.

### Ablauf
1. Zuerst [[../00 Uebersichten/Index]] lesen.
2. Relevante Wissensseiten im Zusammenhang lesen.
3. Nur bei Bedarf Rohquellen, Code oder frische Webquellen hinzuziehen.
4. Antwort mit klarer Trennung von gesichertem Wissen, Unsicherheit und offenem Punkt formulieren.
5. Wenn aus der Antwort neues wiederverwendbares Wissen entsteht, dieses zurück in die Wissensbasis führen.

## Fall 3: Erkenntnisse aus einer Aufgabe zurückführen
### Typischer Auslöser
- Wir haben ein Problem analysiert, eine Entscheidung getroffen, eine Route verstanden oder ein Risiko geklärt.

### Ablauf
1. Prüfen, ob das Ergebnis wiederverwendbar ist.
2. Passende Wissensseite aktualisieren oder neue Seite anlegen.
3. Die Einordnung im Chat kurz sichtbar machen, ohne bei klaren Fällen auf ausdrückliche Freigabe zu warten.
4. Bei Statuswissen bewusst trennen:
   - `Aktueller Projektstatus` nur als verdichteten Snapshot aktualisieren.
   - `Log` nur für relevante zeitliche Abfolge, Entscheidungen, Verifikation, Risiken oder Abschlussstände ergänzen.
5. Index nachziehen und Log nur bei relevanter Entwicklungsänderung, Entscheidung, Verifikation, Risiko oder Abschlussstand ergänzen.

## Fall 4: Wissensbasis health-checken
### Typischer Auslöser
- Du sagst sinngemäß: `Prüfe die Wissensbasis` oder `Mach einen Lint-Check`.

### Ablauf
1. Index, Log und Stichproben aus den Wissensseiten lesen.
2. Auf Widersprüche, Orphans, defekte Links, fehlende Pflichtabschnitte und veraltete Aussagen prüfen.
3. Konkrete Korrekturhinweise in [[../../03 Betrieb/Qualitaetspruefung]] dokumentieren.
4. Wenn sinnvoll, fehlende Verlinkungen oder kleinere Strukturkorrekturen direkt nachziehen.

## Fall 5: Thread mit Abschlusskommando abschließen
### Typischer Auslöser
- Du schreibst sinngemäß: `Finito`, `Ende`, `Finale` oder `Endfinale`.

### Ablauf
1. Die globale Detailsequenz liegt im Haupt-Vault-Skill `abschlusskommandos`.
2. Projektlokal bleiben die Wissenspflege, Remote-Prüfung und die klare Statusmeldung nach lokalen Commits relevant.
3. `Finito` und `Ende` schließen lokal ohne Merge und Push ab.
4. `Finale` integriert nur nach sauberem lokalem Abschluss und eindeutigem Projekt-/Remote-Modell.
5. `Endfinale` verlangt vor der Integration einen erweiterten Verify-Lauf und danach eine Status- und Restpunkteprüfung.

## Empfohlene Kurzbefehle für den Alltag
- `Nimm diese Quelle in die Projekt-Wissensbasis auf.`
- `Beantworte das wiki-first aus der Projekt-Wissensbasis.`
- `Führe dieses Ergebnis als Projektwissen in die Wissensbasis zurück.`
- `Mach einen Lint-Check für die Wissensbasis.`
- `Finito`
- `Finale`
- `Endfinale`
- `Ende`

## Verwandte Seiten
- [[Lokaler Start von Entwicklung und Test]]
- [[../../03 Betrieb/Log]]
- [[../../03 Betrieb/Qualitaetspruefung]]
