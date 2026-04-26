import type { MealType, Recipe } from "@/lib/types";

const mealPrepHints: Record<MealType, string> = {
  breakfast:
    "Bereite Schüssel, Pfanne oder Form passend zum Rezept vor und stelle kalte Zutaten erst kurz vor der Verarbeitung bereit.",
  lunch:
    "Plane eine Schüssel oder Box zum Anrichten ein und lasse gegarte Komponenten kurz ausdampfen, damit Salate und Bowls nicht verwässern.",
  dinner:
    "Heize Ofen oder Pfanne rechtzeitig vor und halte einen Deckel, eine Form oder einen Topf bereit, falls das Gericht noch nachziehen muss.",
  snack:
    "Bereite eine kleine Schale, Box oder ein Glas vor und trenne knusprige Zutaten bis kurz vor dem Essen von feuchten Komponenten.",
};

const mealFinishHints: Record<MealType, string> = {
  breakfast:
    "Prüfe zum Schluss Konsistenz und Würzung: süße Frühstücke brauchen oft etwas Zimt oder Säure, herzhafte Frühstücke eher Salz, Pfeffer und frische Kräuter.",
  lunch:
    "Schmecke die Portion vor dem Einpacken oder Servieren ab; bei Meal-Prep-Gerichten Dressing oder frische Toppings getrennt halten, wenn sie knackig bleiben sollen.",
  dinner:
    "Lass heiße Ofen- oder Pfannengerichte kurz ruhen, richte dann Protein, Gemüse und Beilage gleichmäßig an und gib frische Kräuter oder Säure erst am Ende dazu.",
  snack:
    "Richte den Snack so an, dass cremige, saftige und knusprige Teile erkennbar bleiben; gekühlte Snacks bis zum Essen abdecken.",
};

const ingredientNamesForPrep = (recipe: Recipe) =>
  recipe.ingredients
    .slice(0, 4)
    .map((ingredient) => ingredient.name)
    .join(", ");

function detailInstruction(step: string) {
  const normalizedStep = step.trim();
  const lowerStep = normalizedStep.toLowerCase();

  if (
    lowerStep.includes("anbraten") ||
    lowerStep.includes("rösten") ||
    lowerStep.includes("braten")
  ) {
    return `${normalizedStep} Arbeite mit gut vorgeheizter Pfanne oder heißem Ofen, lege die Zutaten möglichst nebeneinander und wende sie erst, wenn sie sichtbar Farbe bekommen.`;
  }

  if (
    lowerStep.includes("backen") ||
    lowerStep.includes("ofen") ||
    lowerStep.includes("grill") ||
    lowerStep.includes("garen")
  ) {
    return `${normalizedStep} Prüfe gegen Ende die Garstufe: Gemüse soll weich, aber nicht matschig sein, Fisch und Fleisch sollen saftig bleiben und Eier nur vollständig stocken.`;
  }

  if (
    lowerStep.includes("kochen") ||
    lowerStep.includes("köcheln") ||
    lowerStep.includes("ziehen lassen") ||
    lowerStep.includes("quellen lassen")
  ) {
    return `${normalizedStep} Halte die Hitze eher moderat, rühre zwischendurch um und gib bei Bedarf etwas Flüssigkeit nach, damit nichts ansetzt oder trocken wird.`;
  }

  if (
    lowerStep.includes("verrühren") ||
    lowerStep.includes("vermengen") ||
    lowerStep.includes("mischen") ||
    lowerStep.includes("unterheben") ||
    lowerStep.includes("pürieren")
  ) {
    return `${normalizedStep} Arbeite zuerst die feuchten Komponenten glatt und hebe empfindliche Zutaten anschließend vorsichtig unter, damit Struktur und Biss erhalten bleiben.`;
  }

  if (
    lowerStep.includes("schneiden") ||
    lowerStep.includes("würfeln") ||
    lowerStep.includes("raspeln") ||
    lowerStep.includes("zerdrücken")
  ) {
    return `${normalizedStep} Schneide möglichst gleichmäßig, damit die Stücke gleichzeitig garen und sich später gut mit Sauce, Dressing oder Toppings verbinden.`;
  }

  if (
    lowerStep.includes("servieren") ||
    lowerStep.includes("anrichten") ||
    lowerStep.includes("toppen") ||
    lowerStep.includes("bestreuen")
  ) {
    return `${normalizedStep} Richte zuerst die Basis an, verteile Protein und Gemüse darüber und setze frische Kräuter, Nüsse oder Sauce zuletzt ein.`;
  }

  if (lowerStep.includes("abschmecken") || lowerStep.includes("würzen")) {
    return `${normalizedStep} Taste dich in kleinen Mengen an Salz, Säure, Süße und Schärfe heran und rühre nach jedem Schritt gründlich durch.`;
  }

  return `${normalizedStep} Arbeite sauber von vorbereiteten Zutaten zum fertigen Gericht und prüfe zwischendurch Temperatur, Biss und Würzung.`;
}

export function withDetailedInstructions(recipes: Recipe[]): Recipe[] {
  return recipes.map((recipe) => {
    if (recipe.instructions[0]?.startsWith("Vorbereitung:")) {
      return recipe;
    }

    const prepIngredients = ingredientNamesForPrep(recipe);

    return {
      ...recipe,
      instructions: [
        `Vorbereitung: Lege alle Zutaten für ${recipe.name} bereit, besonders ${prepIngredients}. Prüfe bei verarbeiteten Produkten kurz die glutenfreie Kennzeichnung und erledige Waschen, Schneiden und Abwiegen vor dem eigentlichen Kochen. ${mealPrepHints[recipe.mealType]}`,
        ...recipe.instructions.map(detailInstruction),
        `Abschluss: ${mealFinishHints[recipe.mealType]}`,
      ],
    };
  });
}
