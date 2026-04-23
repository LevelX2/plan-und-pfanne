# Log

## [2026-04-22] wissensbasis | Grundstruktur für Projekt angelegt
- `AGENTS.md` auf projektbezogene Wissensbasis und wiki-first Arbeitsweise umgestellt.
- Regel zur Freigabe vor Wissenspflege bewusst entschärft:
  klare Aktualisierungen dürfen direkt erfolgen, größere Struktur- oder Konfliktfälle sollen weiterhin bewusst abgestimmt werden.
- Erste Wissensbasis unter `ai-project-memory/` mit Einstieg, Übersichten, Prozessen, Entscheidungen und Betriebsseiten angelegt.
- Erste Projektkenntnisse aus `README.md`, `KODEX_STAND.md`, `package.json`, `AGENTS.md` und `src/app/page.tsx` in verdichtete Wissensseiten überführt.

## [2026-04-22] wissensbasis | Vertiefte Ist-Stand-Analyse des Repositories eingearbeitet
- Vertiefte Repository-Analyse als neue Rohquellen-Referenz unter `01 Rohquellen/repo-root/2026-04-22 Repository-Iststand-Analyse.md` angelegt.
- Wissensseiten zu Status, Quellenlage, Produktlogik, Systembild und Quellenbewertung auf den verifizierten Workspace-Stand aktualisiert.
- Neue Wissensseite `02 Wissen/Risiken und offene Punkte/Offene Fragen und Prüfbedarf.md` angelegt, um bestätigte Lücken, konzeptionelle Prüfstellen und technische Nacharbeiten gesammelt sichtbar zu halten.
- Verifikation dokumentiert:
  `npm run lint` erfolgreich, `npm run build` erfolgreich mit Turbopack-Warnung zur breiten Dateinachverfolgung.
- Persistierten Datenstand eingeordnet:
  `data/planner.sqlite` enthält Seed-Rezepte und mindestens einen real erzeugten Wochenplan.

## [2026-04-22] betrieb | Wissensordner und Projektpfad auf Plan-und-Pfanne-Namensschema umgestellt
- Der Wissensordner wurde von `ai-project-memory/` auf `KI-Wissen-Plan-und-Pfanne/` umbenannt.
- `AGENTS.md` wurde auf den neuen Wissensordnerpfad umgestellt.
- Kerntexte der Wissensbasis verwenden jetzt `Plan und Pfanne` als Projektnamen statt des älteren Arbeitsnamens `gluten freie Rezepte`.
- Der aktive Projektpfad wurde auf `C:\Users\Lui\OneDrive\Projekte\plan-und-pfanne` umgestellt und in `KODEX_STAND.md` nachgezogen.
- Verifikation nach der Umstellung:
  `npm run lint` im neuen Projektpfad erfolgreich.

## [2026-04-22] betrieb | Übergabeauftrag für neuen Workspace festgehalten
- Nach Neuöffnung des Workspaces im Pfad `C:\Users\Lui\OneDrive\Projekte\plan-und-pfanne` soll zuerst geprüft werden, ob `C:\Users\Lui\OneDrive\Projekte\gluten freie Rezepte` nur ein technischer Restzustand des Umzugs ist.
- Danach soll entschieden und dokumentiert werden, ob der alte Ordner entfernt werden kann oder als bewusster Fallback erhalten bleiben muss.

## [2026-04-22] umsetzung | Fehlende Routen, Scheduler und Dokumentation auf Workspace-Stand gebracht
- Die fehlenden Routen `/einstellungen`, `/tage/[date]` und `/api/scheduler/weekly` wurden umgesetzt und mit den vorhandenen Store-Funktionen verbunden.
- Die Navigation im Produkt-UI verweist jetzt auch auf die neue Einstellungsseite; das Dashboard verlinkt zusätzlich in die Tagesansichten.
- `saveSettingsAction()` führt nach dem Speichern jetzt sichtbar zurück nach `/einstellungen?status=gespeichert`.
- Die Scheduler-Route wurde lokal per Request mit `force=1` erfolgreich verifiziert.
- Für Next.js 16 wurde `serverExternalPackages: ["better-sqlite3"]` in `next.config.ts` ergänzt; zusätzlich war eine unvollständige lokale `node_modules`-Installation zu reparieren, damit Build und Laufzeit wieder funktionieren.
- Verifikation:
  `npm run lint` erfolgreich, `npm run build` erfolgreich, Turbopack-NFT-Warnung zum Dateisystemzugriff bleibt als nicht blockierender Restpunkt bestehen.
- Der alte Ordner `C:\Users\Lui\OneDrive\Projekte\gluten freie Rezepte` wurde geprüft und wirkt aktuell wie ein OneDrive-Reparse-Restzustand ohne direkt auswertbare Dateien; keine automatische Löschung durchgeführt.

## [2026-04-23] betrieb | Produktive Railway-URL bekannt
- Die produktive Railway-Adresse wurde als `https://plan-und-pfanne-production.up.railway.app` festgehalten.
- Der Wissensstand wurde von „Deployment vorbereitet“ auf „produktive URL bekannt“ nachgeschärft.
- Nicht automatisch mitdokumentiert ist damit, ob der dort laufende Stand bereits alle aktuellen Commits enthält; das wäre gesondert zu verifizieren.

## [2026-04-23] betrieb | Produktiver Stand per Railway-CLI ausgerollt
- Der produktive Stand wurde manuell per Railway-CLI aus dem Projektverzeichnis ausgerollt.
- Verwendeter Befehl war `railway up -s plan-und-pfanne`.
- Die produktive URL zeigte danach erfolgreich die neuen Routen `/einstellungen` und `/api/scheduler/weekly`.
- Daraus ergibt sich als aktueller Betriebsstand, dass ein GitHub-Push allein nicht als verlässlich ausreichender Live-Deploy-Trigger behandelt werden soll, bis der Auto-Deploy-Pfad separat bestätigt ist.

## [2026-04-23] umsetzung | Fehler- und Offline-Verhalten produktnäher abgesichert
- Das Einstellungsformular behandelt erwartete Validierungs- und Speicherfehler jetzt inline statt über harte Laufzeitabbrüche.
- App-weite Fallback-Seiten für unerwartete Fehler und nicht gefundene Routen wurden ergänzt.
- Der Service Worker versucht bei Offline-Navigation zuerst die gecachte Zielseite und fällt danach auf `/` und `/rezepte` zurück.
- Produkttexte und README benennen den realen Offlinescope jetzt klarer als bewusst weitgehend lesenden Modus.
- Die Scheduler-Route ist in Production ohne `SCHEDULER_SECRET` absichtlich deaktiviert und nicht mehr stillschweigend offen erreichbar.
- Verifikation:
  `npm run lint` erfolgreich, `npm run build` erfolgreich, Turbopack-NFT-Warnung bleibt als nicht blockierender Restpunkt bestehen.

## [2026-04-23] wissensbasis | Benutzerkonzept für Verifikation und benutzerscharfen Zugriff ergänzt
- Die Chat-Anforderung zu verpflichtender Anmeldung, sinnvoller Verifikation und benutzerscharfem Einkaufssystem wurde als Rohquelle erfasst.
- Neue Wissensseite `02 Wissen/Begriffe und Konzepte/Benutzerkonzept und Verifikation.md` angelegt.
- Das Konzept legt passwortlose E-Mail-Verifikation, Session-Cookies, echte `user_id`-Trennung und geschützte App-Routen als Zielbild für öffentlichen Betrieb fest.
- `Index.md`, `Aktueller Projektstatus.md`, `Offene Fragen und Prüfbedarf.md`, `MVP-Leitentscheidungen.md` und `Generische Entwicklungsvorgaben.md` wurden darauf abgestimmt.
- Der aktuelle Workspace-Stand bleibt dabei bewusst getrennt markiert:
  aktuell Single-User ohne Login, Zielbild künftig benutzerscharf mit Verifikation.

## [2026-04-23] wissensbasis | Railway-Mailversand für Verifikation technisch eingeordnet
- Offizielle Railway-Dokumentation zu Outbound Networking, Variablen und Railway Domains als externe Rohquellen-Referenz erfasst.
- `Systembild und technischer Zuschnitt.md` ergänzt:
  Railway kann Mailversand für dieses Projekt durch gehostete Serverlogik und Variablen tragen, aber nicht als eigener eingebauter Maildienst.
- Für Verifikationsmails ist damit als Zielbild ein externer Transaktions-Maildienst vorgesehen.
- Laut dokumentierter Railway-Lage ist SMTP nur auf Pro und höheren Plänen verfügbar; auf Free-, Trial- und Hobby-Plänen ist ein HTTPS-basierter Mailanbieter nötig.

## [2026-04-23] wissensbasis | Resend als bevorzugter Freemium-Mailanbieter konkretisiert
- Offizielle Quellen zu Resend, Brevo, SMTP2GO und MailerSend als externe Rohquellen-Referenz erfasst.
- `Benutzerkonzept und Verifikation.md` hält jetzt Resend als bevorzugten Mailanbieter für den MVP fest.
- Die Einordnung stützt sich auf die gute Next.js-Passung, den dokumentierten Free-Tier, die fehlende Production-Freigabepflicht und die saubere Domain-Verifikation.
- Zusätzlich wurde der Ist-Stand des Workspaces nachgezogen:
  `src/lib/auth.ts` sendet produktive Login-Codes bereits über die Resend-API, sobald `RESEND_API_KEY` und `AUTH_FROM_EMAIL` gesetzt sind.

## [2026-04-23] wissensbasis | Aktive Gerichtsauswahl als Erweiterung von Wochenplan und Einkaufsliste ergänzt
- Die neue Chat-Anforderung zur selektiven Aktivierung geplanter Gerichte wurde als Rohquelle erfasst.
- `Produktbild und Kernlogik.md` beschreibt jetzt eine geplante Erweiterung, bei der einzelne geplante Mahlzeiten als aktive Gerichte markiert werden können.
- Die Logik ist bewusst als zusätzlicher Auswahlzustand innerhalb derselben Woche dokumentiert, nicht als zweiter Wochenplan.
- `Offene Fragen und Prüfbedarf.md` hält als verbleibenden Produktentscheid fest, welche Standardsicht die Einkaufsliste bei leerer aktiver Auswahl priorisieren soll.

## [2026-04-23] wissensbasis | Konkretes Fachmodell für aktive Gerichte und Einkaufslistenmodus ergänzt
- Eine neue Konzeptseite `02 Wissen/Begriffe und Konzepte/Aktive Gerichte und selektive Einkaufsliste.md` bündelt jetzt Zustandsmodell, UI-Verhalten, Persistenzregeln und Reset-Verhalten.
- Das Modell trennt ausdrücklich zwischen vollständigem Basis-Wochenplan, aktiver Mahlzeitenauswahl und Sichtmodus der Einkaufsliste.
- Als bevorzugter Produktmodus ist dokumentiert:
  Einkaufsliste standardmäßig auf `aktive Gerichte`, bei leerer Auswahl mit explizitem Leerzustand.
- Der Index wurde um die neue Konzeptseite ergänzt, damit die spätere Implementierung wiki-first auf diese Spezifikation aufbauen kann.

## [2026-04-23] wissensbasis | Zielmix vegetarisch Fisch Fleisch als neue Planungsanforderung eingeordnet
- Die neue Chat-Anforderung zu einem gekoppelten Dreiregler für `vegetarisch`, `Fisch` und `Fleisch` wurde als Rohquelle erfasst.
- `Produktbild und Kernlogik.md` beschreibt den Zielmix jetzt als geplante Erweiterung der Planungslogik.
- `Offene Fragen und Prüfbedarf.md` hält fest, dass der Mix wegen unausgewogenem Rezeptpool voraussichtlich als weiches Ziel und eher für Mittag- und Abendessen statt für alle Mahlzeiten modelliert werden sollte.
- Die bestehende Überlappung mit `Vegetarisch` und `Fleisch reduzieren` ist als bewusster Prüfpunkt dokumentiert.

## [2026-04-23] bugfix | Geschützte Seiten nach Nutzerkonzept wieder erreichbar
- Nach dem Nutzerkonzept kam es auf geschützten Seiten wie Dashboard, Einstellungen, Rezepten und Einkaufsliste lokal zu `500`-Fehlern mit `SqliteError: no such column: id`.
- Ursache war ein unvollständig abgesicherter Migrationspfad rund um die neue `users`-Tabelle: Für `user_settings` und Planungsdaten existierten bereits Schema-Migrationen, für ältere `users`-Strukturen und deren abhängige Tabellen aber noch kein gleichwertiger Fallback.
- `src/lib/db.ts` enthält jetzt eine zusätzliche Selbstheilungs-Migration für ältere `users`-Schemas ohne `id`, inklusive Neuaufbau und Rückübernahme der direkt abhängigen Tabellen `sessions`, `user_settings`, `weekly_plans`, `daily_plans` und `meals`.
- Nach frischem Build und Neustart antworteten geschützte Routen lokal wieder korrekt; ohne Session liefern `/` und `/einstellungen` jetzt wieder reguläre Redirects zur Anmeldung statt `500`.
- Verifikation:
  `npm run lint` erfolgreich, `npm run build` erfolgreich, lokaler Serverstart erfolgreich, HTTP-Checks für geschützte Routen ohne SQL-Fehler.

## [2026-04-23] umsetzung | Dashboard zeigt letzten Generierungszeitpunkt des Wochenplans
- Der gespeicherte Wochenplan trägt jetzt einen eigenen Zeitstempel `generatedAt`, der aus `weekly_plans.created_at` hydratisiert wird und den tatsächlichen Zeitpunkt der letzten Generierung repräsentiert.
- Das Dashboard zeigt diesen Zeitpunkt sichtbar als `Zuletzt neu generiert`, getrennt vom bisherigen Offline-Speicherzeitpunkt, damit beide Bedeutungen nicht vermischt werden.
- Beim Nachziehen des Build-Checks wurde zusätzlich ein vorhandener Typfehler in der Einkaufsliste bereinigt: die userbezogenen Storage-Keys für Wochenauswahl und Einkaufs-Häkchen werden jetzt wieder mit dem erforderlichen `storageNamespace` erzeugt.
- Verifikation:
  `npm run lint` erfolgreich, `npm run build` erfolgreich.

## [2026-04-23] betrieb | Lokale Browser-Vorschau wieder auf next start zurückgestellt
- Der zuvor getestete Standalone-Start über `node .next/standalone/server.js` lieferte im lokalen Vorschau-Setup HTML aus, aber keine CSS-Assets unter `/_next/static/...`; die Oberfläche erschien dadurch als ungestylte Textansicht.
- Für die lokale Browser-Vorschau wurde der Start deshalb wieder auf `next start` zurückgestellt; ergänzend gibt es jetzt ein separates Skript `start:standalone` für gezielte Standalone-Tests.
- Der reguläre lokale Produktionsserver rendert die Einstellungsseite weiterhin vollständig und lieferte die referenzierte CSS-Datei beim Prüflauf mit Status `200` aus.
- Verifikation:
  `http://localhost:3000/einstellungen` erfolgreich geladen, referenzierte CSS-Datei unter `/_next/static/...css` erfolgreich mit Status `200` geladen.

## [2026-04-23] betrieb | Lokalen Browser-Test auf Standalone-Server umgestellt
- Für den lokalen Prüfstand wurde der Start von `next start` auf `node .next/standalone/server.js` umgestellt, weil das Projekt mit `output: standalone` läuft und der bisherige Startmodus dazu eine direkte Warnung ausgab.
- Der Dev-Start bleibt weiterhin auf `next dev --webpack`, damit der frühere Turbopack-Fehler mit `better-sqlite3` im Windows-OneDrive-Setup für die lokale Entwicklung umgangen wird.
- Nach frischem `npm run build` lieferte der Standalone-Server `http://localhost:3000/` und `http://localhost:3000/einstellungen` lokal wieder mit Status `200` aus.
- Verifikation:
  `npm run lint` erfolgreich, `npm run build` erfolgreich, Standalone-Server lokal gestartet und per HTTP geprüft.

## [2026-04-23] umsetzung | Aktive Gerichte und selektive Einkaufsliste im Workspace umgesetzt
- Das Dashboard erlaubt jetzt das Aktivieren und Deaktivieren einzelner geplanter Mahlzeiten sowie Schnellaktionen pro Tag und für die ganze Woche.
- Die aktive Auswahl wird lokal pro Woche gespeichert und bei geänderter Wochenstruktur bewusst zurückgesetzt.
- Die Einkaufsliste unterstützt jetzt die Modi `aktive Gerichte` und `alle geplanten Gerichte`; bei leerer Auswahl zeigt der Fokusmodus einen expliziten Leerzustand.
- Der Abhakstatus der Einkaufsliste wird nicht mehr nur an die Woche, sondern an Woche plus Listenkontext gebunden.
- Verifikation:
  `npm run lint` erfolgreich, `npm run build` erfolgreich, Turbopack-NFT-Warnung bleibt als nicht blockierender Restpunkt bestehen.

## [2026-04-23] umsetzung | Zielmix vegetarisch Fisch Fleisch im Workspace umgesetzt
- Die bisherigen Schalter `Vegetarisch` und `Fleisch reduzieren` wurden im Einstellungsformular durch einen gekoppelten Dreiregler für `vegetarisch`, `Fisch` und `Fleisch` ersetzt.
- Der Regler speichert drei Prozentwerte, die zusammen immer `100 %` ergeben; bestehende SQLite-Datenbanken werden beim Start automatisch um die neuen Spalten migriert.
- Die Planungsheuristik nutzt den Mix jetzt als weiches Ziel für Mittagessen und Abendessen, während Frühstück und Snack wegen des Rezeptpools fachlich außen vor bleiben.
- Dashboard und Einstellungsseite zeigen den aktiven Mix im Planungsprofil sichtbar an; zusätzlich blendet die Einstellungsseite die aktuelle Verfügbarkeit passender Mittags- und Abendgerichte ein.
- Verifikation:
  `npm run lint` erfolgreich, `npm run build` erfolgreich.

## [2026-04-23] umsetzung | Turbopack-Dateitracing für SQLite-Pfad bereinigt
- Der SQLite-Pfad in `src/lib/db.ts` wurde enger auf die konkrete Datei `data/planner.sqlite` zugeschnitten, statt den Datenordner breit dynamisch zu modellieren.
- Dynamische Laufzeitpfade über `DATA_DIR` oder `RAILWAY_VOLUME_MOUNT_PATH` bleiben möglich, sind aber gezielter vom Defaultpfad getrennt.
- Nach dem Pfadzuschnitt trat die frühere Turbopack-Warnung zur unerwartet breiten NFT-Dateinachverfolgung im `next build` nicht mehr auf.
- Während der Verifikation zeigte sich zusätzlich ein separater Build-Blocker durch einen laufenden lokalen Prozess auf `.next/standalone/server.js`; nach dem Stoppen dieses Prozesses lief der Build wieder sauber durch.
- Verifikation:
  `npm run lint` erfolgreich, `npm run build` erfolgreich, keine Turbopack-NFT-Warnung mehr in der Build-Ausgabe.

## [2026-04-23] umsetzung | Rezeptpool aus externen glutenfreien Quellen erweitert
- Acht neue glutenfreie Rezepte aus dokumentierten BBC-Good-Food-Quellen wurden als kuratierte Seed-Datensätze angelegt.
- Die neuen Rezepte liegen separat in `src/lib/data/imported-recipes.ts`; `src/lib/data/seed-recipes.ts` bündelt sie mit dem bisherigen Demo-Bestand.
- `src/lib/db.ts` seeded jetzt den zusammengeführten Bestand, sodass neue Rezept-IDs beim Start auch in bestehende SQLite-Datenbanken eingefügt werden.
- Der lokale Datenbankstand `data/planner.sqlite` wurde zusätzlich direkt synchronisiert und enthält jetzt 50 Rezepte:
  12 Frühstücke, 14 Mittagessen, 14 Abendessen und 10 Snacks.
- Verifikation:
  `npm run lint` erfolgreich, `npm run build` erfolgreich.

## [2026-04-23] umsetzung | Rezeptpool um weitere 20 Web-Rezepte erweitert
- Der bestehende Import aus BBC-Good-Food-Quellen wurde am selben Tag um weitere 20 glutenfreie Gerichte ergänzt.
- `src/lib/data/imported-recipes.ts` enthält damit jetzt insgesamt 28 kuratierte Web-Rezepte; der gesamte Seed-Bestand umfasst 70 Rezepte.
- Die zusätzlichen Datensätze erweitern alle Mahlzeitentypen und verteilen sich im aktuellen lokalen SQLite-Stand auf 17 Frühstücke, 19 Mittagessen, 20 Abendessen und 14 Snacks.
- `data/planner.sqlite` wurde erneut direkt synchronisiert, damit der lokale Datenstand sofort zum Seed-Code passt und beim nächsten Railway-Deploy konsistent ausgerollt werden kann.
- Verifikation:
  `npm run lint` erfolgreich, `npm run build` erfolgreich.

## [2026-04-23] umsetzung | Regenerieren-Buttons geben jetzt sichtbares Feedback
- Die Server Action für `Woche neu generieren` liefert jetzt ein explizites Erfolgs- oder Fehlersignal zurück und stößt zusätzlich ein `refresh()` für den aktuellen Screen an.
- Dashboard und Einstellungsseite nutzen dafür jetzt eine gemeinsame Client-Komponente mit Pending-Zustand und sichtbarer Rückmeldung nach Abschluss.
- Bei der Reparatur wurde zusätzlich als technische Leitplanke verifiziert:
  In `"use server"`-Dateien dürfen in Next.js 16 nur `async`-Funktionen exportiert werden; Initialzustände für `useActionState` müssen außerhalb solcher Dateien liegen.
- Verifikation:
  `npm run lint` erfolgreich, `npm run build` erfolgreich, Regenerierungs-POST gegen den lokalen Dev-Server auf `http://localhost:3001/` erzeugt einen neuen Wochenplan in `data/planner.sqlite`.

## [2026-04-23] umsetzung | Passwortlose Anmeldung und nutzerscharfer Datenzugriff im Workspace umgesetzt
- Eine öffentliche Login-Seite unter `/anmelden` sowie ein Logout-Pfad unter `/abmelden` wurden ergänzt.
- Die Anmeldung läuft jetzt passwortlos über einen einmaligen E-Mail-Code mit `auth_challenges`, verifizierten `users` und gerätespezifischen `sessions`.
- `src/lib/auth.ts` bündelt Session-Cookie, Code-Verifikation, Nutzerermittlung und Redirect-Logik; produktnahe Seiten und Server Actions prüfen den Nutzer jetzt serverseitig.
- `user_settings`, `weekly_plans` und `daily_plans` wurden auf echte Nutzertrennung migriert; vorhandene lokale Single-User-Daten werden dabei in einen Legacy-Bestand überführt statt stillschweigend verworfen.
- Dashboard, Rezeptbereich, Tagesseiten, Einkaufsliste und Einstellungen laden jetzt nur noch die Daten des angemeldeten Nutzers.
- Offline-Snapshots, aktive Gerichte und Einkaufs-Häkchen verwenden jetzt einen nutzerbezogenen Storage-Namespace; der Logout räumt diese lokalen Gerätedaten auf.
- Die Scheduler-Route erzeugt Wochenpläne nicht länger global, sondern für alle verifizierten Nutzerkonten.
- Für den Entwicklungsmodus ohne Mail-Konfiguration wird der Testcode sichtbar eingeblendet; für Production bleibt echter E-Mail-Versand als Betriebsaufgabe offen.
- Verifikation:
  `npm run lint` erfolgreich, `npm run build` erfolgreich.

## [2026-04-23] umsetzung | Login-Formular für Next-16-Server-Actions stabilisiert
- Der Anmeldefluss `Code anfordern` lief zunächst auf einen Laufzeitfehler, weil Initialzustände für `useActionState` noch direkt aus einer `"use server"`-Datei exportiert wurden.
- Die Formularzustände für Login und Code-Bestätigung liegen jetzt in einer separaten Shared-Datei `src/app/auth-form-state.ts`, während `src/app/auth-actions.ts` nur noch die eigentlichen Server Actions exportiert.
- Damit folgt der Login derselben technischen Leitplanke, die bereits zuvor beim Regenerieren-Flow dokumentiert wurde:
  In Next.js 16 sollen für `useActionState` keine nicht-async Exporte aus `"use server"`-Dateien als Client-Importquelle verwendet werden.
- Verifikation:
  `npm run lint` erfolgreich, `npm run build` erfolgreich.

## [2026-04-23] wissensbasis | Lokale Mobile-Variante gegenüber gehostetem Betrieb eingeordnet
- Die Architekturfrage `rein lokal auf dem Handy` versus `gehostete Web-/PWA-App` wurde als eigene Wissensseite dokumentiert.
- Die neue Seite hält fest:
  Eine lokale Single-Device-Variante ist möglich, würde aber einen bewussten Wechsel des Produktmodells bedeuten und nicht nur das Abschalten von Login und Railway.
- Zusätzlich ist festgehalten:
  Eine Serverabfrage für neue Rezepte erfordert nicht automatisch Benutzerkonten; sie kann auch als öffentlicher Feed ohne Login gedacht werden.
- Der Index verweist jetzt direkt auf diese Abwägung.

## [2026-04-23] wissensbasis | Railway-Preislage für Architekturabwägung nachgezogen
- Offizielle Railway-Quellen zu Pricing, Plans und Free Trial wurden als Rohquellen-Referenz ergänzt.
- Für die Architekturabwägung ist jetzt festgehalten:
  Nach dem 30-Tage-Trial endet nicht jede kostenlose Nutzung sofort, weil Railway aktuell auf einen Free-Plan mit 1 USD freien Ressourcen pro Monat zurückfällt.
- Gleichzeitig wurde als betriebliche Grenze ergänzt:
  Für eine dauerhaft laufende App ist dieses Restbudget klein, und Cron-Jobs sind laut aktueller Preisseite im Free-Bereich nur während des Trials verfügbar.

## [2026-04-23] wissensbasis | Vergleichsmatrix für lokale Mobile-App und gehosteten Betrieb ergänzt
- Die bestehende Architektur-Abwägungsseite wurde um eine Vergleichsmatrix erweitert.
- Die Matrix stellt die beiden Richtungen entlang von Betriebskosten, Offline-Nutzung, Mehrgerätefähigkeit, Datenschutzgefühl, Rezeptnachschub, technischer Passung und Betriebsaufwand gegenüber.
- Zusätzlich wurden verdichtete Vor- und Nachteile beider Richtungen ergänzt, damit spätere Produktentscheidungen schneller anschlussfähig bleiben.

## [2026-04-23] wissensbasis | Mobile Installations- und Updatewege für Einzelanwender ergänzt
- Offizielle Quellen zu iPhone-Web-Apps, TestFlight, iOS-Distributionsmethoden, Google-Play-Testing, Android-Installationen aus anderen Quellen sowie GitHub Pages und Releases wurden als Rohquellen-Referenz ergänzt.
- Die Architektur-Abwägungsseite beschreibt jetzt zusätzlich drei praktische Auslieferungsmodelle:
  lokale PWA mit statischem Hosting, echte Mobile-App-Hülle und voll manuelle Einzelverteilung.
- Als projektnaher Zwischenstand ist festgehalten:
  Ein GitHub-basierter Updateweg passt gut zu einer lokalen PWA, während für iOS-App-Pakete TestFlight deutlich realistischer als ein direkter GitHub-Download ist.

## [2026-04-23] wissensbasis | PWA-Persistenz und lokale Migrationen für Einzelanwender ergänzt
- Offizielle Quellen zu IndexedDB, Storage-Persistenz, PWA-Updates, Origin-Grenzen und WebKit-Storage-Policy wurden als Rohquellen-Referenz ergänzt.
- Die Architektur-Abwägungsseite hält jetzt fest:
  Lokale PWA-Daten wie Einstellungen und Historie können über neue Versionen hinweg erhalten bleiben, wenn dieselbe Origin bestehen bleibt und die lokale Datenbank sauber migriert wird.
- Zusätzlich ist dokumentiert:
  Service-Worker- und Asset-Updates löschen IndexedDB nicht automatisch, aber Browserdaten bleiben trotzdem nur best-effort, solange keine persistente Speicherung gewährt und kein manuelles Löschen erfolgt.

## [2026-04-23] wissensbasis | Echter App-Store-Weg als zusätzliche Distributionsoption ergänzt
- Die bestehende Rohquellen-Referenz zu mobilen Distributionswegen wurde um Apple-Quellen zu Developer-Program, App Store Connect, unlisted Apps und Submission-Prozess ergänzt.
- Die Architektur-Abwägungsseite beschreibt jetzt zusätzlich den Weg über eine echte Store-App.
- Für `Plan und Pfanne` ist dabei festgehalten:
  Ein offizieller iPhone-Installations- und Updateweg ist möglich, aber für nur einen Anwender deutlich aufwendiger als PWA oder TestFlight.
- Als praktikable Mittelposition ist zusätzlich dokumentiert:
  `unlisted App Store` kann offizielle Installation und Updates bieten, ohne normale Auffindbarkeit im App Store.

## [2026-04-23] wissensbasis | Detaillierter Umstiegspfad auf lokale PWA ergänzt
- Eine neue Prozessseite beschreibt den Migrationspfad von der aktuellen serverzentrierten Next.js-App zu einer lokalen PWA.
- Die Seite trennt jetzt ausdrücklich zwischen
  stabiler App-Origin für Installation, Speicher und Updates
  und optional konfigurierbaren Feed- oder Import-URLs für Rezeptnachschub.
- Zusätzlich ist festgehalten:
  Der eigentliche Migrationskern liegt nicht im Hostingwechsel, sondern in der Verlagerung von Fachlogik, Persistenz, Migrationen und Releasefluss auf das Gerät.

## [2026-04-23] wissensbasis | GitHub-Origin als früher PWA-Zielpunkt eingeordnet
- Der Umstiegspfad beschreibt jetzt ausdrücklich, dass eine GitHub-basierte Origin für die PWA früh festgelegt werden kann, solange noch keine realen Installationen oder schützenswerten lokalen Bestände migriert werden müssen.
- Zusätzlich ist dokumentiert:
  Eine `github.io`-Adresse ist für den Start plausibel, eine eigene Domain auf GitHub Pages aber langfristig die robustere Variante.
- Für die technische Umsetzung ist festgehalten:
  Ein Unterpfad-Modell wie `/<repo>/` erhöht die Komplexität bei `start_url`, `scope`, Asset- und Service-Worker-Pfaden.

## [2026-04-23] umsetzung | Lokale PWA auf statischen Export und GitHub Pages umgestellt
- Der primäre App-Pfad wurde von serverzentrierter Railway-/Login-Architektur auf eine lokale PWA mit statischem Export umgestellt.
- `src/lib/local-db.ts` und `src/lib/local-store.ts` bilden jetzt die neue IndexedDB-basierte Persistenz für Einstellungen, Seed-Rezepte, Wochenpläne, Historie und App-Metadaten.
- Dashboard, Einstellungen, Rezeptbibliothek, Tagesansicht und Einkaufsliste lesen und schreiben jetzt lokal statt über Server Actions oder serverseitigen SQLite-Store.
- Die früheren dynamischen Detailpfade `/rezepte/[id]` und `/tage/[date]` wurden für GitHub Pages in querybasierte statische Ansichten überführt:
  `/rezepte?recipe=<id>` und `/tage?date=YYYY-MM-DD`.
- `next.config.ts`, Manifest, Service Worker, PWA-Registrierung und ein neuer Pages-Workflow sind auf GitHub Pages mit Unterpfad-Zuschnitt vorbereitet.
- Login-, Logout-, Auth- und Scheduler-Pfade sind im aktuellen Stand nur noch Legacy-Hinweise oder statische Platzhalter und nicht mehr Kern des Produktflusses.
- Verifikation:
  `npm run lint` erfolgreich,
  `npm run build` erfolgreich,
  `npm run build` mit `NEXT_PUBLIC_BASE_PATH=/plan-und-pfanne` und `NEXT_PUBLIC_SITE_URL=https://levelx2.github.io/plan-und-pfanne` erfolgreich.
