import Link from "next/link";

export function LogoutClient() {
  return (
    <div>
      <h2>Weiter mit der App</h2>
      <p>
        Deine Daten bleiben auf diesem Gerät gespeichert, bis du sie in der App oder im Browser
        gezielt entfernst.
      </p>
      <p>
        <Link href="/">Zur Startseite</Link>
      </p>
    </div>
  );
}
