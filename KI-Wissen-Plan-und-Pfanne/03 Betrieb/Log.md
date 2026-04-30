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

## [2026-04-23] bugfix | Einkaufsliste behält gesetzte Häkchen jetzt nach dem Tippen
- Der Klick auf Zutaten in `src/app/einkaufsliste/shopping-list-client.tsx` wurde zuvor direkt wieder neutralisiert, weil die Rehydratisierung der Abhakzustände an einem pro Render neu erzeugten Array hing und dadurch nach jedem lokalen State-Update erneut anlief.
- Die Abhängigkeit der Rehydratisierung nutzt jetzt eine stabile String-Signatur der aktuellen Listen-IDs statt der flüchtigen Array-Referenz; dadurch bleiben Häkchen beim Abhaken erhalten und werden nur noch bei echten Listenänderungen neu geladen.
- Die generische Leitplanke für lokal rehydrierte UI-Zustände wurde zusätzlich in `03 Betrieb/Generische Entwicklungsvorgaben.md` festgehalten, damit ähnliche IndexedDB- oder Snapshot-Workflows denselben Fehler nicht wiederholen.

## [2026-04-23] wissensbasis | Finito-Sequenz als neue Abschlussregel dokumentiert
- Die neue Chat-Anforderung zur Finito-Sequenz wurde als Rohquelle unter `01 Rohquellen/2026-04-23 Finito-Sequenz fuer Thread-Abschluss.md` erfasst.
- `AGENTS.md` ersetzt die bisherigen Abschluss-Kommandos jetzt durch die neue Finito-Sequenz mit den Triggern `Finito` und `Ende`.
- Die Prozessseite `02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md` beschreibt den Thread-Abschluss jetzt ebenfalls als eigenen wiederkehrenden Fall.
- Die Regel hält ausdrücklich fest, dass Commit-Blöcke sinnvoll getrennt werden, Wissenspflege zum Abschluss gehört und fremde offene Änderungen den Thread-Abschluss nicht automatisch blockieren.

## [2026-04-23] umsetzung | Rezeptbibliothek auf zweistufige Einklapp-Navigation umgestellt
- Die bisher vollständig aufgeklappte Rezeptliste wurde auf eine hierarchische Bibliotheksansicht umgestellt.
- In `src/app/rezepte/recipes-client.tsx` starten jetzt alle Mahlzeiten-Gruppen standardmäßig eingeklappt; innerhalb geöffneter Gruppen zeigen Rezepte zunächst nur kompakte Kopfzeilen.
- Pro Rezept werden im geschlossenen Zustand jetzt Name, Klassifizierung, Vorbereitungszeit und Zutatenanzahl gezeigt; Zutaten und Zubereitung öffnen sich erst nach einem zusätzlichen Klick und können wieder geschlossen werden.
- Die querybasierte Detailverlinkung über `/rezepte?recipe=<id>` bleibt dabei erhalten und öffnet weiterhin das passende Rezept innerhalb seiner Mahlzeiten-Gruppe.
- Verifikation:
  `npm run lint` erfolgreich,
  `npm run build` erfolgreich.

## [2026-04-23] betrieb | Lokaler Next-Dev-Server nach inkonsistentem `.next`-Ordner repariert
- Im lokalen Vorschau-Setup lief die App kurzzeitig auf `500`, obwohl die Rezeptseite selbst nicht der Auslöser war.
- Sichtbar waren `ENOENT`-Fehler zu fehlenden Dateien unter `.next/dev`, insbesondere `routes-manifest.json`, `server/app/rezepte/page.js` und mehrere `webpack/*.pack.gz`.
- Die Reparatur bestand darin, den generierten Ordner `.next` vollständig zu löschen und `npm run dev` im Projekt neu zu starten.
- Danach antworteten die zuvor betroffenen Routen `/rezepte/` und `/tage/?date=2026-04-20` wieder mit Status `200`.
- Die lokale Prozessseite hält jetzt zusätzlich fest, dass `npm run dev` und `npm run build` nicht parallel denselben `.next`-Ordner verwenden sollten.

## [2026-04-23] bugfix | Tagesstatus trennt leere Auswahl von teilaktiven Tagen
- In `src/app/home-client.tsx` unterscheidet der Tagesstatus im Dashboard jetzt drei Fälle:
  `noch nicht aktiv`, `teilweise aktiv` und `aktiv geplant`.
- Damit zeigt ein Tag ohne ausgewählte Mahlzeit nicht länger fälschlich `teilweise aktiv`, obwohl der Initialzustand der aktiven Auswahl bewusst leer ist.
- Die fachliche UI-Regel wurde zusätzlich in `02 Wissen/Begriffe und Konzepte/Aktive Gerichte und selektive Einkaufsliste.md` ergänzt.
- Verifikation:
  `npm run lint` erfolgreich,
  `npm run build` erfolgreich.

## [2026-04-23] umsetzung | Dashboard-Tageskarten für aktive Gerichte verdichtet
- In `src/app/home-client.tsx` stehen Statuslabel und Aktiv-Zähler eines Tages jetzt gemeinsam im Kopf der Tageskarte; die doppelte Zähleranzeige neben `Tag auswählen` und `Tag abwählen` entfällt.
- Die Statusberechnung klemmt ausgewählte Mahlzeiten zusätzlich auf den realen Tagesumfang; bei `0` aktiven Mahlzeiten erscheint jetzt nur noch ein neutraler Zähler statt eines farbigen Aktiv-Statuslabels.
- `src/lib/week-plan-selection.ts` normalisiert lokal gespeicherte `selectedMealKeys` jetzt zusätzlich eindeutig, damit doppelte Altwerte weder Zähler noch Layout unnötig aufblähen.
- `src/app/page.module.css` rendert die Tagessummen `Kalorien`, `Protein`, `Kohlenhydrate` und `Fett` jetzt kompakter über ein responsives Auto-Fit-Grid, sodass auf schmaleren Karten mindestens zwei Werte pro Zeile Platz behalten und auf breiteren Karten mehr nebeneinander möglich sind.
- Die Auswahlleiste nutzt für `Alle auswählen`, `Alle abwählen` und `Einkaufsliste öffnen` jetzt denselben Pillenstil; zusätzlich startet der linke Einführungsblock im Dashboard eingeklappt und zeigt zunächst nur noch den App-Namen.
- Verifikation:
  `npm run lint` erfolgreich,
  `npm run build` erfolgreich,
  `http://localhost:3000/` lokal erfolgreich mit Status `200` geprüft.

## [2026-04-23] bugfix | Dev-Service-Worker auf localhost erzeugte falschen Serverfehler
- Auf `http://localhost:3000/` erschien zeitweise ein Browserfehler mit `Hydration failed`, obwohl der Dev-Server selbst weiter `200` auf die Startseite lieferte.
- Ursache war kein echter Serverabsturz, sondern ein in der Entwicklung aktiver Service Worker, der veraltete Next-Bundles aus dem Offline-Cache gegen frisches HTML laufen ließ.
- `src/app/layout.tsx` injiziert im Dev-Modus auf `localhost` jetzt einen frühen Reset, der alte Service-Worker-Registrierungen und `plan-und-pfanne-offline*`-Caches einmalig entfernt und die Seite danach neu lädt.
- `src/app/pwa-register.tsx` registriert den Service Worker im Entwicklungsmodus nicht mehr neu und räumt bestehende Registrierungen/Caches stattdessen ebenfalls auf.
- Die Prozessseite `02 Wissen/Prozesse/Lokaler Start von Entwicklung und Test.md` dokumentiert diesen lokalen Fehlerfall jetzt zusätzlich.
- Verifikation:
  `npm run lint` erfolgreich,
  `http://localhost:3000/` erfolgreich mit Status `200`,
  ausgeliefertes HTML enthält das Dev-Reset-Skript.

## [2026-04-23] umsetzung | Hero-Einführung und Einkaufslistenmodus mobil lesbarer gemacht
- Auf der Startseite zeigt der eingeklappte Hero jetzt nur noch den App-Namen `Plan und Pfanne`; das kleine Zusatzlabel darüber entfällt.
- Die aufgeklappte Einführung in `src/app/home-client.tsx` beschreibt die Rolle der App jetzt deutlich ausführlicher:
  lokale Speicherung, aktive Gerichte, Wochenüberblick, Rezeptsuche und der Unterschied zwischen fokussierter und kompletter Einkaufsliste.
- In `src/app/einkaufsliste/shopping-list-client.tsx` ist die Statuszeile `x von y Gerichten aktiv` jetzt als eigener, stärker gewichteter Textblock modelliert.
- `src/app/einkaufsliste/shopping.module.css` gibt dem Listenmodus-Panel mehr Breite, lässt es auf kleineren Ansichten sauber auf volle Spaltenbreite wachsen und spannt den Button `Häkchen zurücksetzen` kontrolliert über die ganze Toolbar-Zeile.
- Verifikation:
  `npm run lint` erfolgreich,
  `http://localhost:3000/` erfolgreich mit Status `200`,
  `http://localhost:3000/einkaufsliste/` erfolgreich mit Status `200`.

## [2026-04-23] umsetzung | Hero-Titel mit App-Icon und ruhigerem Infotext verfeinert
- Der Titelblock im Dashboard-Hero zeigt jetzt das echte App-Icon aus `public/icon-192.png` direkt vor `Plan und Pfanne`.
- Der bisher technische Buttontext `Einführung anzeigen` wurde in `src/app/home-client.tsx` durch `Mehr zur App` ersetzt; der geöffnete Zustand schließt jetzt mit `Weniger anzeigen`.
- `src/app/page.module.css` ergänzt dafür eine eigene Titelzeile mit Icon-Abstand und leichter Schattenkante, ohne die kompakte eingeklappte Hero-Höhe unnötig aufzublähen.
- Verifikation:
  `npm run lint` erfolgreich,
  `http://localhost:3000/` erfolgreich mit Status `200`.

## [2026-04-23] betrieb | Pages-Workflow auf neuere Actions-Majors gegen Node-20-Warnungen angehoben
- Der GitHub-Pages-Workflow `/.github/workflows/deploy-pages.yml` nutzte zuvor `actions/configure-pages@v5`, `actions/setup-node@v4` und `actions/upload-pages-artifact@v4`.
- GitHub zeigte dafür bereits Warnungen zur bevorstehenden Node-20-Ablösung auf den Runnern an.
- Der Workflow verwendet jetzt die neueren offiziellen Major-Tags `actions/configure-pages@v6`, `actions/setup-node@v6` und `actions/upload-pages-artifact@v5`.
- Die Build-Node für das Projekt bleibt dabei bewusst vorerst auf `20`, damit das Update der Workflow-Action-Runtimes nicht unnötig mit einer separaten App-Node-Umstellung vermischt wird.

## [2026-04-23] umsetzung | Sidebar-Karte zum lokalen Betrieb fachlich präzisiert
- Die frühere Dashboard-Karte `Unterwegs nutzbar` suggerierte noch einen Teilumfang lokaler Funktionen, obwohl der aktuelle Stand der App vollständig lokal auf dem Gerät arbeitet.
- `src/app/home-client.tsx` beschreibt diese Karte jetzt als `Lokal auf dem Gerät` mit dem Fokus auf bereits komplett lokal laufende Funktionen:
  Wochenplan, aktive Gerichte, Planungsprofil, Einkaufshäkchen und Rezeptbibliothek.
- Der einzige bewusst nach vorne gerichtete Punkt bleibt jetzt als Ausblick formuliert:
  zusätzliche Rezepte später per Import oder weitere Quelle ergänzen.

## [2026-04-23] umsetzung | Hero-Branding und Hauptnavigation auf Mobilgeräten verbessert
- Der Dashboard-Hero verbindet App-Icon und Namen jetzt nicht mehr nur technisch nebeneinander, sondern als gestaltetes Brand-Lockup mit Badge, Akzentlinie und zusammenhängendem Wordmark.
- `src/app/page.module.css` modelliert dafür eine dekorative Titelkapsel; `src/app/home-client.tsx` rendert Icon und Namen jetzt als zusammenhängende Markenfläche.
- Die lokale Hauptnavigation auf dem Dashboard und in den Einstellungen ist jetzt sticky, horizontal scrollbar und bricht auf schmalen iPhone-Breiten nicht mehr unschön ab.
- Die gemeinsame `AppNav` für Rezeptbibliothek, Einkaufsliste und weitere Ansichten nutzt jetzt ebenfalls eine sticky Chip-Leiste mit horizontalem Scrollen; auf kleinen Geräten wird die untergeordnete Account-Meta zugunsten der Tab-Bedienung ausgeblendet.

## [2026-04-23] umsetzung | Hero-Wortmarke näher an der Bildreferenz ausgerichtet
- Der Titelbereich im Dashboard orientiert sich jetzt stärker an der gelieferten Bildreferenz:
  helle Markenplakette, dunkle Hauptwörter `Plan` und `Pfanne`, orange hervorgehobenes `und` sowie die kleine Bogen-Punkt-Signatur darunter.
- `src/app/home-client.tsx` rendert die Wortmarke dafür jetzt in getrennten Textsegmenten statt als durchgehenden String.
- `src/app/page.module.css` ersetzt die frühere lineare Akzentfläche durch eine ruhigere, ikonähnliche Markenplatte mit typografischem Fokus.

## [2026-04-23] umsetzung | Neuer App-Icon-Satz aus aktualisierter Bildvorlage übernommen
- Die neue vom Nutzer gelieferte Icon-Vorlage ersetzt jetzt den bisherigen App-Icon-Satz.
- Aktualisiert wurden `src/app/icon.png`, `src/app/apple-icon.png`, `src/app/favicon.ico`, `public/icon-192.png` und `public/icon-512.png`.
- Dadurch zeigen Browser-Tab, Installationsdialog, Apple-Icon, Manifest-Icons und der Hero wieder konsistent dieselbe aktuelle Markenillustration.

## [2026-04-23] umsetzung | Produktsprache auf ein einziges App-Modell bereinigt
- Produktnahe Texte auf Dashboard, Einstellungen, Rezeptbibliothek, Tagesansicht und Einkaufsliste sprechen jetzt konsistent von `der App` statt von einem vermeintlichen lokalen Modus.
- `src/app/app-nav.tsx` wurde auf reine Produktnavigation ohne pseudo-kontobezogene Meta-Anzeige reduziert.
- Die Pfade `/anmelden`, `/abmelden`, Auth-Hinweise und statischen API-Platzhalter wurden sprachlich neutralisiert:
  Sie bleiben aus Kompatibilitätsgründen erreichbar, erklären aber keine laufende Migration mehr.
- `README.md`, `Projektueberblick.md`, `MVP-Leitentscheidungen.md`, `Produktbild und Kernlogik.md`, `Aktive Gerichte und selektive Einkaufsliste.md`, `Index.md` und die Prozessseite `Umstiegspfad auf lokale PWA.md` wurden auf den aktuellen Einzel-App-Zuschnitt nachgezogen.
- Die Prozessseite `Umstiegspfad auf lokale PWA.md` ist jetzt ausdrücklich als historische Migrationsdokumentation eingeordnet und nicht mehr als aktueller Produktzieltext formuliert.

## [2026-04-23] umsetzung | Hero zeigt jetzt nur noch das vollständige Markenicon
- Der Dashboard-Hero rendert die Marke nicht mehr aus Icon, Einzelschriftzug und dekorativen Linien nachgebaut.
- Stattdessen zeigt `src/app/home-client.tsx` jetzt nur noch das vollständige neue Markenicon selbst.
- `src/app/page.module.css` reduziert den Titelbereich dafür auf eine reine Icon-Fläche mit Schatten; der Markenname bleibt nur noch unsichtbar für die Semantik erhalten.

## [2026-04-23] umsetzung | Dashboard-Hero auf eigenes High-Res-Markenasset umgestellt
- Für den Dashboard-Hero wird die Marke nicht mehr aus dem kleinen `192px`-PWA-Icon hochskaliert.
- Stattdessen liegt mit `public/brand-mark-dashboard.png` jetzt ein eigenes hochauflösendes Markenasset im Projekt, das direkt im Hero gerendert wird.
- `src/app/home-client.tsx` nutzt dafür jetzt diesen separaten Pfad; `src/app/page.module.css` zeigt die Marke im eingeklappten Hero bewusst etwas größer.
- Der restliche App-Icon-Satz (`src/app/icon.png`, `src/app/apple-icon.png`, `src/app/favicon.ico`, `public/icon-192.png`, `public/icon-512.png`) wurde aus derselben neuen Vorlage mit aktualisiert.

## [2026-04-24] umsetzung | Zielmix-Regler verankert und Tageskarten optisch klarer getrennt
- `src/app/einstellungen/settings-form.tsx` behandelt `Vegetarisch` jetzt als führenden Anteil im Zielmix:
  Änderungen an `Fisch` oder `Fleisch` lassen den ersten Regler unangetastet und verteilen nur noch den verbleibenden Rest.
- Der Hinweistex im Einstellungsformular erklärt diese Führungslogik jetzt direkt an der Zielmix-Karte.
- `src/app/page.module.css` trennt auf dem Dashboard Anzeige und Aktion deutlicher:
  Status- und Summenfelder wirken flacher und sachlicher, während Tag-Aktionen, Auswahlknöpfe und Aktiv-Toggles wieder sichtbar als klickbare Elemente auftreten.
- Verifikation:
  `npm run lint` erfolgreich,
  `http://localhost:3000/` erfolgreich mit Status `200`,
  `http://localhost:3000/einstellungen/` erfolgreich mit Status `200`.

## [2026-04-24] umsetzung | App auf datumsbezogenes Tageskonzept umgestellt
- Die Nutzeranforderung `Umstellung auf Tageskonzept` wurde als Rohquelle in die Wissensbasis aufgenommen.
- Das lokale IndexedDB-Modell wurde auf Tagespläne umgestellt:
  `settings`, `recipes`, `mealTypes`, `recipeDefaultMealTypeAssignments`, `userRecipeMealTypePreferences`, `plannedDays`, `plannedMeals`, `meta` und `snapshots`.
- Alte lokale Wochenplan-Testdaten werden beim Upgrade bewusst verworfen; es gibt keine Migration alter Testdaten.
- Der Generator plant jetzt frei wählbare Datumsbereiche, prüft Überschneidungen und überschreibt bestehende Tagespläne erst nach Bestätigung.
- Die App hat neue beziehungsweise umgebaute Hauptbereiche für aktuellen Plan, Plan generieren, Tagesdetail, Rezeptzulassung, geplante Rezept-Kochansicht, Einkaufsliste, Historie und Einstellungen.
- Jede geplante Mahlzeit kann im Tagesdetail bearbeitet werden:
  Rezept tauschen, Personenzahl ändern, Mahlzeit deaktivieren, Einkaufslisten-Flag setzen und Snacks ergänzen.
- Aus jedem aktiven Mahlzeiten-Slot führt `Rezept kochen` zur konkreten Kochansicht mit skalierten Zutaten und temporärer Personenzahländerung.
- Die Einkaufsliste aggregiert aktive und einkaufsrelevante Mahlzeiten aus einem frei gewählten Datumsbereich.
- Historische Tage oder Zeiträume können kopiert werden; alte Pläne lassen sich in den Einstellungen nach Alter oder Stichtag löschen.
- `README.md`, `KODEX_STAND.md`, Projektstatus, Produktbild, Systembild, Projektüberblick, Leitentscheidungen, offene Punkte und Index wurden auf das Tageskonzept nachgezogen.
- Verifikation:
  `npm run lint` erfolgreich,
  `npm run build` erfolgreich,
  `NEXT_PUBLIC_BASE_PATH=/plan-und-pfanne` mit `NEXT_PUBLIC_SITE_URL=https://levelx2.github.io/plan-und-pfanne` erfolgreich gebaut.

## [2026-04-24] nachbesserung | Tagesdetail lesbarer und Snackbestand erweitert
- Die aktive Tagesauswahl im Tagesdetail wurde kontrastreicher gestaltet und als `Ausgewählter Tag` beschriftet.
- Sichtbare UI-Texte im Tagesdetail vermeiden jetzt den englischen Begriff `Slot` und sprechen von Mahlzeiten.
- Der Snack-Seedbestand wurde um vier glutenfreie Proteinriegel mit 30 %, 40 %, 50 % und 60 % Eiweißanteil ergänzt.
- Der gesamte Seed-Bestand umfasst damit 74 Rezepte, davon 18 Snacks.

## [2026-04-24] nachbesserung | Rezeptauswahl, Navigation und Einkaufsliste geschärft
- Die Hauptnavigation bricht auf schmaleren Breiten um, damit `Historie` und `Einstellungen` sichtbar erreichbar bleiben.
- Die Rezeptauswahl zeigt Mahlzeitentypen standardmäßig eingeklappt; einzelne Typen lassen sich zur Bearbeitung öffnen.
- Der unklare Chip `Standard ein/aus` wurde durch `App-Vorschlag: ja/nein` ersetzt.
- Der Hinweis `lokal gespeicherte glutenfreie Optionen` wurde zu `gespeicherte glutenfreie Optionen` vereinfacht.
- Die Dashboard-Tageskarte spricht bei Makroabweichungen jetzt von `Makros abweichend` statt `prüfenswert`.
- Die Einkaufsliste normalisiert Eier-Zutaten:
  `Ei`, `Eier` und `Eiweiß` werden als `Eier` zusammengeführt; Eiweiß in Gramm wird mit 30 g pro Ei in Stück umgerechnet.
- Die Makro-Vorschau in den Einstellungen trennt Label und Prozentwert jetzt sichtbar.

## [2026-04-24] nachbesserung | Eiweißziel pro Person gewichtsbasiert ergänzt
- Die Einstellungen speichern jetzt bis zu zwölf Eiweiß-Zielprofile mit Körpergewicht und Gramm Eiweiß pro Kilogramm Körpergewicht.
- Sichtbar sind jeweils die Profile passend zur aktuellen Standard-Personenzahl; ausgeblendete Profile bleiben erhalten und erscheinen wieder, wenn die Personenzahl erhöht wird.
- Die Zielwertberechnung nutzt für Eiweiß den Durchschnitt der aktiven Personenprofile als Tagesorientierung pro Person.
- Verifikation:
  `npm run lint` erfolgreich,
  `npm run build` erfolgreich,
  `NEXT_PUBLIC_BASE_PATH=/plan-und-pfanne` mit `NEXT_PUBLIC_SITE_URL=https://levelx2.github.io/plan-und-pfanne` erfolgreich gebaut,
  Einstellungen im In-App-Browser auf dynamische Personenzeilen geprüft.

## [2026-04-24] nachbesserung | Datumsbereich der Einkaufsliste schneller bedienbar
- Start- und Enddatum in der Einkaufsliste haben jetzt je einen kleinen Minus- und Plus-Knopf für Tag zurück beziehungsweise Tag vor.
- Die Knöpfe ändern denselben Datumsbereich wie die Date-Eingaben; ungültige Ein-Tages-Verkürzungen werden deaktiviert.
- Verifikation:
  `npm run lint` erfolgreich,
  `npm run build` erfolgreich,
  `NEXT_PUBLIC_BASE_PATH=/plan-und-pfanne` mit `NEXT_PUBLIC_SITE_URL=https://levelx2.github.io/plan-und-pfanne` erfolgreich gebaut,
  Einkaufsliste im In-App-Browser visuell und per Button-Erreichbarkeit geprüft.

## [2026-04-24] nachbesserung | Datums-Stepper als Standardmuster eingeführt
- Die Plus-/Minus-Bedienung für Datumsfelder wurde in eine gemeinsame `DateStepper`-Komponente überführt.
- Alle aktuellen Date-Eingaben in Plan-Generator, Einkaufsliste, Historie und dem optionalen Lösch-Stichtag der Einstellungen nutzen jetzt dieses Muster.
- Leere Datumsfelder, wie die Kopierquelle in der Historie vor dem Laden geplanter Tage, deaktivieren die Stepper-Knöpfe bis ein gültiges Datum vorhanden ist.
- Verifikation:
  `npm run lint` erfolgreich,
  `npm run build` erfolgreich,
  `NEXT_PUBLIC_BASE_PATH=/plan-und-pfanne` mit `NEXT_PUBLIC_SITE_URL=https://levelx2.github.io/plan-und-pfanne` erfolgreich gebaut,
  Planen, Einkaufsliste, Historie und Einstellungen im In-App-Browser auf vorhandene Stepper geprüft.

## [2026-04-24] qualität | Domain-Tests für das Tageskonzept ergänzt
- `package.json` enthält jetzt ein `npm test`-Skript auf Basis des eingebauten Node-Test-Runners.
- `tests/domain.test.cjs` ergänzt einen kleinen TypeScript-Testloader ohne zusätzliche npm-Abhängigkeiten.
- Abgedeckt werden Datumsbereiche, gewichtsbasiertes Eiweißziel, Tageszielberechnung, Ausschluss deaktivierter Mahlzeiten aus Tagesmakros sowie Einkaufsliste mit Personenzahl-Skalierung, Einkaufslisten-Flag und Eier-Normalisierung.
- Verifikation:
  `npm test` erfolgreich mit 5 Tests,
  `npm run lint` erfolgreich,
  `npm run build` erfolgreich,
  `NEXT_PUBLIC_BASE_PATH=/plan-und-pfanne` mit `NEXT_PUBLIC_SITE_URL=https://levelx2.github.io/plan-und-pfanne` erfolgreich gebaut.

## [2026-04-24] dokumentation | Git-Regeln für Projekte ohne Remote ergänzt
- `AGENTS.md` beschreibt jetzt ausdrücklich, dass Git auch ohne GitHub genutzt wird, GitHub-Schritte aber nur bei vorhandenem Remote oder ausdrücklichem Wunsch erfolgen.
- Die Finito-Sequenz unterscheidet jetzt zwischen Projekten mit Remote und Projekten ohne Remote.
- `Generische Entwicklungsvorgaben.md` enthält die gleiche wiederverwendbare Leitplanke für lokale Git-Projekte ohne GitHub-Anbindung.

## [2026-04-24] qualität | Wissensbasis auf veraltete Aussagen geprüft
- Health-Check der Wissensbasis durchgeführt:
  34 Markdown-Dateien wurden auf defekte Wiki- und Markdown-Links geprüft; es wurden keine defekten Links und keine Orphan-Wissensseiten außerhalb der Rohquellen gefunden.
- `Quellenlage und Aktualität`, `Benutzerkonzept und Verifikation`, `Lokale Mobile-App vs gehosteter Betrieb`, `Umstiegspfad auf lokale PWA` und `Lokaler Start von Entwicklung und Test` wurden auf den aktuellen lokalen PWA- und Tagesplanungsstand nachgezogen.
- Verifikation:
  `npm test` erfolgreich,
  `npm run lint` erfolgreich,
  `NEXT_PUBLIC_BASE_PATH=/plan-und-pfanne` mit `NEXT_PUBLIC_SITE_URL=https://levelx2.github.io/plan-und-pfanne` erfolgreich gebaut.
- Ein erster Buildversuch scheiterte mit `EBUSY` auf `.next/server/pages-manifest.json`; nach kontrolliertem Löschen des generierten `.next`-Ordners lief der Build erfolgreich.

## [2026-04-26] nachbesserung | Rezeptsuche und Rezeptdetails ergänzt
- Die Rezeptseite enthält jetzt eine Suche über Rezeptname, Beschreibung, Mahlzeitentyp, Eiweißquelle, Tags, Zutaten, Zutatenkategorien und Zubereitungsschritte.
- Suchtreffer werden in den Mahlzeitentyp-Gruppen direkt sichtbar gemacht.
- Rezeptdetails sind jetzt auch aus der Planungszulassungs-Liste erreichbar.
- Geöffnete Rezeptdetails starten mit `Zubereitung` und können auf `Zutaten` umgeschaltet werden.
- Verifikation:
  `npm test` erfolgreich,
  `npm run lint` erfolgreich,
  `npm run build` erfolgreich.

## [2026-04-26] dokumentation | README mit Produktüberblick und Screenshots ergänzt
- `README.md` wurde vollständig gegen Wissensbasis, Paketkonfiguration und aktuelle App-Routen gegengeprüft.
- Am Anfang der README steht jetzt eine kurze Erklärung, welchen Nutzen die App bietet und welche Hauptfunktionen zusammenwirken.
- Neue README-Screenshots liegen unter `public/screenshots/`:
  `aktueller-plan.png`, `tagesdetail.png`, `einkaufsliste.png` und `rezepte.png`.
- Die Featureliste der README wurde um Rezeptsuche und Rezeptdetails aktualisiert.
- Verifikation:
  `npm test` erfolgreich,
  `npm run lint` erfolgreich,
  Screenshots im In-App-Browser erzeugt und visuell geprüft.

## [2026-04-26] inhalt | Rezeptpool erweitert und Zubereitungsschritte ausgebaut
- `src/lib/data/additional-recipes.ts` ergänzt 20 neue glutenfreie Seed-Rezepte:
  5 Frühstücke, 5 Mittagessen, 5 Abendessen und 5 Snacks.
- Der Seed-Rezeptpool umfasst damit 94 Rezepte mit folgender Verteilung:
  22 Frühstücke, 24 Mittagessen, 25 Abendessen und 23 Snacks.
- `src/lib/data/detailed-instructions.ts` reichert alle Seed-Rezepte beim Export um ausführlichere Zubereitungsschritte an:
  Vorbereitung, genauere Arbeitshinweise je Zubereitungsart und Abschluss-Hinweise.
- `tests/domain.test.cjs` prüft Rezeptanzahl, Mahlzeitentyp-Verteilung und die vorhandenen Detail-Schritte im Seed-Pool.
- Verifikation:
  `npm test` erfolgreich,
  `npm run lint` erfolgreich,
  `npm run build` erfolgreich.
  Beim ersten Buildlauf verwies eine stale `.next/dev`-Typdatei noch auf bereits gelöschte Routen; nach kontrolliertem Löschen des generierten `.next`-Ordners lief der Build erfolgreich.

## [2026-04-26] bereinigung | Frühere Login- und API-Kompatibilität entfernt
- Die früheren Routen `/anmelden`, `/abmelden`, `/api/health`, `/api/auth/logout` und `/api/scheduler/weekly` wurden aus dem App-Routing entfernt.
- Die zugehörigen Auth-Platzhalter `src/app/auth-actions.ts`, `src/app/auth-form-state.ts` und `src/lib/auth.ts` wurden gelöscht.
- `README.md`, `KODEX_STAND.md`, Projektstatus, Systembild, Benutzerkonzept und offene Punkte wurden auf den neuen Stand ohne Login-, Logout- oder API-Kompatibilität nachgezogen.
- Ein aktueller Kompatibilitätsbedarf für diese Pfade besteht nicht mehr, weil die App lokal als PWA ohne Kontoverwaltung und ohne zentralen Scheduler arbeitet.
- Verifikation:
  `npm test` erfolgreich,
  `npm run lint` erfolgreich,
  `npm run build` nach Entfernen des stale `.next`-Caches erfolgreich.

## [2026-04-30] feature | Rezept-Favoriten ergänzt
- Rezepte können jetzt in der Rezeptübersicht und in der aktuellen generierten Plansicht per Stern als Favorit markiert oder entfernt werden.
- Die Rezeptseite enthält einen eigenen Reiter `Favoriten`, der nur markierte Rezepte zeigt.
- Favoriten-Rezepte bleiben dort zunächst eingeklappt; beim Öffnen erscheinen vollständige Rezeptdetails mit Zubereitung und Zutaten.
- Die lokale IndexedDB wurde auf Version `4` angehoben und speichert Favoriten getrennt im Store `userRecipeFavorites`.
- Verifikation:
  `npm test` erfolgreich,
  `npm run lint` erfolgreich,
  `npm run build` erfolgreich.

## [2026-04-30] nachbesserung | Zubereitungsschritte rezeptgenau und mengenfähig gemacht
- Die Nutzeranforderung zu weniger generischen Zubereitungstexten wurde als Rohquelle `2026-04-30 Rezeptgenaue Zubereitungen mit Mengen.md` erfasst.
- Die pauschale Seed-Anreicherung über `src/lib/data/detailed-instructions.ts` wurde entfernt; Seed-Rezepte werden wieder aus ihren gerichtsspezifischen Rezeptdaten exportiert.
- `src/lib/recipe-instructions.ts` rendert Zutatenmengen in Zubereitungsschritten zentral und skaliert sie für die Kochansicht nach Personenzahl.
- Rezeptdetails und Rezeptsuche verwenden die gerenderten Schritttexte; die Kochansicht verwendet die temporär eingestellte Personenzahl.
- Verifikation:
  `npm test` erfolgreich,
  `npm run lint` erfolgreich,
  `npm run build` erfolgreich.
