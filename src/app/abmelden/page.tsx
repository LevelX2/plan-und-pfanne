import Link from "next/link";
import { LogoutClient } from "./logout-client";

export default function LogoutPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px" }}>
      <div style={{ maxWidth: "40rem", display: "grid", gap: "16px" }}>
        <h1>Diese Seite wird nicht mehr verwendet.</h1>
        <p>
          Plan und Pfanne arbeitet ohne separaten Abmeldeablauf. Der Pfad bleibt nur erhalten,
          damit ältere Links weiter funktionieren.
        </p>
        <LogoutClient />
        <p>
          <Link href="/">Zurück zum Dashboard</Link>
        </p>
      </div>
    </main>
  );
}
