<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Projekt Agent Instructions

## Projektbezogene Wissensbasis

Für dieses Repository existiert eine projektbezogene KI-Wissensbasis im Ordner:

`KI-Wissen-Plan-und-Pfanne/`

Bei neuen Threads, neuen Aufgaben und Projektfragen ist diese Wissensbasis primär zu verwenden.

## Pflicht-Einstieg für neue Threads

Zu Beginn projektbezogener Arbeit zuerst diese Dateien lesen:

1. `KI-Wissen-Plan-und-Pfanne/00 Projektstart.md`
2. `KI-Wissen-Plan-und-Pfanne/02 Wissen/00 Uebersichten/Index.md`
3. `KI-Wissen-Plan-und-Pfanne/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md`
4. `KI-Wissen-Plan-und-Pfanne/00 Steuerung/Regeldatei KI-Wissenspflege.md`

## Arbeitsmodus

- Arbeite `wiki-first`.
- Beantworte Projektfragen zuerst aus dem vorhandenen Wissensbestand.
- Ziehe Rohquellen, Repository-Dateien oder Webquellen nur dann nach, wenn die Wissensbasis Lücken hat, veraltet ist oder verifiziert werden muss.
- Wenn neue belastbare Erkenntnisse entstehen, die einen erkennbaren dauerhaften Wert haben, führe sie in die Wissensbasis zurück.
- Prüfe bei wiederverwendbaren technischen Regeln, ob sie in `KI-Wissen-Plan-und-Pfanne/03 Betrieb/Generische Entwicklungsvorgaben.md` gehören.
- Fachlich enge Einzelfall-Erkenntnisse gehören stattdessen auf die passende Wissensseite.

## Sprachregeln

- Sichtbare UI-Texte sollen echtes Deutsch mit Umlauten und `ß` verwenden.
- Der Benutzer soll im Chat und in direkt formulierten Anwendungstexten grundsätzlich mit `Du` angesprochen werden, sofern kein abweichender Wunsch geäußert wurde.
- In Fließtexten, Beschreibungen und Überschriften der Wissensbasis sollen echte Umlaute verwendet werden:
  `ä` statt `ae`, `ö` statt `oe`, `ü` statt `ue`, `Ä` statt `Ae`, `Ö` statt `Oe`, `Ü` statt `Ue`, `ß` statt `ss`, sofern es sich um normales Deutsch handelt.
- Ausnahmen:
  Dateinamen, Pfade, Code-Symbole, IDs, technische Bezeichner, Markdown-Links auf bestehende Dateien und originale Quellzitate bleiben in ihrer technischen oder originalen Schreibweise.

## Hotkey-Regeln

1. Hotkeys sind als übergreifendes App-Verhalten zu behandeln und nicht seitenlokal oder komponentenlokal zu erfinden.
2. Hotkeys sollen an einer zentralen Stelle definiert und dokumentiert werden; einzelne Screens dürfen nur fachlich begründete Ausnahmen ergänzen.
3. Hotkeys dürfen Texteingaben, Formularfelder, native Browser-Kurzbefehle und Bedienhilfen nicht stören.

## Wissenspflege bei neuen Quellen

Wenn neue Projektquellen hinzukommen:

1. als Rohquelle in die Wissensbasis aufnehmen oder als Rohquellen-Referenz erfassen
2. vollständig lesen oder vollständig auswerten
3. betroffene Wissensseiten aktualisieren oder neu anlegen
4. Index aktualisieren
5. Log aktualisieren

## Transparenz vor Wissenspflege

Vor inhaltlich relevanten Ergänzungen oder neuen Wissensseiten soll die Einordnung im Chat kurz transparent gemacht werden. Eine ausdrückliche Freigabe ist für normale, klar zuordenbare Aktualisierungen aber nicht erforderlich.

Bei klaren Fällen darf die Wissenspflege direkt erfolgen. Dabei soll trotzdem kurz sichtbar werden:

1. welche Erkenntnis du aufnehmen oder ändern willst
2. warum diese Erkenntnis dauerhaft nützlich oder wiederverwendbar ist
3. welche Wissensseite betroffen wäre oder neu angelegt werden soll

Für diese Vorab-Einordnung verwende nach Möglichkeit dieses sichtbare Format:

1. `Erkenntnis`
2. `Dauerhafter Nutzen`
3. `Vorgeschlagene Wissensseite`
4. `Warum diese Seite`
5. `Abgrenzung zu Alternativen`

Eine ausdrückliche Zustimmung vor der Änderung ist nur dann wichtig, wenn:

- die Zuordnung zur Zielseite nicht offensichtlich ist
- neue Seiten oder Strukturänderungen mit weiterreichender Wirkung entstehen
- bestehende Wissensseiten wesentlich umgebaut, verschoben oder gelöscht werden sollen
- Widersprüche zwischen Quellen und bestehendem Wissen nicht ohne inhaltliche Entscheidung auflösbar sind
- Unsicherheit besteht, ob etwas generisch oder projektspezifisch dokumentiert werden sollte

## Wichtige Betriebsregeln

- Rohquellen bleiben unverändert.
- Widersprüche zwischen neuen Quellen und bestehendem Wissen sichtbar machen, nicht stillschweigend überschreiben.
- Zwischen dokumentiertem Projektstand und aktuellem Workspace-Stand unterscheiden, wenn offene lokale Änderungen vorliegen.
- Wiederverwendbare Antworten, Entscheidungen, Analysen oder Risikoerklärungen nicht nur im Chat belassen, sondern als Wissensseiten oder Aktualisierungen zurückführen.

## Wichtige Wissensbasis-Dateien

- Einstieg: `KI-Wissen-Plan-und-Pfanne/02 Wissen/00 Uebersichten/Index.md`
- Workflow: `KI-Wissen-Plan-und-Pfanne/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md`
- Log: `KI-Wissen-Plan-und-Pfanne/03 Betrieb/Log.md`
- Qualitätsprüfung: `KI-Wissen-Plan-und-Pfanne/03 Betrieb/Qualitaetspruefung.md`

## Einordnung von Status und Log

- `KI-Wissen-Plan-und-Pfanne/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md` ist eine verdichtete Zustandsübersicht und kein Änderungsprotokoll.
- Diese Seite soll den aktuellen Stand als Snapshot zeigen, zum Beispiel gegliedert in `Umgesetzt`, `Teilweise umgesetzt`, `Offen` und `Wichtige Grenzen`.
- Einzelne Schritte, Entscheidungen, Verifikationen und zeitliche Abfolgen gehören nicht als Erzählung in diese Statusseite, sondern in `KI-Wissen-Plan-und-Pfanne/03 Betrieb/Log.md`.
- `KI-Wissen-Plan-und-Pfanne/03 Betrieb/Log.md` bleibt chronologisch und append-only und beantwortet primär, was wann passiert ist.
- Wenn sich Statusseite und Log inhaltlich überschneiden, ist die Statusseite zu verdichten statt das Log auszudünnen.

## Finito-Sequenz

Wenn der Nutzer `Finito` oder `Ende` schreibt, führt der Agent die Abschlusssequenz für den aktuellen Thread aus.

Dabei gilt:

1. Der Agent teilt die Änderungen in sinnvolle Commit-Blöcke auf. Nicht direkt zusammenhängende Änderungen sollen in getrennten Commits mit jeweils eigener passender Commit-Message landen.
2. Der Agent committet alle Teile, zu denen keine offenen Fragen mehr bestehen und die fachlich wie technisch konsistent abgeschlossen sind.
3. Nötige Anpassungen am KI-Wissen werden nach den sonstigen Wissensregeln nachgezogen, dokumentiert und ebenfalls committed.
4. Verbleibende offene Fragen, Konflikte oder bewusste Entscheidungsbedarfe werden danach kompakt benannt.

Zusätzlich gilt:

- Teile, die noch von offenen Fragen abhängen, sollen nicht vorschnell committed werden.
- Uncommittete Änderungen, die erkennbar nicht zu diesem Thread gehören, sind kein automatischer Blocker und können am Ende kurz als Hinweis genannt werden.
- Gemachte Commits sollen im Abschluss jeweils in einer eigenen Zeile mit ihrer Commit-Message genannt werden, damit sie schnell erkennbar sind.
- Wenn nach der Finito-Sequenz keine relevanten offenen Punkte mehr für diesen Thread übrig sind, gilt der Thread als abgeschlossen und archivierungsreif.
