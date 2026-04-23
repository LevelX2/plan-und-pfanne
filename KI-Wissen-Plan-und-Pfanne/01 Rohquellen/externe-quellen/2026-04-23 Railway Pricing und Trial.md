# Railway Pricing und Trial

## Quelle
- Offizielle Railway-Preisseite, abgerufen am 2026-04-23:
  https://railway.com/pricing
- Offizielle Railway-Doku `Pricing`, abgerufen am 2026-04-23:
  https://docs.railway.com/pricing
- Offizielle Railway-Doku `Pricing Plans`, abgerufen am 2026-04-23:
  https://docs.railway.com/pricing/plans
- Offizielle Railway-Doku `Free Trial`, abgerufen am 2026-04-23:
  https://docs.railway.com/pricing/free-trial

## Kernaussagen
- Railway bietet aktuell neben Trial und Paid-Plänen auch einen echten `Free`-Plan mit `0 USD pro Monat` Grundpreis.
- Neue Nutzer starten mit einem `30-Tage-Trial` und einem einmaligen Guthaben von `5 USD`.
- Nach Ablauf von `30 Tagen` oder nach Verbrauch der `5 USD` fällt der Account auf den `Free`-Plan zurück.
- Der `Free`-Plan stellt laut Doku `1 USD` kostenlose Ressourcen pro Monat bereit; dieses Guthaben rollt nicht in den Folgemonat über.
- Der `Hobby`-Plan kostet `5 USD pro Monat` und enthält `5 USD` monatliches Nutzungsbudget.
- Auf der Preisseite sind `Cron jobs per project` für den Free-Bereich als `Free Trial only` ausgewiesen.
- Standardressourcen laut Doku:
  - Trial: bis zu `2 vCPU`, `1 GB RAM`, `0.5 GB` Volume Storage
  - Free: bis zu `1 vCPU`, `0.5 GB RAM`, `0.5 GB` Volume Storage
- Laut aktueller Doku zur Bepreisung liegen die Basispreise bei:
  - RAM: `10 USD / GB / Monat`
  - CPU: `20 USD / vCPU / Monat`
  - Volume Storage: `0.15 USD / GB / Monat`
  - Egress: `0.05 USD / GB`

## Projektrelevante Einordnung
- Die Aussage `Railway ist nach 30 Tagen nicht mehr kostenlos` ist im engen Sinn nicht ganz präzise, weil danach weiterhin ein Free-Plan existiert.
- Für eine dauerhaft laufende Web-App mit Serverlogik, Volume und Scheduler-relevanten Anforderungen ist das kostenlose Restbudget aber sehr klein.
- Für `Plan und Pfanne` stärkt das die Option einer rein lokalen Mobile-App oder eines sehr schlanken Hosting-Zuschnitts ohne dauerhaften App-Server.
