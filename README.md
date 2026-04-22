This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Auf dem Handy im selben WLAN testen

Der einfachste Weg ist der neue Befehl:

```bash
npm run dev:handy
```

Dann die IPv4-Adresse deines PCs herausfinden, zum Beispiel mit:

```powershell
ipconfig
```

Und am Handy im selben WLAN diese Adresse im Browser oeffnen:

```text
http://DEINE-IP:3000
```

Beispiel:

```text
http://192.168.178.23:3000
```

Wenn Windows beim ersten Start nach Firewall-Zugriff fragt, den Zugriff fuer dein privates Netzwerk erlauben.

## Installierbare Rezept-App fuer das Handy

Die Route `/rezepte` ist jetzt fuer die Offline-Nutzung vorbereitet:

- Web-App-Manifest, App-Icons und Apple-Icon sind vorhanden.
- Ein Service Worker speichert die Rezeptseite fuer die spaetere Offline-Nutzung.
- Die Rezeptbibliothek wird lokal im Browser-Speicher des Handys abgelegt.

Wichtig:

- Fuer eine echte Installation auf dem Handy braucht die App eine `HTTPS`-Adresse.
- Die Offline-Funktion deckt aktuell die Rezeptbibliothek ab.
- Wochenplan, Einstellungen und Einkaufsliste sind noch nicht komplett auf Offline-Betrieb umgestellt.

## Deployment auf Railway

Das Projekt ist fuer Railway vorbereitet:

- `Dockerfile` fuer einen produktionsfaehigen Next.js-Container
- `railway.toml` mit Dockerfile-Build und Healthcheck
- `output: "standalone"` in `next.config.ts`
- `GET /api/health` als Healthcheck-Endpunkt
- volumenfaehiger Datenbankpfad ueber `RAILWAY_VOLUME_MOUNT_PATH` oder `DATA_DIR`

Empfohlene Schritte in Railway:

1. Repository nach GitHub pushen.
2. In Railway ein neues Projekt anlegen und das GitHub-Repo verbinden.
3. Bei der Web-Service-App ein Volume anhaengen.
4. Als Mount Path entweder `/data` oder `/app/data` verwenden.
5. Eine Domain generieren.
6. Nach dem ersten erfolgreichen Deploy die HTTPS-URL am Handy oeffnen und die App installieren.

Hinweis:

- Die SQLite-Datei liegt auf Railway dauerhaft im Volume und bleibt damit ueber Re-Deploys und Neustarts erhalten.
- Railway bietet fuer Volumes auch Backups an, was fuer die SQLite-Datei nuetzlich ist.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
