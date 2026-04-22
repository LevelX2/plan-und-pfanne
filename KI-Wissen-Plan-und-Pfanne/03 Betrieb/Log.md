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
