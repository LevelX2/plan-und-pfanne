# Qualitätsprüfung

## Letzter Check
- 2026-04-22: Grundstruktur angelegt, initiale Seiten verlinkt, noch kein tiefer Orphan- oder Linkcheck über spätere Erweiterungen möglich.
- 2026-04-22: vertiefte Ist-Stand-Analyse eingearbeitet, Index um neue Rohquellen-Referenz und Seite zu offenen Fragen ergänzt, dokumentierte Widersprüche zwischen `KODEX_STAND.md` beziehungsweise `README.md` und aktuellem Code sichtbar gemacht.
- 2026-04-22: Wissensordnerpfad in `AGENTS.md` und Betriebsdokumentation auf `KI-Wissen-Plan-und-Pfanne/` umgestellt, Lint im neuen Projektpfad erfolgreich.
- 2026-04-24: Nach der Umstellung auf das Tageskonzept wurde ein automatisierter Domain-Testlauf ergänzt. `npm test` nutzt den Node-Test-Runner und prüft Datumslogik, gewichtsbasiertes Eiweißziel, Tagesbewertung mit deaktivierten Mahlzeiten sowie Einkaufslisten-Skalierung und Eier-Normalisierung.
- 2026-04-24: Health-Check der Wissensbasis durchgeführt. 34 Markdown-Dateien geprüft; keine defekten Wiki- oder Markdown-Links und keine Orphan-Wissensseiten außerhalb der Rohquellen gefunden. `npm test`, `npm run lint` und der GitHub-Pages-Build mit `NEXT_PUBLIC_BASE_PATH=/plan-und-pfanne` liefen erfolgreich. Ein erster Buildversuch scheiterte mit `EBUSY` auf `.next/server/pages-manifest.json`; nach kontrolliertem Löschen des generierten `.next`-Ordners lief der Build erfolgreich.
- 2026-04-24: Veraltete Vor-Tageskonzept-Aussagen korrigiert: `Quellenlage und Aktualität`, `Benutzerkonzept und Verifikation`, `Lokale Mobile-App vs gehosteter Betrieb`, `Umstiegspfad auf lokale PWA` und `Lokaler Start von Entwicklung und Test` wurden auf den aktuellen lokalen PWA- und Tagesplanungsstand nachgezogen.

## Nächste sinnvolle Prüfungen
- prüfen, ob zukünftige neue Wissensseiten unter `Risiken und offene Punkte` ebenfalls im Index auftauchen
- bei weiterem Ausbau Offlinescope, Cache-Verhalten und UI-Texte gezielt gegen den echten Produktstand prüfen
- ergänzend zu den Domain-Tests später Browser- oder Komponenten-Tests für Überschneidungsdialoge, Tagesdetail-Bedienung, Rezept-Kochansicht und Historie-Kopieren aufbauen
- produktnahe PWA-Installation, Offline-Nutzung und Updateverhalten auf iPhone und Android prüfen
- klären, ob Export, Backup oder Gerätewechselpfad als nächster Produktschritt priorisiert werden
