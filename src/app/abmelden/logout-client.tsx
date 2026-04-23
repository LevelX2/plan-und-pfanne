"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearOfflineSnapshotsByPrefixes } from "@/lib/offline-store";

type LogoutClientProps = {
  storageNamespace: string;
};

export function LogoutClient({ storageNamespace }: LogoutClientProps) {
  const [status, setStatus] = useState<"pending" | "error">("pending");

  useEffect(() => {
    let cancelled = false;

    async function runLogout() {
      try {
        await clearOfflineSnapshotsByPrefixes([`${storageNamespace}:`]);
        const response = await fetch("/api/auth/logout", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Logout-Request fehlgeschlagen.");
        }

        if (!cancelled) {
          window.location.replace("/anmelden?status=abgemeldet");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void runLogout();

    return () => {
      cancelled = true;
    };
  }, [storageNamespace]);

  if (status === "error") {
    return (
      <div>
        <h1>Abmeldung gerade nicht möglich</h1>
        <p>
          Die lokalen Daten auf diesem Gerät wurden bereits bereinigt, aber die Server-Session
          konnte nicht beendet werden.
        </p>
        <p>
          Bitte versuche es erneut, sobald wieder eine Verbindung besteht, oder gehe zurück zum{" "}
          <Link href="/">Dashboard</Link>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Du wirst abgemeldet ...</h1>
      <p>Wir räumen gerade die lokalen Gerätedaten auf und beenden danach Deine Session.</p>
    </div>
  );
}
