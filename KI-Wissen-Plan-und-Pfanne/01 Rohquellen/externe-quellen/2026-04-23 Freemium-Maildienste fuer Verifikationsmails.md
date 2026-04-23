# Freemium-Maildienste für Verifikationsmails

## Quelle
- Offizielle Anbieter-Dokumentation, abgerufen am 2026-04-23

## Referenzen
- Resend Pricing: https://resend.com/pricing
- Resend Next.js Quickstart: https://resend.com/docs/send-with-nextjs
- Resend Domains: https://resend.com/docs/dashboard/domains/introduction
- Resend Production Approval: https://resend.com/docs/knowledge-base/does-resend-require-production-approval
- Brevo Free Plan: https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans
- SMTP2GO Free Plan: https://support.smtp2go.com/hc/en-gb/articles/223087947-Free-Plan
- MailerSend Pricing: https://www.mailersend.com/pricing

## Für das Projekt relevante Kernaussagen
- Resend Free:
  - 3.000 E-Mails pro Monat
  - 100 E-Mails pro Tag
  - 1 Domain
  - sofortige Production-Nutzung ohne separates Freischaltverfahren
  - offizielle Next.js-Dokumentation vorhanden
- Brevo Free:
  - 300 E-Mails pro Tag
  - dauerhaft kostenlos laut Hilfeseite
  - Transaktionsmails grundsätzlich enthalten
- SMTP2GO Free:
  - 1.000 E-Mails pro Monat
  - 200 E-Mails pro Tag
  - keine Zeitbegrenzung laut Support-Seite
- MailerSend Free:
  - 500 E-Mails pro Monat
  - nach Account-Freigabe
  - auf der Pricing-Seite mit notwendiger Kartenhinterlegung für den Free-Plan beschrieben

## Projektbezogene Bewertung
- Für `Plan und Pfanne` ist Resend der sinnvollste Startkandidat:
  - gute Passung zu Next.js
  - klarer Free-Tier für kleine Mengen an Verifikationsmails
  - einfache API statt SMTP-Zwang
  - Domain-Verifikation über SPF und DKIM sauber dokumentiert
- Brevo bleibt eine sinnvolle Fallback-Option, wenn später ein dauerhaft kostenloser, weniger entwicklerzentrierter Dienst bevorzugt wird.
