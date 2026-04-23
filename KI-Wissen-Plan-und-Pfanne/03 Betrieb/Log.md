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
