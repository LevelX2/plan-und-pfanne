---
typ: konzept
status: aktiv
letzte_aktualisierung: 2026-04-23
quellen:
  - ../../../01 Rohquellen/2026-04-23 Benutzerkonzept und nutzerscharfer Zugriff.md
  - ../../../src/lib/db.ts
  - ../../../src/lib/auth.ts
  - ../../../src/lib/store.ts
  - ../../../src/app/actions.ts
  - ../../../src/app/auth-actions.ts
  - ../../../src/app/anmelden/page.tsx
  - ../../../src/app/abmelden/page.tsx
  - ../../../src/app/page.tsx
  - ../../../src/app/home-client.tsx
  - ../../../src/app/einstellungen/page.tsx
  - ../../../src/app/einkaufsliste/page.tsx
  - ../../../src/app/api/auth/logout/route.ts
  - ../../../node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md
  - ../../../node_modules/next/dist/docs/01-app/02-guides/authentication.md
  - ../../../node_modules/next/dist/docs/01-app/02-guides/forms.md
  - ../../../node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md
tags:
  - benutzer
  - authentifizierung
  - verifikation
  - datenschutz
  - einkaufsliste
---

# Benutzerkonzept, Verifikation und Datenzugriff

## Anlass
Der aktuelle Workspace arbeitet faktisch als Single-User-System:
- `user_settings` enthält genau einen globalen Datensatz mit `id = 1`
- `weekly_plans` und Folgedaten hängen zwar formal an `user_id`, werden aber praktisch immer auf `1` geschrieben
- Dashboard, Einstellungen und Einkaufsliste sind ohne Anmeldung erreichbar
- eine Neugenerierung überschreibt damit denselben gemeinsam sichtbaren Wochenstand

Für einen öffentlich erreichbaren Betrieb ist das nicht sinnvoll. Personalisierte Planungsdaten, Ausschlüsse und Einkaufsableitungen sollen nur für den verifizierten Nutzer sichtbar und veränderbar sein.

## Zielbild
- Vor dem Betreten des eigentlichen App-Bereichs ist eine Anmeldung oder Registrierung Pflicht.
- Nach erfolgreicher Verifikation sieht ein Nutzer ausschließlich:
  - sein eigenes Planungsprofil
  - seine eigenen Wochen- und Tagespläne
  - seine eigene Einkaufsliste und deren Status
- Öffentliche Seiten bleiben auf eine Landingpage, Produktbeschreibung und gegebenenfalls rechtliche Seiten begrenzt.
- Der Rezeptkatalog kann später bewusst geteilt oder teilweise öffentlich gezeigt werden, aber nicht implizit zusammen mit personalisierten Planungsdaten.

## Empfohlene Verifikation
Für `Plan und Pfanne` ist ein passwortloses E-Mail-Verfahren die sinnvollste Startlösung:
- Eingabe von E-Mail-Adresse, optional ergänzt um Anzeigenamen beim ersten Einstieg
- Versand eines einmaligen Anmeldecodes oder Magic Links
- nach erfolgreicher Prüfung Erstellung einer Server-Session über ein `httpOnly`-Cookie

## Warum diese Verifikation passt
- Die Daten sind persönlich und privat, aber typischerweise nicht so hochkritisch, dass sofort ein stärkeres Verfahren wie SMS oder verpflichtende Zwei-Faktor-Logik nötig wäre.
- Passwortlos senkt die Hürde auf dem Handy deutlich und vermeidet Passwort-Reset, schwache Kennwörter und zusätzlichen Supportaufwand.
- Die E-Mail-Adresse liefert eine nachvollziehbare Besitzprüfung, ohne das Produkt unnötig schwer zu machen.

## Nicht empfohlene Startvarianten
- Nur Passwort ohne verifizierte E-Mail:
  - zu viel Reibung, aber kein echter Vorteil für dieses Produkt
- SMS-Verifikation:
  - höhere Kosten und Betriebsabhängigkeiten ohne klaren Mehrwert für den MVP
- Gastzugang mit gemeinsamem Link:
  - widerspricht dem Ziel benutzerscharfer Daten

## Empfohlener Nutzerfluss
1. Öffentlicher Erstbesuch landet auf einer schmalen Startseite mit klarer Anmeldung.
2. Nutzer gibt seine E-Mail-Adresse ein.
3. Die App versendet einen einmaligen Code oder Link.
4. Nach erfolgreicher Verifikation wird eine Session angelegt und auf das persönliche Dashboard weitergeleitet.
5. Alle App-Routen prüfen die Session serverseitig und laden Daten nur für diesen Nutzer.
6. Beim Abmelden werden Session und nutzerbezogene Offline-Caches auf dem Gerät entfernt.

## Umgesetzter Workspace-Stand
- Die App schützt die produktnahen Routen jetzt serverseitig:
  `/`, `/rezepte`, `/rezepte/[id]`, `/tage/[date]`, `/einkaufsliste`, `/einstellungen` und `/abmelden` verlangen eine gültige Session.
- Eine öffentliche Anmeldeseite unter `/anmelden` führt über passwortlosen E-Mail-Code durch den Einstieg.
- `src/lib/auth.ts` kapselt Challenge-Erzeugung, Verifikation, Session-Cookie und Nutzerermittlung als zentrale Auth-Schicht.
- Die SQLite-Datenbank enthält jetzt die Tabellen `users`, `auth_challenges` und `sessions`.
- `user_settings`, `weekly_plans` und `daily_plans` sind im Workspace auf echte Nutzertrennung umgestellt:
  - `user_settings.user_id` statt Singleton `id = 1`
  - `weekly_plans UNIQUE(user_id, start_date)`
  - `daily_plans` nicht mehr global pro Datum eindeutig
- Store-Funktionen und Server Actions arbeiten jetzt mit echtem `userId` statt implizit mit einem globalen Einzelbenutzer.
- Offline-Snapshots, aktive Gerichte und Einkaufs-Häkchen werden zusätzlich über einen nutzerbezogenen Storage-Namespace getrennt.
- Das Logout räumt lokale Offline-Artefakte des aktiven Nutzers auf dem Gerät auf und beendet danach die Server-Session.
- Die Scheduler-Logik generiert Wochenpläne nicht mehr global, sondern für alle verifizierten Nutzerkonten.

## Datenmodell für benutzerscharfen Betrieb
### Neue oder geänderte Kernobjekte
- `users`
  - `id`
  - `email` eindeutig
  - `display_name`
  - `verified_at`
  - `created_at`
  - `updated_at`
  - `last_login_at`
- `auth_challenges`
  - E-Mail-Adresse
  - gehashter Code oder Token
  - Ablaufzeit
  - Verbrauchsstatus
- `sessions`
  - `user_id`
  - gehashter Session-Token
  - Ablaufzeit
  - `created_at`
  - `last_seen_at`

### Bestehende fachliche Tabellen
- `user_settings` soll von einer Singleton-Tabelle auf `user_id UNIQUE` umgestellt werden.
- `weekly_plans` soll über `UNIQUE(user_id, start_date)` getrennt werden.
- `daily_plans.date` darf nicht mehr global eindeutig sein, sondern nur noch im Kontext des zugehörigen Wochenplans.
- `meals` kann am Wochen- und Tagesbezug hängen bleiben, solange der Kaskadenpfad eindeutig einem Nutzer gehört.
- `recipes` kann zunächst global bleiben, weil der Rezeptpool aktuell gemeinschaftliche Stammdaten und keine privaten Nutzerdaten enthält.

## Zugriffsschutz im Code
- Seiten, Server Actions und Route Handler dürfen nicht mehr implizit gegen `user_id = 1` arbeiten.
- Store-Funktionen sollen einen verifizierten Nutzerkontext oder `userId` erhalten.
- Jede Server Action muss Authentifizierung und Autorisierung selbst prüfen, auch wenn das Formular nur auf einer geschützten Seite gerendert wird.
- `proxy.ts` darf nur für schnelle Weiterleitungen oder optimistische Checks genutzt werden. Die eigentliche Berechtigung muss in Seiten, Actions und Route Handlern serverseitig abgesichert bleiben.
- Sessions sollen über sichere Cookies laufen:
  - `httpOnly`
  - `sameSite=lax`
  - `secure` in Production
  - klar definierte Laufzeit und Erneuerung

## Regenerierung und Löschschutz
Die Funktion `Woche neu generieren` darf nur die aktuelle Woche des angemeldeten Nutzers betreffen. Zusätzlich ist sinnvoll:
- vor der Neugenerierung ein klarer Hinweis, dass die aktuelle persönliche Woche ersetzt wird
- mittelfristig eine letzte vorige Version als Revision oder Fallback behalten

Damit wird verhindert, dass Regenerierung als globales Überschreiben eines gemeinsamen Datenstands erlebt wird.

## Einkaufssystem
Das Einkaufssystem soll mindestens in zwei Ebenen benutzerscharf werden:
- Ableitung der Einkaufsliste aus dem persönlichen Wochenplan
- Speicherung des Abhak- oder Fortschrittsstatus nutzerbezogen statt implizit nur pro Browserzustand

Für den ersten Ausbau reicht es, wenn Checklisten lokal pro Nutzer und Woche auf dem Gerät getrennt gespeichert werden. Wenn dieselbe Person das System auf mehreren Geräten nutzt, ist danach eine serverseitige Synchronisation des Einkaufsstatus der sinnvolle nächste Schritt.

## Offline-Verhalten im Nutzerkontext
- Offline-Snapshots müssen pro Nutzer getrennt gespeichert werden.
- Ein Logout soll lokale Snapshots, Shopping-Checks und ähnliche Geräteartefakte des aktiven Nutzers bereinigen.
- Bei gemeinsam genutzten Geräten darf nach dem Logout kein alter persönlicher Planungsstand mehr sichtbar bleiben.

## Noch offene Punkte
- Für echten produktiven E-Mail-Versand muss der Anmeldecode-Versand konfiguriert sein.
  Im Workspace nutzt die Implementierung `RESEND_API_KEY` und `AUTH_FROM_EMAIL`; ohne diese Variablen bleibt in Production kein Versand möglich.
- Die Einkaufs-Häkchen sind weiterhin lokal pro Gerät und Nutzer getrennt, aber noch nicht serverseitig über mehrere Geräte synchronisiert.
- Passkeys, Haushalte oder explizites Teilen sind weiterhin Ausbaustufen und nicht Teil des aktuellen Stands.

## Sharing nicht stillschweigend, sondern explizit
Einkauf und Wochenplanung können später bewusst geteilt werden, aber nur über ein explizites Modell wie:
- Haushalt
- Einladung
- Freigabe einzelner Wochen oder Listen

Gemeinsame Sichtbarkeit darf nicht mehr der Default sein.

## Umsetzungsreihenfolge
1. Anmeldung, Verifikation, Session-Verwaltung und geschützte App-Routen einführen.
2. Datenmodell und Store auf echte `user_id`-Trennung umstellen.
3. Regenerierung, Einstellungen und Einkaufslogik an den Nutzerkontext binden.
4. Offline-Caches und lokale Einkaufschecks pro Nutzer segmentieren und beim Logout bereinigen.
5. Optional danach:
   - serverseitig synchronisierte Einkaufs-Checkboxen
   - Passkeys
   - Haushalts- oder Freigabemodell

## Einordnung zum aktuellen Workspace-Stand
Der Workspace ist nicht mehr im früheren globalen Single-User-Zustand. Die Umstellung auf passwortlose Anmeldung, Sessions und benutzerscharfen Datenzugriff ist technisch erfolgt und durch `npm run lint` sowie `npm run build` verifiziert.

Nicht abgeschlossen ist damit aber noch der gesamte Produktivpfad:
- produktiver E-Mail-Versand muss konfiguriert werden
- Shopping-Fortschritt ist noch nicht serverseitig geräteübergreifend synchronisiert
- Sharing bleibt weiterhin ein bewusster späterer Ausbau statt impliziter Standard
