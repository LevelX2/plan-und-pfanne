import Link from "next/link";
import { LogoutClient } from "./logout-client";

export default function LogoutPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px" }}>
      <div style={{ maxWidth: "40rem", display: "grid", gap: "16px" }}>
        <h1>Anmelden und Abmelden entfallen im lokalen Modus</h1>
        <p>
          Die GitHub-Pages-Variante von Plan und Pfanne arbeitet ohne Sessions. Dieser Pfad bleibt
          nur als kompatibler Legacy-Hinweis bestehen.
        </p>
        <LogoutClient storageNamespace="local-pwa" />
        <p>
          <Link href="/">Zurück zum Dashboard</Link>
        </p>
      </div>
    </main>
  );
}
