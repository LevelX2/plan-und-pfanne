import { Suspense } from "react";
import { RecipesClient } from "./recipes-client";

export default function RecipesPage() {
  return (
    <Suspense fallback={null}>
      <RecipesClient />
    </Suspense>
  );
}
