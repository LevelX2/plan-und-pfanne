# PWA lokale Persistenz und Migrationen

## Quelle
- MDN, `Using IndexedDB`, abgerufen am 2026-04-23:
  https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
- MDN, `Storage quotas and eviction criteria`, abgerufen am 2026-04-23:
  https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- MDN, `StorageManager.persist()`, abgerufen am 2026-04-23:
  https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
- web.dev, `Update`, abgerufen am 2026-04-23:
  https://web.dev/learn/pwa/update
- web.dev, `Assets and data`, abgerufen am 2026-04-23:
  https://web.dev/learn/pwa/assets-and-data
- web.dev, `Architecture`, abgerufen am 2026-04-23:
  https://web.dev/learn/pwa/architecture
- WebKit, `Updates to Storage Policy`, abgerufen am 2026-04-23:
  https://webkit.org/blog/14403/updates-to-storage-policy/

## Kernaussagen
- IndexedDB ist für persistente strukturierte Daten im Browser gedacht und eignet sich für lokale Zustände wie Einstellungen und Verlauf.
- Wenn eine App dieselbe Origin behält, kann eine neue Version grundsätzlich auf die vorhandene lokale Datenbank zugreifen.
- Wenn die Datenbankversion erhöht wird, löst IndexedDB `onupgradeneeded` aus; dort werden Schemaänderungen und Migrationen durchgeführt.
- Service-Worker- oder Asset-Updates löschen IndexedDB nicht automatisch.
- Browser-Speicher ist trotzdem nicht absolut garantiert:
  Nutzer können Site-Daten manuell löschen, und Browser können Daten unter Speicherknappheit oder nach Inaktivität verwerfen.
- Mit `navigator.storage.persist()` kann eine App persistenten Speicher anfragen; die Entscheidung bleibt browserabhängig.
- In WebKit/Safari ist `persistent` heuristisch, wobei Home-Screen-Web-Apps ein positiver Faktor sein können.
- Ein Origin-Wechsel, zum Beispiel von einer Railway-Domain auf eine GitHub-Pages-Domain, trennt den Zugriff auf vorhandene lokale Daten.

## Projektrelevante Einordnung
- Für `Plan und Pfanne` sind `Einstellungen`, `Historie`, lokale Wochenstände und lokale Importmetadaten gute Kandidaten für IndexedDB.
- Ein GitHub-basierter PWA-Updateweg ist mit Datenpersistenz vereinbar, solange die App auf derselben Origin weiterläuft und Migrationen sauber implementiert werden.
- Ein späterer Domainwechsel muss als Datenbruch behandelt werden; vorhandene lokale Daten wären dann nicht automatisch weiter nutzbar.
