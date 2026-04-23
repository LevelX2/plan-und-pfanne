# Generische Entwicklungsvorgaben

## Zweck
Diese Seite sammelt wiederverwendbare technische Leitplanken, die nicht nur für einen einzelnen Screen oder Einzelfall gelten.

## Aktuelle Vorgaben
- Sichtbare UI-Texte sollen in natürlichem Deutsch mit Umlauten und `ß` formuliert werden.
- Bei größeren Next.js-spezifischen Änderungen sollen vor der Umsetzung die lokalen Next-Dokumente in `node_modules/next/dist/docs/` geprüft werden, weil sich APIs und Konventionen stark geändert haben können.
- Bei Next.js-Servermodulen mit Dateisystemzugriff sollen Laufzeitpfade für Turbopack und `standalone`-Builds möglichst eng und statisch formuliert werden, zum Beispiel direkt auf eine konkrete Datei wie `data/planner.sqlite` statt breit über dynamische Projektpfade oder generische Ordnerverkettung.
- Offline- oder PWA-Aussagen sollen den tatsächlichen Geltungsbereich klar benennen und nicht pauschal die ganze App als offlinefähig darstellen, wenn nur Teilbereiche abgesichert sind.
- Formulare, Server Actions und Route Handler mit nutzerbezogenen Daten müssen Authentifizierung und Autorisierung serverseitig selbst prüfen; reine UI-Sperren oder ein vorgelagerter `proxy.ts` reichen dafür nicht aus.
