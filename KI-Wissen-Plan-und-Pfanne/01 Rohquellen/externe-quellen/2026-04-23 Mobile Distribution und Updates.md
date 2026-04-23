# Mobile Distribution und Updates

## Quelle
- Apple Support, `Turn a website into an app in Safari on iPhone`, abgerufen am 2026-04-23:
  https://support.apple.com/guide/iphone/iphea86e5236/ios
- Apple Developer, `TestFlight Overview`, abgerufen am 2026-04-23:
  https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/
- Apple Developer, `Apple Developer Program`, abgerufen am 2026-04-23:
  https://developer.apple.com/programs/
- Apple Developer, `Program enrollment`, abgerufen am 2026-04-23:
  https://developer.apple.com/help/account/membership/program-enrollment
- Apple Developer, `Set distribution methods`, abgerufen am 2026-04-23:
  https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/set-distribution-methods
- Apple Developer, `Unlisted app distribution`, abgerufen am 2026-04-23:
  https://developer.apple.com/support/unlisted-app-distribution/
- Apple Developer, `Submit an app`, abgerufen am 2026-04-23:
  https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app
- Apple Xcode Help, `Distribution methods`, abgerufen am 2026-04-23:
  https://help.apple.com/xcode/mac/current/en.lproj/dev31de635e5.html
- Apple Xcode Help, `Distribute to registered devices`, abgerufen am 2026-04-23:
  https://help.apple.com/xcode/mac/current/en.lproj/dev7ccaf4d3c.html
- Google Play Console, `Internal testing`, abgerufen am 2026-04-23:
  https://play.google.com/console/about/internal-testing/
- Android Help, `Download apps to your Android device`, abgerufen am 2026-04-23:
  https://support.google.com/android/answer/9457058
- Android Developers Blog, `Android developer verification: Rolling out to all developers`, abgerufen am 2026-04-23:
  https://android-developers.googleblog.com/2026/03/android-developer-verification-rolling-out-to-all-developers.html
- GitHub Docs, `What is GitHub Pages?`, abgerufen am 2026-04-23:
  https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- GitHub Docs, `About releases`, abgerufen am 2026-04-23:
  https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases

## Kernaussagen
- iPhone kann eine Website direkt als Web-App auf den Home-Bildschirm legen:
  Safari -> Teilen -> `Zum Home-Bildschirm` / `Add to Home Screen`, dann `Als Web-App öffnen`.
- TestFlight ist der offizielle Apple-Weg, um iOS-Beta-Builds zu verteilen und Updates an Tester auszuliefern.
- Eine Veröffentlichung im echten iOS App Store setzt aktuell eine Mitgliedschaft im Apple Developer Program voraus; die offizielle Jahresgebühr liegt laut Apple derzeit bei `99 USD`.
- Apple nennt für iOS im Wesentlichen diese offiziellen Verteilwege:
  - App Store Connect mit TestFlight oder App Store
  - Ad Hoc für registrierte Geräte
  - Enterprise nur für interne Organisationsverteilung
- Apple erlaubt zusätzlich `unlisted` Apps:
  sie liegen technisch im App Store, erscheinen aber nicht in Suche, Charts oder Empfehlungen und sind nur über einen Direktlink auffindbar.
- Ad-Hoc-Verteilung auf iOS verlangt registrierte Geräte im Developer-Account und ist eher ein manueller Testweg als ein bequemer Endnutzer-Updatekanal.
- Auch unlisted Apps müssen den normalen App-Review- und Release-Prozess durchlaufen.
- Android kann Apps sowohl über Google Play als auch aus anderen Quellen installieren; Google weist aber ausdrücklich auf Sicherheitsrisiken bei unbekannten Quellen hin.
- Google Play `Internal testing` erlaubt die schnelle Verteilung an bis zu 100 eingeladene Tester ohne reguläre Store-Freigabe.
- GitHub Releases können Binärdateien wie APKs oder IPAs als Release-Assets bereitstellen.
- GitHub Pages ist nur statisches Hosting für HTML, CSS und JavaScript; serverseitige Laufzeit wie Node/SQLite wird dort nicht betrieben.
- Android verschärft laut offizieller Google-Ankündigung ab 2026/2027 die Anforderungen für sideloaded Apps schrittweise in Richtung verifizierter Entwickler und registrierter Apps.

## Projektrelevante Einordnung
- Wenn `Plan und Pfanne` als lokale PWA gedacht wird, ist ein Updateweg über GitHub Pages oder anderes statisches Hosting sehr plausibel.
- Wenn `Plan und Pfanne` als echte installierbare App-Hülle ausgeliefert wird, ist `GitHub als alleiniger Updatekanal` vor allem auf Android praktikabel; auf iOS ist TestFlight deutlich realistischer.
- Wenn `Plan und Pfanne` eine echte iPhone-App für sehr wenige Nutzer werden soll, ist `unlisted App Store` eine mögliche Mittelposition:
  offizieller Installations- und Updateweg über Apple, aber ohne normale Auffindbarkeit im Store.
- GitHub kann in diesem Modell sinnvoll als Build- und Automationsquelle dienen, bleibt aber nicht der eigentliche Updatekanal auf dem Gerät.
- Für einen einzigen Anwender ist die Verteilung trotzdem gut beherrschbar, aber iOS und Android bleiben technisch unterschiedliche Auslieferungswelten.
