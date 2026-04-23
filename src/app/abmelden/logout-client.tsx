import Link from "next/link";

type LogoutClientProps = {
  storageNamespace: string;
};

export function LogoutClient({ storageNamespace }: LogoutClientProps) {
  return (
    <div>
      <h2>Legacy-Link aktiv</h2>
      <p>
        Die frühere Session-Abmeldung wird nicht mehr gebraucht. Lokale Daten bleiben auf dem Gerät
        und werden künftig direkt in der PWA verwaltet.
      </p>
      <p>Technischer Legacy-Namespace: {storageNamespace}</p>
      <p>
        <Link href="/">Zur Startseite</Link>
      </p>
    </div>
  );
}
