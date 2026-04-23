# Finito-Sequenz für Thread-Abschluss

## Quelle
- Chat-Anforderung vom 2026-04-23

## Nutzeranliegen
> ## Finito-Sequenz
>
> Wenn der Nutzer `Finito` oder `Ende` schreibt, führt der Agent die Abschlusssequenz für den aktuellen Thread aus.
>
> Dabei gilt:
>
> 1. Der Agent teilt die Änderungen in sinnvolle Commit-Blöcke auf. Nicht direkt zusammenhängende Änderungen sollen in getrennten Commits mit jeweils eigener passender Commit-Message landen.
> 2. Der Agent committet alle Teile, zu denen keine offenen Fragen mehr bestehen und die fachlich wie technisch konsistent abgeschlossen sind.
> 3. Nötige Anpassungen am KI-Wissen werden nach den sonstigen Wissensregeln nachgezogen, dokumentiert und ebenfalls committed.
> 4. Verbleibende offene Fragen, Konflikte oder bewusste Entscheidungsbedarfe werden danach kompakt benannt.
>
> Zusätzlich gilt:
>
> - Teile, die noch von offenen Fragen abhängen, sollen nicht vorschnell committed werden.
> - Uncommittete Änderungen, die erkennbar nicht zu diesem Thread gehören, sind kein automatischer Blocker und können am Ende kurz als Hinweis genannt werden.
> - Gemachte Commits sollen im Abschluss jeweils in einer eigenen Zeile mit ihrer Commit-Message genannt werden, damit sie schnell erkennbar sind.
> - Wenn nach der Finito-Sequenz keine relevanten offenen Punkte mehr für diesen Thread übrig sind, gilt der Thread als abgeschlossen und archivierungsreif. Kannst du diese Finito-Sequenz anstatt der Abschlusskommandos in die Agents.md übernehmen?

## Kernaussagen aus der Anforderung
- `Finito` und `Ende` sollen die neue explizite Abschlusssequenz für den aktuellen Thread auslösen.
- Die bisherige Abschlusslogik soll durch eine Finito-Sequenz mit Commit-Aufteilung nach zusammenhängenden Themen ersetzt werden.
- Fachlich oder technisch abgeschlossene Teile sollen direkt commitbar sein, solange keine offenen Fragen mehr daran hängen.
- Nötige Wissenspflege gehört verbindlich zum Abschluss und soll ebenfalls committed werden.
- Offene Fragen, Konflikte oder bewusst ausstehende Entscheidungen sollen am Ende kompakt sichtbar bleiben.
- Fremde uncommittete Änderungen dürfen den Thread-Abschluss nicht automatisch blockieren.
- Wenn keine relevanten offenen Punkte für den Thread bleiben, gilt der Stand als abgeschlossen und archivierungsreif.
