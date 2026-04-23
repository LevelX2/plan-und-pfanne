# Railway Mailversand und Variablen

## Quelle
- Offizielle Railway-Dokumentation, abgerufen am 2026-04-23

## Referenzen
- Outbound Networking: https://docs.railway.com/networking/outbound-networking
- Using Variables: https://docs.railway.com/variables
- Railway Domains: https://docs.railway.com/networking/domains/railway-domains

## Für das Projekt relevante Kernaussagen
- Railway-Services können ausgehende Verbindungen zu externen Diensten nutzen.
- SMTP ist laut Railway nur auf Pro und höheren Plänen verfügbar.
- Auf Free-, Trial- und Hobby-Plänen sollen für E-Mail-Versand stattdessen Transaktions-Maildienste mit HTTPS-API verwendet werden.
- Railway empfiehlt auch allgemein eher Transaktions-Maildienste mit HTTPS-API als klassisches SMTP.
- Variablen und Secrets können in Railway als Umgebungsvariablen für Build und Laufzeit hinterlegt werden.
- Bei in Railway gekauften Domains können benutzerdefinierte DNS-Records verwaltet werden, was für Mail-Domain-Verifikation relevant sein kann.
