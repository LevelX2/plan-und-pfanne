---
typ: risiko
status: aktiv
letzte_aktualisierung: 2026-04-24
quellen:
  - ../Begriffe und Konzepte/Systembild und technischer Zuschnitt.md
  - ../Begriffe und Konzepte/Benutzerkonzept und Verifikation.md
  - ../Begriffe und Konzepte/Produktbild und Kernlogik.md
  - ../00 Uebersichten/Aktueller Projektstatus.md
  - ../../01 Rohquellen/externe-quellen/2026-04-23 Railway Pricing und Trial.md
  - ../../01 Rohquellen/externe-quellen/2026-04-23 Mobile Distribution und Updates.md
  - ../../01 Rohquellen/externe-quellen/2026-04-23 PWA lokale Persistenz und Migrationen.md
  - ../../../src/lib/db.ts
  - ../../../src/lib/store.ts
tags:
  - architektur
  - offline
  - mobil
  - hosting
---

# Lokale Mobile-App vs gehosteter Betrieb

## Anlass
Für `Plan und Pfanne` steht eine echte Richtungsfrage im Raum:
Soll die App als gehostete Web- beziehungsweise PWA-Anwendung mit Nutzerkonten laufen oder bewusst als rein lokale Mobile-App, bei der Planungsdaten nur auf dem Gerät liegen und neue Rezepte nur per Dateiimport oder optionaler Serverabfrage hinzukommen.

## Aktuelle Einordnung nach dem Tageskonzept-Umbau
Der primäre Produktpfad ist inzwischen die lokale, statisch exportierte PWA mit IndexedDB-Datenhaltung auf dem Gerät.

Damit ist die ursprüngliche Richtungsfrage nicht mehr offen im Sinn von `Server-App oder lokale App`, sondern als historische Abwägung und als Warnung vor Rückfällen relevant:
- Login, Server-Scheduler, SQLite und Railway-Zuschnitt sind nicht mehr der aktuelle Produktkern.
- Alte Servermodule liegen weiterhin im Repository und können für spätere Varianten oder Aufräumarbeiten wichtig sein.
- Die bleibenden Risiken der lokalen Variante sind Export, Backup, Gerätewechsel, Origin-Stabilität und echte Mobil-/Offline-Tests.

## Kurzantwort
Ja, eine rein lokale Mobile-Variante ist fachlich möglich.
Sie ist inzwischen der eingeschlagene Hauptpfad. Die Seite bleibt nützlich, weil sie erklärt, welche Folgen dieser Pfad hat und was bei einem späteren Wechsel zurück zu Hosting, Sync oder Mehrnutzerbetrieb neu entschieden werden müsste.

## Was der Workspace vor dem lokalen Umbau war
- Der Stand vom 2026-04-23 war serverzentriert:
  Next.js-App mit Server Components, Server Actions, Route Handlern, `better-sqlite3` und passwortloser Anmeldung.
- `src/lib/db.ts` und `src/lib/store.ts` sind als `server-only` angelegt und setzen eine laufende Serverumgebung mit SQLite-Datei voraus.
- Die damalige Offline-Fähigkeit war ein lesender PWA-Modus für bereits geladene Inhalte, keine vollständig lokal schreibende App.
- Neue Rezepte kommen derzeit als kuratierte Seed-Datensätze in den Repository-Bestand und werden beim App-Start in SQLite übernommen, nicht als freier Laufzeitimport.

## Was bei einer rein lokalen Mobile-Variante wegfallen könnte
- verpflichtende Benutzerverwaltung
- Session-Cookies und E-Mail-Verifikation
- Railway als Hosting für App-Laufzeit, Datenbankvolume und Scheduler
- serverseitige Secrets für Authentifizierung und Mailversand

## Was stattdessen nötig wäre
- Planungslogik und Persistenz müssten auf das Gerät verlagert werden, zum Beispiel in IndexedDB, lokalem SQLite innerhalb einer nativen Hülle oder einem anderen lokalen Speicher.
- Die aktuell serverseitige Wochenplanung müsste lokal ausführbar sein.
- Rezeptnachschub müsste als bewusstes Importmodell gestaltet werden:
  Dateiimport auf dem Gerät oder Abruf eines öffentlichen Rezeptfeeds.
- Backup, Gerätewechsel und Datenverlust müssten produktseitig neu beantwortet werden, weil ohne Konto keine automatische Wiederherstellung existiert.

## Wichtige Folgen der lokalen Variante
### Vorteile
- deutlich weniger Betriebsaufwand
- kein produktiver Mailversand
- keine Authentifizierungsoberfläche nötig
- keine Serverkosten für den normalen Einzelgerätebetrieb

### Nachteile
- kein geräteübergreifender Sync
- höheres Risiko für Datenverlust bei Handywechsel, Defekt oder App-Löschung
- Wochenplanung, Einstellungen und lokale Zustände sind nur auf genau diesem Gerät vorhanden
- automatische serverseitige Aufgaben wie ein zentraler Wochen-Scheduler entfallen oder müssten lokal ganz anders gelöst werden
- die aktuelle Next.js-Serverarchitektur wäre dafür nicht nur leicht anzupassen, sondern in zentralen Teilen umzubauen

## Einordnung der Serverabfrage für neue Rezepte
- Eine Serverabfrage für neue Rezepte erzwingt nicht automatisch Benutzerkonten.
- Wenn nur ein öffentlicher Rezeptfeed gelesen wird, kann das auch ohne Login funktionieren.
- In diesem Fall entfällt Railway nicht zwingend wegen des Rezeptfeeds, aber Railway wäre nicht mehr zwingend die passende oder notwendige Lösung.
- Für einen reinen Feed reicht oft schon sehr leichtes Hosting oder sogar ein statisch ausgelieferter Datenstand.

## Railway-Kosten und Trial-Stand
- Die am 2026-04-23 geprüfte Railway-Lage ist etwas differenzierter als `nach 30 Tagen nicht mehr kostenlos`.
- Neue Accounts erhalten aktuell einen 30-Tage-Trial mit einmalig 5 USD Guthaben.
- Danach fällt der Account auf den Free-Plan mit 0 USD Grundpreis und 1 USD freien Ressourcen pro Monat zurück.
- Für eine dauerhaft laufende App mit Serverlogik ist dieses Restbudget voraussichtlich schnell aufgebraucht.
- Zusätzlich sind Cron-Jobs laut aktueller Railway-Preisseite im Free-Bereich nur während des Trials verfügbar.
- Für `Plan und Pfanne` bedeutet das:
  Eine gehostete Server-App bleibt zwar theoretisch nicht sofort kostenpflichtig, ist praktisch aber nach dem Trial nur noch sehr eingeschränkt kostenlos.

## Vergleichsmatrix
| Kriterium | Rein lokale Mobile-App | Gehostete Web-/PWA-App |
| --- | --- | --- |
| Laufzeitmodell | App-Logik und Daten liegen auf dem Gerät | Serverlogik, Persistenz und Auslieferung laufen zentral |
| Benutzerverwaltung | meist nicht nötig, wenn nur ein Gerät und ein Nutzer vorgesehen sind | sinnvoll oder nötig, sobald persönliche Daten sauber getrennt werden sollen |
| Betriebskosten | sehr gering, weil kein dauerhafter App-Server nötig ist | laufende Hosting-Kosten wahrscheinlich, auch wenn der Einstieg günstig sein kann |
| Offline-Nutzung | sehr stark, weil das Kernmodell lokal ist | gut für Lesemodus möglich, aber serverseitige Schreibvorgänge sind schwieriger |
| Gerätewechsel und Backup | kritisch, wenn kein Export- oder Backup-Konzept existiert | einfacher, weil Daten zentral gesichert und erneut geladen werden können |
| Mehrgeräte-Nutzung | schwach oder nur über Zusatzlösungen | deutlich einfacher erweiterbar |
| Rezept-Nachschub | Dateiimport oder öffentlicher Feed gut möglich, aber als eigener Importfluss zu bauen | zentral leichter steuerbar und für alle Nutzer gleichzeitig aktualisierbar |
| Technische Komplexität im aktuellen Projekt | Hauptpfad ist inzwischen umgesetzt, Restaufwand liegt bei Import, Backup, Tests und Bereinigung | wäre wieder ein Richtungswechsel mit Sync-, Auth- und Betriebsfragen |
| Datenschutzgefühl | stark, weil Daten standardmäßig nur lokal liegen | braucht saubere Kommunikation zu Login, Hosting und Datenspeicherung |
| Produktpflege | weniger Betriebsaufwand, aber mehr Sorgfalt bei lokalem Datenmodell und Migrationen | mehr Betriebsaufwand, aber zentrale Updates und Fehlerbehebungen |
| Scheduler und Automatisierung | lokal anders zu denken oder ganz zu streichen | zentral einfacher umsetzbar |
| Passung für `Plan und Pfanne` | sehr passend, wenn das Ziel bewusst `eine Person, ein Handy, lokale Daten` bleibt | passend, wenn Webzugriff, spätere Mehrgeräte-Nutzung oder Sharing denkbar bleiben |

## Verdichtete Vor- und Nachteile
### Rein lokale Mobile-App
**Vorteile**
- keine Pflicht zu Login, Mailversand und Session-Verwaltung
- sehr geringer oder gar kein laufender Hosting-Bedarf
- starkes Gefühl von Privatheit und Datenhoheit
- natürlicher Offlinemodus

**Nachteile**
- aktueller Server-Workspace müsste in zentralen Teilen umgebaut werden
- kein automatischer Sync zwischen Geräten
- höheres Risiko bei Handyverlust, App-Löschung oder Gerätewechsel
- Import, Backup und Wiederherstellung müssen bewusst gestaltet werden

### Gehostete Web-/PWA-App
**Vorteile**
- könnte bei späterem Mehrgeräte- oder Sharing-Bedarf wieder attraktiv werden
- Daten sind zentral verfügbar und damit leichter über mehrere Geräte nutzbar
- neue Rezepte, Korrekturen und Produktänderungen lassen sich zentral ausrollen
- spätere Erweiterungen wie Sharing oder serverseitige Synchronisation bleiben offen

**Nachteile**
- laufende Hosting- und Betriebsfragen bleiben bestehen
- Login, Datenschutz und Mailversand erhöhen die Produktkomplexität
- echter Offline-Schreibbetrieb ist schwieriger
- Railway ist nach dem Trial nur noch sehr eingeschränkt kostenlos

## Installations- und Updatewege
### Option A: Lokale PWA mit statischem Hosting
**Wie kommt die App aufs Handy**
- iPhone:
  Nutzer öffnet die URL in Safari und legt die Seite über `Zum Home-Bildschirm` als Web-App ab.
- Android:
  Nutzer öffnet die URL im Browser und installiert die Web-App über den Browser-Installationsweg oder legt sie zum Home-Bildschirm.

**Wie kommen Updates**
- Neue Version wird in GitHub veröffentlicht und über GitHub Pages oder anderes statisches Hosting ausgeliefert.
- Beim nächsten Öffnen oder Neuladen lädt die Web-App die neuen Dateien; mit gutem Service-Worker-Verhalten kann zusätzlich ein sichtbarer Hinweis `Neue Version verfügbar` eingeblendet werden.

**GitHub-Passung**
- sehr gut, wenn die App vollständig statisch gebaut werden kann
- wichtig:
  GitHub Pages ist nur für statische Dateien geeignet und passt deshalb zum aktuellen lokalen PWA-Zuschnitt, nicht zu einem serverzentrierten SQLite-/Auth-Betrieb

### Option B: Echte Mobile-App-Hülle mit lokaler Datenhaltung
Zum Beispiel über eine Web-Hülle wie Capacitor oder über einen nativeren App-Pfad.

**Wie kommt die App aufs Handy**
- iPhone:
  praktisch am ehesten über TestFlight
- Android:
  entweder über Google Play Internal Testing oder direkt per APK-Datei

**Wie kommen Updates**
- iPhone:
  TestFlight verteilt neue Builds und zeigt Updates direkt in der TestFlight-App an
- Android:
  bei Google Play Internal Testing kommen Updates über den Play-Mechanismus;
  bei GitHub-Releases mit APK muss der Nutzer die neue APK erneut herunterladen und installieren

**GitHub-Passung**
- Android:
  gut als Download-Ort für APK-Releases
- iPhone:
  nur eingeschränkt als Artefaktablage sinnvoll;
  als eigentlicher Updatekanal ist TestFlight deutlich realistischer

### Option C: Voll manuelle Einzelverteilung
**Wie kommt die App aufs Handy**
- Build lokal erzeugen und direkt auf das Zielgerät installieren

**Wie kommen Updates**
- jede neue Version wieder manuell verteilen und installieren

**Einordnung**
- für einen einzelnen Anwender machbar
- aber auf Dauer unnötig umständlich, sobald häufiger aktualisiert wird

### Option D: Echte Store-App
**Wie kommt die App aufs Handy**
- iPhone:
  Installation über den App Store
- Android:
  entsprechendes Gegenstück wäre Google Play

**Wie kommen Updates**
- Updates kommen über den normalen Store-Mechanismus.
- Auf dem iPhone können App-Store-Apps automatisch oder manuell aktualisiert werden.

**Voraussetzungen**
- iPhone:
  Apple Developer Program mit aktuell 99 USD Jahresgebühr laut Apple
- App-Review, Store-Metadaten, Screenshots, Datenschutzangaben und Release-Prozess
- Technisch braucht `Plan und Pfanne` dafür eine echte iOS-App oder eine App-Hülle, die als natives Paket eingereicht wird

**Sichtbarkeitsoptionen auf iPhone**
- öffentlich im App Store
- `unlisted`:
  nur über Direktlink auffindbar, aber weiterhin offizieller App-Store-Weg
- privat über Apple Business Manager oder Apple School Manager:
  eher für Organisationen als für einen einzelnen privaten Nutzer gedacht

**GitHub-Passung**
- GitHub eignet sich hier gut als Build- und Automationsquelle.
- Ein möglicher Zielpfad wäre:
  GitHub -> Build/Signierung -> Upload zu App Store Connect oder TestFlight.
- Der eigentliche Updatekanal auf dem Gerät bleibt dann aber der App Store und nicht GitHub.

## Praktische Empfehlung für `Plan und Pfanne`
- Wenn die App lokal bleiben und Updates bequem über GitHub kommen sollen, ist `lokale PWA + statisches Hosting` der sauberste Zielweg.
- Dann wäre der Updateweg sehr einfach:
  GitHub-Push oder Release -> statischer Deploy -> App lädt beim nächsten Öffnen die neue Version.
- Wenn dagegen ein echtes installierbares App-Paket mit möglichst nativer Anmutung gewünscht ist, wirkt für einen Einzelanwender dieses Modell am praktikabelsten:
  - iPhone über TestFlight
  - Android über Play Internal Testing oder notfalls GitHub-APK
- Wenn ein offizieller iPhone-Installations- und Updateweg wichtig ist, ohne die App normal im Store suchbar zu machen, ist `unlisted App Store` eine ernsthafte Option.
- Für nur einen Anwender ist ein voller App-Store-Weg zwar möglich, aber organisatorisch und finanziell deutlich schwerer als `PWA` oder `TestFlight`.
- Der aktuelle Workspace passt zu keinem dieser Wege direkt:
  Vorher wäre ein Umbau von serverzentrierter Next.js-Logik auf lokale Persistenz und lokalen Rechenkern nötig.

## Einordnung einer echten App im App Store
Ja, das ist für `Plan und Pfanne` grundsätzlich möglich.

### Was daran attraktiv ist
- Installation und Updates laufen für den Nutzer sehr sauber und vertraut.
- Der iPhone-Nutzer bekommt neue Versionen über denselben Mechanismus wie andere Apps.
- Wenn `Plan und Pfanne` als lokale App gebaut wird, können Einstellungen und Historie dort ebenfalls lokal im App-Sandbox-Kontext gehalten werden.
- GitHub kann trotzdem eine wichtige Rolle spielen:
  als Quellcode-, CI- und Release-Ort bis hin zum Upload nach App Store Connect.

### Was daran aufwendiger wird
- jährliche Apple-Mitgliedschaft
- App-Review und Freigabeprozess
- Paketierung, Signierung und Store-Metadaten
- stärkere Plattformbindung an Apple-Vorgaben

### Projektnahes Urteil
- Für `nur einen Anwender` ist der echte App Store eher nicht die einfachste Lösung.
- Wenn `offizieller Installationsweg auf dem iPhone` wichtiger ist als Minimalaufwand, ist er trotzdem realistisch.
- Die pragmatischste Zwischenlösung wäre oft:
  zuerst TestFlight und später, falls gewünscht, eine unlisted App-Store-Veröffentlichung.

## Lokale Daten über Versionen hinweg
Ja, das ist grundsätzlich möglich und sogar ein normaler PWA-Ansatz.

### Was erhalten bleiben kann
- Einstellungen
- Verlauf oder Historie
- lokal gespeicherte Tagespläne
- lokale Import- und Sync-Metadaten

### Unter welchen Bedingungen das zuverlässig funktioniert
- Die App bleibt auf derselben Origin:
  also gleiches Protokoll, gleiche Domain und gleicher Port.
- Die lokale Datenbank wird bewusst versioniert.
- Neue App-Versionen enthalten Migrationslogik für ältere Datenstände.

### Wie Migrationen typischerweise laufen
- Für strukturierte lokale Daten ist IndexedDB der naheliegende Browser-Speicher.
- Wenn die Datenbankversion erhöht wird, löst IndexedDB `onupgradeneeded` aus.
- In diesem Schritt können neue Stores, Felder, Indizes oder Datenumformungen angelegt werden.
- Service-Worker- und Asset-Updates löschen diese Daten nicht automatisch.

### Wichtige Grenzen
- Browserdaten sind nicht absolut garantiert wie bei einer nativen lokalen App-Datenbank.
- Nutzer können Site-Daten manuell löschen.
- Browser können Daten unter Speicherknappheit oder je nach Plattformpolitik verwerfen.
- Für Safari und andere WebKit-basierte Browser gilt:
  Persistenz ist grundsätzlich möglich, aber weiter heuristisch; eine installierte Home-Screen-Web-App kann dabei helfen.
- Wenn die App später auf eine andere Domain umzieht, kann die neue Version nicht direkt auf die alte lokale Datenbank zugreifen.

### Projekteinordnung
Für `Plan und Pfanne` wäre es fachlich gut passend, mindestens diese Daten lokal migrationsfähig zu halten:
- `settings`
- `history`
- optionale lokale Cache- und Importtabellen

Damit ließe sich ein Update über GitHub oder statisches Hosting gut mit dauerhafter lokaler Datennutzung verbinden, solange der Origin stabil bleibt und Migrationen als fester Teil der App gepflegt werden.

## Praktische Entscheidungsregel
- Wenn das Ziel bewusst `eine Person, ein Handy, lokale Daten` bleibt, passt der aktuelle lokale PWA-Zuschnitt.
- Wenn das Ziel später Richtung mehrere Geräte, Sharing, zentraler Sync oder Nutzerkonten kippt, muss das Produktmodell bewusst neu entschieden werden.

## Konsequenz für die aktuelle Roadmap
Die Frage ist keine Detailoptimierung, sondern eine Richtungsentscheidung:
- Der lokale Single-Device-Pfad ist aktuell eingeschlagen.
- Deshalb sollten Login, Server-Scheduler, Railway-Zuschnitt und SQLite-Persistenz nicht stillschweigend wieder zum Hauptpfad werden.
- Die nächsten Roadmap-Fragen liegen bei Offline-/Update-Tests, Export und Backup, Rezeptnachschub und späterer Bereinigung alter Serverartefakte.
