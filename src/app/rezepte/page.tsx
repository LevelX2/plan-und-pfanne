import { requireUser } from "@/lib/auth";
import { listRecipes } from "@/lib/store";
import { createUserStorageNamespace } from "@/lib/user-storage";
import { RecipesClient } from "./recipes-client";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const user = await requireUser("/rezepte");
  const recipes = listRecipes(user.id);

  return (
    <RecipesClient
      initialRecipes={recipes}
      storageNamespace={createUserStorageNamespace(user.id)}
      user={{
        email: user.email,
        displayName: user.displayName,
      }}
    />
  );
}
