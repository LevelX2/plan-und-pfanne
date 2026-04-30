import { formatShoppingQuantity } from "@/lib/format";
import { getScaledIngredientAmount } from "@/lib/local-store";
import type { Ingredient, Recipe } from "@/lib/types";

export type RecipeInstructionChip = {
  kind: "time" | "equipment" | "heat" | "texture" | "cutting";
  icon: string;
  label: string;
};

export type RenderedRecipeInstruction = {
  text: string;
  chips: RecipeInstructionChip[];
};

const ingredientPlaceholderPattern = /\{\{([^{}]+)\}\}/g;
const ingredientAdjectives = new Set([
  "glutenfrei",
  "glutenfreie",
  "glutenfreier",
  "glutenfreies",
  "gekocht",
  "gekochte",
  "gekochter",
  "gekochtes",
  "gehackt",
  "gehackte",
  "griechisch",
  "griechische",
  "griechischer",
  "griechisches",
  "rote",
  "roter",
  "rotes",
  "schwarze",
  "schwarzer",
  "schwarzes",
  "weiße",
  "weißer",
  "weißes",
]);

function normalizeIngredientName(value: string) {
  return value.trim().toLocaleLowerCase("de-DE");
}

function findIngredient(recipe: Recipe, name: string) {
  const normalizedName = normalizeIngredientName(name);
  return recipe.ingredients.find((ingredient) => normalizeIngredientName(ingredient.name) === normalizedName) ?? null;
}

function formatIngredientAmount(recipe: Recipe, ingredient: Ingredient, peopleCount: number) {
  const amount = getScaledIngredientAmount(recipe, peopleCount, ingredient.amount);
  const normalizedUnit = ingredient.unit.trim().toLocaleLowerCase("de-DE");

  if ((normalizedUnit === "stk" || normalizedUnit === "stück") && normalizeIngredientName(ingredient.name) === "ei") {
    return `${formatShoppingQuantity(amount, "")} ${amount === 1 ? "Ei" : "Eier"}`.trim();
  }

  if (normalizedUnit === "stk" || normalizedUnit === "stück") {
    return `${formatShoppingQuantity(amount, "")} ${ingredient.name}`.trim();
  }

  return `${formatShoppingQuantity(amount, ingredient.unit)} ${ingredient.name}`.trim();
}

function renderIngredientReference(recipe: Recipe, ingredient: Ingredient, peopleCount: number) {
  return formatIngredientAmount(recipe, ingredient, peopleCount);
}

function joinIngredientReferences(recipe: Recipe, ingredients: Ingredient[], peopleCount: number) {
  const references = ingredients.map((ingredient) => renderIngredientReference(recipe, ingredient, peopleCount));

  if (references.length <= 1) {
    return references[0] ?? "";
  }

  return `${references.slice(0, -1).join(", ")} und ${references.at(-1)}`;
}

function joinIngredientReferencesWithCommas(recipe: Recipe, ingredients: Ingredient[], peopleCount: number) {
  return ingredients.map((ingredient) => renderIngredientReference(recipe, ingredient, peopleCount)).join(", ");
}

function ingredientAliases(ingredient: Ingredient) {
  const aliases = new Set([ingredient.name]);
  const words = ingredient.name.split(/\s+/).filter(Boolean);
  const withoutAdjectives = words.filter((word) => !ingredientAdjectives.has(normalizeIngredientName(word)));

  if (withoutAdjectives.length > 0 && withoutAdjectives.length < words.length) {
    aliases.add(withoutAdjectives.join(" "));
  }

  for (const segment of ingredient.name.split(/[-/]/).map((part) => part.trim()).filter(Boolean)) {
    if (segment.length >= 4) {
      aliases.add(segment);
    }
  }

  for (const [suffix, replacement] of [
    ["brust", ""],
    ["filet", ""],
    ["hack", "hack"],
    ["steak", "Steak"],
  ] as const) {
    const normalizedName = normalizeIngredientName(ingredient.name);
    if (normalizedName.endsWith(suffix) && ingredient.name.length > suffix.length + 2) {
      const stem = ingredient.name.slice(0, -suffix.length).trim();
      if (stem) {
        aliases.add(replacement ? `${stem}${replacement}` : stem);
      }
      if (replacement && replacement !== suffix) {
        aliases.add(replacement);
      }
    }
  }

  if (normalizeIngredientName(ingredient.name).includes("lachs")) {
    aliases.add("Lachs");
  }

  if (normalizeIngredientName(ingredient.name).includes("bohnen")) {
    aliases.add("Bohnen");
  }

  if (normalizeIngredientName(ingredient.name).includes("tomaten")) {
    aliases.add("Tomaten");
  }

  if (normalizeIngredientName(ingredient.name).includes("riegel")) {
    aliases.add("Riegel");
  }

  if (normalizeIngredientName(ingredient.name).endsWith("hack")) {
    aliases.add("Hackfleisch");
  }

  if (normalizeIngredientName(ingredient.name).endsWith("öl")) {
    aliases.add("Öl");
  }

  if (normalizeIngredientName(ingredient.name).endsWith("mix")) {
    aliases.add(ingredient.name.slice(0, ingredient.name.length - "mix".length));
  }

  return Array.from(aliases).sort((left, right) => right.length - left.length);
}

function renderExplicitPlaceholders(recipe: Recipe, instruction: string, peopleCount: number) {
  return instruction.replace(ingredientPlaceholderPattern, (_match, ingredientName: string) => {
    const ingredient = findIngredient(recipe, ingredientName);
    return ingredient ? renderIngredientReference(recipe, ingredient, peopleCount) : ingredientName.trim();
  });
}

function renderImplicitIngredientAmounts(recipe: Recipe, instruction: string, peopleCount: number) {
  let renderedInstruction = instruction;

  if (/^Alle Zutaten\b/i.test(renderedInstruction)) {
    return renderedInstruction.replace(
      /^Alle Zutaten\b/i,
      joinIngredientReferences(recipe, recipe.ingredients, peopleCount),
    );
  }

  for (const ingredient of [...recipe.ingredients].sort((left, right) => right.name.length - left.name.length)) {
    const alias = ingredientAliases(ingredient).find((candidate) => {
      const pattern = ingredientAliasPattern(candidate);
      return pattern.test(renderedInstruction);
    });

    if (!alias) {
      continue;
    }

    const pattern = ingredientAliasPattern(alias);
    renderedInstruction = renderedInstruction.replace(pattern, renderIngredientReference(recipe, ingredient, peopleCount));
  }

  renderedInstruction = renderIngredientGroup(renderedInstruction, "Gemüse", recipe, peopleCount, (ingredient) =>
    ingredient.category === "Gemüse und Obst",
  );
  renderedInstruction = renderIngredientGroup(renderedInstruction, "Kräuter", recipe, peopleCount, (ingredient) =>
    ["Basilikum", "Petersilie", "Minze", "Schnittlauch", "Estragon"].includes(ingredient.name),
  );

  return renderedInstruction;
}

function ingredientAliasPattern(alias: string) {
  const escapedName = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const optionalSmallAmountPrefix = normalizeIngredientName(alias) === "öl" ? "(?:wenig\\s+|etwas\\s+)?" : "";
  return new RegExp(`(?<![\\p{L}\\p{N}])${optionalSmallAmountPrefix}${escapedName}(?![\\p{L}\\p{N}])`, "iu");
}

function renderIngredientGroup(
  instruction: string,
  groupName: string,
  recipe: Recipe,
  peopleCount: number,
  predicate: (ingredient: Ingredient) => boolean,
) {
  const pattern = ingredientAliasPattern(groupName);

  if (!pattern.test(instruction)) {
    return instruction;
  }

  const matchingIngredients = recipe.ingredients.filter(predicate);

  if (matchingIngredients.length === 0) {
    return instruction;
  }

  const escapedGroupName = groupName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const beforeAndPattern = new RegExp(
    `(?<![\\p{L}\\p{N}])${escapedGroupName}\\s+und\\s+`,
    "iu",
  );

  if (beforeAndPattern.test(instruction)) {
    return instruction.replace(
      beforeAndPattern,
      `${joinIngredientReferencesWithCommas(recipe, matchingIngredients, peopleCount)} und `,
    );
  }

  return instruction.replace(pattern, joinIngredientReferences(recipe, matchingIngredients, peopleCount));
}

export function renderRecipeInstruction(recipe: Recipe, instruction: string, peopleCount: number) {
  if (ingredientPlaceholderPattern.test(instruction)) {
    ingredientPlaceholderPattern.lastIndex = 0;
    return renderExplicitPlaceholders(recipe, instruction, peopleCount);
  }

  ingredientPlaceholderPattern.lastIndex = 0;
  const withExplicitAmounts = renderExplicitPlaceholders(recipe, instruction, peopleCount);
  return renderImplicitIngredientAmounts(recipe, withExplicitAmounts, peopleCount);
}

export function renderRecipeInstructions(recipe: Recipe, peopleCount = recipe.baseServings ?? 1) {
  return recipe.instructions.map((instruction) => renderRecipeInstruction(recipe, instruction, peopleCount));
}

function addChip(chips: RecipeInstructionChip[], chip: RecipeInstructionChip) {
  if (!chips.some((currentChip) => currentChip.kind === chip.kind && currentChip.label === chip.label)) {
    chips.push(chip);
  }
}

function timeChipForInstruction(instruction: string): RecipeInstructionChip | null {
  const explicitTime = instruction.match(/\b\d+(?:[-–]\d+)?\s*(?:Min\.?|Minuten|Std\.?|Stunden)\b/i)?.[0];

  if (explicitTime) {
    return { kind: "time", icon: "⏱", label: explicitTime.replace(/\s+/g, " ") };
  }

  const lowerInstruction = instruction.toLocaleLowerCase("de-DE");

  if (lowerInstruction.includes("kurz")) {
    if (lowerInstruction.includes("anbraten") || lowerInstruction.includes("braten") || lowerInstruction.includes("rösten")) {
      return { kind: "time", icon: "⏱", label: "ca. 2-3 Min." };
    }

    if (lowerInstruction.includes("unterheben") || lowerInstruction.includes("erwärmen")) {
      return { kind: "time", icon: "⏱", label: "ca. 1-2 Min." };
    }

    return { kind: "time", icon: "⏱", label: "ca. 2 Min." };
  }

  if (lowerInstruction.includes("quellen lassen")) {
    return { kind: "time", icon: "⏱", label: "ca. 10 Min. quellen" };
  }

  if (lowerInstruction.includes("abkühlen")) {
    return { kind: "time", icon: "⏱", label: "ca. 10 Min. abkühlen" };
  }

  if (lowerInstruction.includes("ruhen lassen") || lowerInstruction.includes("ziehen lassen")) {
    return { kind: "time", icon: "⏱", label: "ca. 5 Min. ruhen" };
  }

  return null;
}

function textureChipForInstruction(lowerInstruction: string): RecipeInstructionChip | null {
  const textureLabels: Array<[string, string]> = [
    ["goldbraun", "bis goldbraun"],
    ["knusprig", "bis knusprig"],
    ["bissfest", "bis bissfest"],
    ["gestockt", "bis gestockt"],
    ["cremig", "cremig halten"],
    ["weich", "bis weich"],
    ["rosa", "bis rosa"],
  ];

  const textureLabel = textureLabels.find(([keyword]) => lowerInstruction.includes(keyword))?.[1];
  return textureLabel ? { kind: "texture", icon: "✓", label: textureLabel } : null;
}

function chipsForInstruction(instruction: string): RecipeInstructionChip[] {
  const lowerInstruction = instruction.toLocaleLowerCase("de-DE");
  const chips: RecipeInstructionChip[] = [];
  const timeChip = timeChipForInstruction(instruction);

  if (timeChip) {
    addChip(chips, timeChip);
  }

  if (
    lowerInstruction.includes("pfanne") ||
    lowerInstruction.includes("anbraten") ||
    lowerInstruction.includes("braten") ||
    lowerInstruction.includes("rösten")
  ) {
    addChip(chips, { kind: "equipment", icon: "🍳", label: "Pfanne" });
  } else if (
    lowerInstruction.includes("ofen") ||
    lowerInstruction.includes("backen") ||
    lowerInstruction.includes("blech") ||
    lowerInstruction.includes("form")
  ) {
    addChip(chips, { kind: "equipment", icon: "♨", label: "Ofen" });
  } else if (
    lowerInstruction.includes("topf") ||
    lowerInstruction.includes("kochen") ||
    lowerInstruction.includes("köcheln")
  ) {
    addChip(chips, { kind: "equipment", icon: "🍲", label: "Topf" });
  } else if (
    lowerInstruction.includes("schale") ||
    lowerInstruction.includes("schüssel") ||
    lowerInstruction.includes("vermengen") ||
    lowerInstruction.includes("verrühren")
  ) {
    addChip(chips, { kind: "equipment", icon: "🥣", label: "Schüssel" });
  }

  if (lowerInstruction.includes("mittlerer hitze") || lowerInstruction.includes("mittlere hitze")) {
    addChip(chips, { kind: "heat", icon: "🔥", label: "mittlere Hitze" });
  } else if (lowerInstruction.includes("starke hitze") || lowerInstruction.includes("hohe hitze")) {
    addChip(chips, { kind: "heat", icon: "🔥", label: "hohe Hitze" });
  } else if (lowerInstruction.includes("sanft") || lowerInstruction.includes("niedrig")) {
    addChip(chips, { kind: "heat", icon: "🔥", label: "sanft" });
  }

  const textureChip = textureChipForInstruction(lowerInstruction);

  if (textureChip) {
    addChip(chips, textureChip);
  }

  if (
    lowerInstruction.includes("schneiden") ||
    lowerInstruction.includes("würfeln") ||
    lowerInstruction.includes("halbieren") ||
    lowerInstruction.includes("raspeln") ||
    lowerInstruction.includes("zupfen")
  ) {
    addChip(chips, { kind: "cutting", icon: "🔪", label: "Schneiden" });
  }

  return chips;
}

export function renderRecipeInstructionDetails(recipe: Recipe, peopleCount = recipe.baseServings ?? 1) {
  return recipe.instructions.map<RenderedRecipeInstruction>((instruction) => {
    const text = renderRecipeInstruction(recipe, instruction, peopleCount);
    return {
      text,
      chips: chipsForInstruction(text),
    };
  });
}

export function findUnknownInstructionIngredientReferences(recipe: Recipe) {
  const unknownReferences = new Set<string>();

  for (const instruction of recipe.instructions) {
    for (const match of instruction.matchAll(ingredientPlaceholderPattern)) {
      const ingredientName = match[1].trim();
      if (!findIngredient(recipe, ingredientName)) {
        unknownReferences.add(ingredientName);
      }
    }
  }

  return Array.from(unknownReferences).sort((left, right) => left.localeCompare(right, "de-DE"));
}
