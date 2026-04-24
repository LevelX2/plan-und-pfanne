---
typ: prozess
status: aktiv
letzte_aktualisierung: 2026-04-23
quellen:
  - ../Risiken und offene Punkte/Lokale Mobile-App vs gehosteter Betrieb.md
  - ../../01 Rohquellen/externe-quellen/2026-04-23 Mobile Distribution und Updates.md
  - ../../01 Rohquellen/externe-quellen/2026-04-23 PWA lokale Persistenz und Migrationen.md
  - ../Begriffe und Konzepte/Systembild und technischer Zuschnitt.md
  - ../Begriffe und Konzepte/Produktbild und Kernlogik.md
  - ../../../next.config.ts
  - ../../../src/lib/local-db.ts
  - ../../../src/lib/local-store.ts
  - ../../../src/app/home-client.tsx
  - ../../../src/app/rezepte/recipes-client.tsx
  - ../../../src/app/tage/page.tsx
  - ../../../src/app/einkaufsliste/shopping-list-client.tsx
  - ../../../src/app/einstellungen/page.tsx
  - ../../../.github/workflows/deploy-pages.yml
  - ../../../public/service-worker.js
  - ../../../src/lib/offline-store.ts
tags:
  - pwa
  - migration
  - offline
  - umstieg
---

# Umstiegspfad auf lokale PWA

## Einordnung
Diese Seite ist kein aktueller Produktleittext mehr, sondern eine historische Migrationsdokumentation.
Sie beschreibt den Umstieg von der früheren serverzentrierten App auf den heute primären PWA-Zuschnitt und bleibt als Referenz für Origin-Fragen, Migrationsschritte und noch offene Restarbeiten relevant.

## Historisches Zielbild des Umstiegs
`Plan und Pfanne` soll als lokale PWA auf dem Handy laufen:
- App-Logik clientseitig
- Nutzdaten lokal auf dem Gerät
- installierbar über den Browser
- neue Versionen über statisches Hosting
- neue Rezepte optional über Dateiimport oder einen einfachen Feed

Dabei soll der aktuelle serverzentrierte Workspace nicht bloß kosmetisch angepasst, sondern bewusst in eine lokale Architektur überführt werden.

## Warum eine feste URL beziehungsweise Origin wichtig ist
Die entscheidende technische Größe ist nicht irgendeine frei eingebbare Ziel-URL, sondern die `Origin` der App:
- Schema wie `https`
- Domain
- Port

Die Origin bestimmt bei einer PWA unter anderem:
- IndexedDB- und anderer lokaler Speicher
- Service-Worker-Registrierung
- App-Manifest und Installationsidentität
- Berechtigungen und Cache-Bestand

### Was das praktisch bedeutet
- Wenn dieselbe App später unter einer anderen Domain läuft, kann sie die alte lokale Datenbank nicht direkt weiterverwenden.
- Deshalb sollte die `App-Adresse` möglichst früh stabil gewählt werden.
- Diese feste App-Origin ist etwas anderes als ein optional konfigurierbarer `Feed-Server` oder `Import-Server`.

### Einordnung für den aktuellen Projektzeitpunkt
- Wenn noch keine produktiven Installationen und keine schützenswerten lokalen Bestände bei realen Nutzern existieren, ist jetzt der richtige Zeitpunkt für die Festlegung der finalen Origin.
- Ein späterer Wechsel wäre deutlich teurer, weil installierte PWAs, lokale IndexedDB-Daten und Service-Worker-Zustände dann nicht nahtlos mitwandern.

### Was man trotzdem frei konfigurierbar machen kann
- URL für Rezept-Feed
- URL für Importdateien oder Metadaten
- URL für einen optionalen Backup- oder Sync-Endpunkt

Diese Werte können in den App-Einstellungen stehen, ohne dass sich die eigentliche PWA-Origin ändert.

## GitHub als feste App-Origin
Ja, das ist grundsätzlich möglich.

### Wann das gut passt
- wenn `Plan und Pfanne` als statisch ausgelieferte PWA gebaut wird
- wenn GitHub ohnehin Quell- und Release-Ort bleibt
- wenn bewusst früh entschieden wird, bevor reale Installationen geschützt werden müssen

### Welche GitHub-Varianten es praktisch gibt
- Projektseite unter `https://<owner>.github.io/<repo>/`
- Nutzer- oder Organisationsseite unter `https://<owner>.github.io/`
- besser noch:
  eigene Domain auf GitHub Pages, zum Beispiel `https://app.plan-und-pfanne.de`

### Projektnahes Urteil
- Eine reine `github.io`-URL ist für den Start völlig brauchbar.
- Wenn die App später langfristig stabil laufen soll, ist eine eigene Domain auf GitHub Pages die sauberste Variante.
- Der Grund ist nicht Technikverliebtheit, sondern Stabilität:
  Ein Wechsel von Repository-Name, Owner oder Hostingpfad würde sonst wieder die Origin ändern.

### Technische Folge für die App
- Bei einer Projektseite unter `/repo-name/` müssen
  `start_url`, `scope`, Asset-Pfade und Service-Worker-Pfade sauber auf dieses Unterverzeichnis abgestimmt werden.
- Eine Root-Domain oder eigene Domain ist für PWAs meist einfacher als ein dauerhaftes Unterpfad-Modell.

## Einordnung des aktuellen Workspace
Der aktuelle Stand ist keine lokale PWA-Architektur, sondern eine serverzentrierte Web-App:
- `src/lib/db.ts` arbeitet mit `better-sqlite3` und echter Serverdatei
- `src/lib/store.ts` ist `server-only`
- `src/lib/auth.ts` setzt Sessions, Cookies und Serverprüfungen voraus
- der Service Worker in `public/service-worker.js` unterstützt aktuell nur einen lesenden Offline-Modus
- `src/lib/offline-store.ts` speichert derzeit nur Snapshots in einer kleinen IndexedDB-Struktur

Für den Umstieg müssen daher Rechenkern, Persistenz und Zustandsmodell systematisch vom Server auf das Gerät verlagert werden.

## Zielarchitektur nach dem Umstieg
### Lokal auf dem Gerät
- Einstellungen
- Historie
- Wochenpläne
- Einkaufsstatus
- aktive Gerichte
- optional importierte oder synchronisierte Rezept-Metadaten

### Statisch ausgeliefert
- HTML
- CSS
- Client-JavaScript
- Manifest
- Service Worker
- Icons und statische Assets

### Optional extern
- Rezeptfeed
- Download neuer Seed- oder Importpakete
- optionales Backup oder Exportziel

## Migrationsplan
### Phase 1: Zielzuschnitt festziehen
1. Produktgrenze explizit festlegen:
   `eine Person, primär ein Handy, lokale Daten`.
2. Klären, welche Daten zwingend lokal dauerhaft erhalten bleiben sollen:
   mindestens `settings` und `history`.
3. Früh eine stabile App-Origin festlegen.
   Ideal ist eine dauerhafte Projekt-Domain oder zumindest eine bewusst langfristige Hosting-Adresse.
4. Festlegen, ob neue Rezepte über
   - Dateiimport
   - öffentlichen Feed
   - oder beide Wege kommen sollen.

### Phase 2: Fachkern vom Server entkoppeln
1. Den fachlichen Planungsalgorithmus aus `src/lib/store.ts` so schneiden, dass er ohne Server-APIs nutzbar ist.
2. Reine Fachlogik von Infrastruktur trennen:
   - Planung
   - Rezeptfilter
   - Einkaufslisten-Ableitung
   - Datumslogik
3. Servergebundene Teile separat halten:
   - Auth
   - SQLite-Datei
   - Route Handler
   - Scheduler-Endpunkte

### Phase 3: Lokales Datenmodell definieren
1. Die bisherige kleine Offline-DB aus `src/lib/offline-store.ts` zu einer echten lokalen App-Datenbank ausbauen.
2. Wahrscheinliche Stores:
   - `settings`
   - `recipes`
   - `week_plans`
   - `history`
   - `shopping_state`
   - `active_meals`
   - `imports`
   - `app_meta`
3. In `app_meta` mindestens pflegen:
   - Datenbankschema-Version
   - importierte Feed-Version
   - letzter erfolgreicher Migrationslauf
   - letzter Rezeptabgleich

### Phase 4: Migrationssystem einführen
1. IndexedDB-Version bewusst steuern.
2. Jede Schemaänderung als explizite Migration dokumentieren.
3. Alte Datenstände sauber nachziehen statt Stores stillschweigend neu anzulegen.
4. Bei Migrationsfehlern einen sichtbaren Fallback bauen:
   - Fehlerhinweis
   - optional Exportversuch
   - danach erst kontrollierter Reset

### Phase 5: Serverabhängige Funktionen ablösen
1. Authentifizierung und Sessions entfernen oder vollständig deaktivieren.
2. Nutzerscharfe Serverlogik auf ein Single-Device-Modell zurückbauen.
3. Die Wochenplanung lokal im Client oder in lokal ausführbarer Shared-Logik starten.
4. Aktionen wie `Woche neu generieren` nicht mehr per Server Action, sondern direkt lokal ausführen.

### Phase 6: UI schrittweise auf lokale Quelle umstellen
1. Dashboard lokal aus IndexedDB lesen.
2. Einstellungen lokal lesen und speichern.
3. Rezeptbibliothek aus lokalem Datenbestand rendern.
4. Einkaufsliste und aktive Gerichte vollständig lokal halten.
5. Historie explizit als lokales Modul modellieren statt implizit aus dem aktuellen Wochenstand abzuleiten.

### Phase 7: Rezept-Nachschubmodell bauen
1. Basis-Rezeptbestand mit der App ausliefern.
2. Optionalen Feed-Import ergänzen:
   - Manifest oder JSON mit Rezeptpaketen
   - Versionierung
   - Konfliktregeln
3. Alternativ oder zusätzlich Dateiimport unterstützen:
   - JSON-Datei
   - klarer Importdialog
   - Validierung und Dublettenlogik
4. Importierte Daten getrennt von App-Code behandeln, damit App-Updates und Rezept-Updates unabhängig werden.

### Phase 8: PWA-Updatepfad sauber machen
1. Service Worker von reinem Lese-Cache auf kontrollierte Update-Strategie umbauen.
2. Alte Caches bewusst bereinigen.
3. Sichtbaren Updatehinweis einbauen:
   `Neue Version verfügbar`.
4. Datenmigration und Asset-Update koordinieren, damit neue UI nicht gegen alte Datenstrukturen läuft.
5. Manifest-ID und Startpfad stabil halten, damit installierte App-Identität nicht ungewollt bricht.

### Phase 9: Export und Wiederherstellung ergänzen
1. Exportfunktion für lokale Daten vorsehen.
2. Mindestens diese Bereiche exportierbar machen:
   - Einstellungen
   - Historie
   - Wochenstände
   - Importzustand
3. Wiederherstellung bewusst versioniert aufbauen, damit Exporte auch nach App-Updates wieder einspielbar bleiben.

### Phase 10: Verteilung und Release
1. Statisches Hosting für die PWA festlegen.
2. GitHub als Quell- und Build-Ort nutzen.
3. Automatischen Deploy auf die feste App-Origin einrichten.
4. Release-Checkliste definieren:
   - Build
   - Service-Worker-Version
   - Datenbank-Migration
   - Offline-Test
   - Update-Test von alter auf neue Version

### Phase 11: Test- und Abnahmepfad
1. Frische Installation auf iPhone und Android testen.
2. Update von Version N auf N+1 testen.
3. Migration mit altem lokalen Datenbestand testen.
4. Offline-Neustart testen.
5. Verhalten nach Speicherdruck und nach manuellem Löschen von Site-Daten dokumentieren.

## Empfohlene Umsetzungsreihenfolge im Projekt
1. Feste Origin und Distributionsweg festlegen.
2. Fachkern aus dem Servercode herauslösen.
3. Lokales IndexedDB-Datenmodell mit Migrationen einführen.
4. Einstellungen, Historie und Wochenpläne lokal nutzbar machen.
5. Auth und serverseitige Planungsaktionen entfernen.
6. Rezeptfeed oder Dateiimport ergänzen.
7. Service-Worker-Updatefluss robust machen.
8. Export und Wiederherstellung ergänzen.
9. Erst danach produktnah auf dem Handy testen und feinpolieren.

## Antwort auf die URL-Frage
`Die URL für die App selbst` sollte stabil sein.
`Eine URL für Datenquellen` kann konfigurierbar sein.

Das ist kein Widerspruch, sondern eine saubere Trennung:
- stabile App-Origin für Installation, Speicher und Updates
- flexible Feed- oder Import-URL für Rezeptnachschub

## Projektnahes Urteil
Für `Plan und Pfanne` ist ein Umstieg auf lokale PWA plausibel, aber nicht nur ein Deploymentwechsel.
Der Kernaufwand liegt in:
- Entkopplung vom Server
- Aufbau einer echten lokalen Datenbank
- Migrationen
- klarer Update- und Exportlogik

Wenn dieser Pfad gewählt wird, sollte die feste App-Origin früh entschieden und danach nicht mehr leichtfertig gewechselt werden.

## Workspace-Stand am 2026-04-23
Der Umstieg ist nicht mehr nur geplant, sondern in zentralen Teilen bereits umgesetzt.

### Bereits im Code angekommen
- Statischer Export für GitHub Pages mit buildzeitlichem `basePath`
- PWA-Manifest, Service Worker und Registrierungslogik für den Unterpfad `/<repo>/`
- lokale IndexedDB-Struktur für Einstellungen, Rezepte, Historie, Wochenpläne und Meta-Informationen
- Dashboard, Einstellungen, Rezepte, Tagesansicht und Einkaufsliste auf lokale Datenquellen umgestellt
- Detailansichten über Query-Parameter statt dynamische Exportpfade
- GitHub-Actions-Workflow für den Pages-Deploy

### Noch ausstehend
- Rezeptimport oder Feed-Modell
- Export und Wiederherstellung lokaler Daten
- produktnahe Handy- und Update-Tests
- vollständige Bereinigung des alten serverzentrierten Zwischenstands
