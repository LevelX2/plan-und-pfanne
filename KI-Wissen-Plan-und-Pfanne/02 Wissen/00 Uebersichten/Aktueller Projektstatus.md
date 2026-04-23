---
typ: status
status: aktiv
letzte_aktualisierung: 2026-04-23
quellen:
  - ../../01 Rohquellen/repo-root/2026-04-22 Repository-Iststand-Analyse.md
  - ../../01 Rohquellen/2026-04-23 Benutzerkonzept und nutzerscharfer Zugriff.md
  - ../../01 Rohquellen/externe-quellen/2026-04-23 Glutenfreie Rezeptquellen BBC Good Food.md
  - ../../../README.md
  - ../../../src/app/page.tsx
  - ../../../src/app/home-client.tsx
  - ../../../src/app/einkaufsliste/shopping-list-client.tsx
  - ../../../src/lib/db.ts
  - ../../../src/lib/data/imported-recipes.ts
  - ../../../src/lib/store.ts
  - ../../../src/lib/week-plan-selection.ts
  - ../../../public/service-worker.js
tags:
  - status
  - projektstand
---

# Aktueller Projektstatus

## Umgesetzt
- Produktnahe App-Routen sind vorhanden: `/`, `/rezepte`, `/rezepte/[id]`, `/tage/[date]`, `/einkaufsliste`, `/einstellungen`, `/api/health` und `/api/scheduler/weekly`.
- Das Dashboard zeigt die aktuelle Woche, Tageskarten, Makroabweichungen, Planungsprofil, Rezeptanzahlen und Einkaufsumfang.
- Das Dashboard erlaubt jetzt zusätzlich pro geplanter Mahlzeit eine aktive Auswahl; die Auswahl startet leer, lässt sich pro Tag oder komplett schalten und bleibt lokal pro Woche gespeichert.
- Die Tagesansicht pro Datum ist vorhanden und verknüpft die Tagesplanung direkt mit den Rezeptdetails.
- Die Rezeptbibliothek ist nach Mahlzeitentyp gruppiert und bietet ausklappbare Zutaten- und Zubereitungsdetails sowie eine eigene Detailseite pro Rezept.
- Die Einkaufsliste unterstützt jetzt zwei Modi:
  `aktive Gerichte` und `alle geplanten Gerichte`.
  Im Modus `aktive Gerichte` erscheint bei leerer Auswahl ein expliziter Leerzustand; Abhakstatus bleibt lokal pro Woche und Listenkontext gespeichert.
- Die Einstellungslogik ist jetzt über eine reale Seite erreichbar; Speichern regeneriert die aktuelle Woche und führt zurück nach `/einstellungen`.
- Das Einstellungsformular behandelt erwartete Validierungs- und Speicherfehler jetzt inline statt über harte Laufzeitfehler.
- Das Einstellungsformular enthält jetzt zusätzlich einen gekoppelten Dreiregler für `vegetarisch`, `Fisch` und `Fleisch`; die Werte ergeben zusammen immer `100 %`.
- Der Zielmix wird persistent in SQLite gespeichert; bestehende lokale Datenbanken werden beim Start automatisch um die neuen Prozentspalten ergänzt.
- Die Wochenplanung berücksichtigt den Zielmix jetzt als weiche Verteilung für Mittagessen und Abendessen, während Frühstück und Snack davon bewusst ausgenommen bleiben.
- Der Seed-Rezeptpool wurde um 8 weitere glutenfreie Web-Rezepte erweitert und umfasst lokal jetzt 50 Rezepte.
- SQLite ist nicht nur vorbereitet, sondern aktiv genutzt: `data/planner.sqlite` enthält Seed-Rezepte sowie bereits erzeugte Wochen- und Tagespläne mitsamt gespeicherten Mahlzeiten.
- Fachliche Kernmodule für Typen, Datumslogik, Formatierung, Datenbank, Store und Planungslogik sind angebunden und erzeugen die aktuelle Woche bei Bedarf automatisch.
- PWA-Basis mit Manifest, Icons, Service Worker und Anfrage auf persistenten Browser-Speicher ist vorhanden.
- Für unerwartete Laufzeitfehler und nicht gefundene Seiten gibt es jetzt nutzerfreundliche App-Fallbacks.
- `npm run lint` und `npm run build` liefen am 2026-04-23 erfolgreich durch.
- Die frühere Turbopack-Warnung zur NFT-Dateinachverfolgung rund um den Datenbankpfad ist nach engerem SQLite-Pfadscoping in `src/lib/db.ts` nicht mehr aufgetreten.
- Die Scheduler-Route `/api/scheduler/weekly` ist vorhanden und per Request verifiziert; `force=1` erzwingt die Generierung auch außerhalb des Sonntags.
- Die Scheduler-Route ist in Production nicht mehr stillschweigend offen: Ohne `SCHEDULER_SECRET` antwortet sie bewusst mit `503`.

## Teilweise umgesetzt
- Der reale Offlinescope ist jetzt in Produkttexten klarer benannt: Dashboard, Rezeptbibliothek und Einkaufsliste werden lokal abgesichert. Zusätzlich funktionieren aktive Gerichtsauswahl und Einkaufs-Häkchen als lokale Gerätezustände offline; serverseitige Änderungen funktionieren weiterhin nicht offline.
- Railway-Deployment ist nicht mehr nur vorbereitet; eine produktive URL ist bekannt: `https://plan-und-pfanne-production.up.railway.app`. Der produktive Stand wurde zuletzt manuell per Railway-CLI ausgerollt; ein GitHub-Push allein ist aktuell nicht als sicher ausreichender Deploy-Mechanismus dokumentiert.
- Neue Rezept-IDs werden über den bestehenden Seed-Mechanismus beim Start in SQLite eingefügt; nach einem neuen Railway-Deploy kommen zusätzliche Seed-Rezepte damit auch in den produktiven Datenbestand.
- Die Scheduler-Route ist lokal und live funktionsfähig, aber noch nicht an einen echten externen Cron- oder Hosting-Trigger angebunden.

## Offen
- Der Offlinescope, die Nutzungsgrenzen und das Synchronisationsversprechen sollten produktseitig noch expliziter geklärt werden.
- Authentifizierung und benutzerscharfer Datenzugriff sind noch nicht umgesetzt; der aktuelle öffentliche App-Zugriff zeigt weiterhin globalen Single-User-Stand.
- Der alte Ordner `C:\Users\Lui\OneDrive\Projekte\gluten freie Rezepte` ist noch als OneDrive-Reparse-Restzustand sichtbar und sollte kontrolliert entfernt oder bewusst als technischer Rest dokumentiert werden.

## Wichtige Grenzen
- Der Wochenplan wird heuristisch und zufallsbasiert erzeugt; identische Einstellungen führen daher nicht zwingend zu reproduzierbaren Ergebnissen.
- Der Zielmix `vegetarisch / Fisch / Fleisch` ist bewusst eine Näherung und keine starre Garantie; die tatsächlich erreichte Verteilung hängt weiterhin vom verfügbaren Rezeptpool ab.
- Einstellungen, Wochenplan und Einkaufsliste sind im aktuellen Workspace noch nicht an verifizierte Benutzerkonten gebunden. Für öffentlichen Betrieb ist das eine fachliche und datenschutznahe Grenze.
- In Production bleibt die Scheduler-Route ohne `SCHEDULER_SECRET` absichtlich deaktiviert; der produktive Aufrufweg muss daher zusammen mit Secret, Trigger und Monitoring vervollständigt werden.
