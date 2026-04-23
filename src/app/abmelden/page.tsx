import { LogoutClient } from "./logout-client";
import { requireUser } from "@/lib/auth";
import { createUserStorageNamespace } from "@/lib/user-storage";

export const dynamic = "force-dynamic";

export default async function LogoutPage() {
  const user = await requireUser("/abmelden");

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px" }}>
      <LogoutClient storageNamespace={createUserStorageNamespace(user.id)} />
    </main>
  );
}
