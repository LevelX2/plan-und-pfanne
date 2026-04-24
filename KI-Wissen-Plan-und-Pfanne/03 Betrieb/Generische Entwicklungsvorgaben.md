# Generische Entwicklungsvorgaben

## Zweck
Diese Seite sammelt wiederverwendbare technische Leitplanken, die nicht nur für einen einzelnen Screen oder Einzelfall gelten.

## Aktuelle Vorgaben
- Sichtbare UI-Texte sollen in natürlichem Deutsch mit Umlauten und `ß` formuliert werden.
- Hotkeys sind als übergreifendes App-Verhalten zu behandeln und nicht seitenlokal oder komponentenlokal zu erfinden.
- Hotkeys sollen an einer zentralen Stelle definiert und dokumentiert werden; einzelne Screens dürfen nur fachlich begründete Ausnahmen ergänzen.
- Hotkeys dürfen Texteingaben, Formularfelder, native Browser-Kurzbefehle und Bedienhilfen nicht stören.
- Bei größeren Next.js-spezifischen Änderungen sollen vor der Umsetzung die lokalen Next-Dokumente in `node_modules/next/dist/docs/` geprüft werden, weil sich APIs und Konventionen stark geändert haben können.
- In Dateien mit `"use server"` dürfen nur `async`-Funktionen exportiert werden. Zustandskonstanten oder Initialwerte für `useActionState` gehören deshalb in Client-Komponenten oder in separate Module ohne `"use server"`.
- Bei Next.js-Servermodulen mit Dateisystemzugriff sollen Laufzeitpfade für Turbopack und `standalone`-Builds möglichst eng und statisch formuliert werden, zum Beispiel direkt auf eine konkrete Datei wie `data/planner.sqlite` statt breit über dynamische Projektpfade oder generische Ordnerverkettung.
- Offline- oder PWA-Aussagen sollen den tatsächlichen Geltungsbereich klar benennen und nicht pauschal die ganze App als offlinefähig darstellen, wenn nur Teilbereiche abgesichert sind.
- Bei lokal rehydrierten UI-Zuständen aus IndexedDB oder ähnlichen Browser-Speichern sollen `useEffect`-Abhängigkeiten nicht direkt an pro Render neu erzeugten Arrays oder Objekten hängen; dafür sind stabile primitive Signaturen oder fachlich echte Auslöser zu bevorzugen, damit gespeicherte Snapshots laufende Nutzerinteraktionen nicht sofort wieder überschreiben.
- Formulare, Server Actions und Route Handler mit nutzerbezogenen Daten müssen Authentifizierung und Autorisierung serverseitig selbst prüfen; reine UI-Sperren oder ein vorgelagerter `proxy.ts` reichen dafür nicht aus.
