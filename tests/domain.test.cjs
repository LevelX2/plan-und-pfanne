/* eslint-disable @typescript-eslint/no-require-imports */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(projectRoot, "src");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      path.join(srcRoot, request.slice(2)),
      parent,
      isMain,
      options,
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

function registerTypeScriptExtension(extension) {
  require.extensions[extension] = (module, filename) => {
    const source = fs.readFileSync(filename, "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
      fileName: filename,
    });

    module._compile(output.outputText, filename);
  };
}

registerTypeScriptExtension(".ts");
registerTypeScriptExtension(".tsx");

const { addDays, listDatesInRange } = require("../src/lib/date.ts");
const {
  averageActiveProteinTargetGrams,
  normalizeProteinTargets,
  proteinGramsForPerson,
} = require("../src/lib/protein-targets.ts");
const { calculateTargets, evaluateMeals, multiplyRecipe } = require("../src/lib/planner.ts");
const { seedRecipes } = require("../src/lib/data/seed-recipes.ts");
const {
  findUnknownInstructionIngredientReferences,
  renderRecipeInstructionDetails,
  renderRecipeInstructions,
} = require("../src/lib/recipe-instructions.ts");
const { buildShoppingListGroupsForPlannedDays } = require("../src/lib/week-plan-selection.ts");

function settings(overrides = {}) {
  return {
    calorieTarget: 2000,
    macroCarbsPct: 30,
    macroFatPct: 30,
    macroProteinPct: 40,
    defaultPeopleCount: 2,
    proteinTargets: [
      { id: "person-1", label: "Person 1", bodyWeightKg: 70, proteinGPerKg: 2 },
      { id: "person-2", label: "Person 2", bodyWeightKg: 90, proteinGPerKg: 1.8 },
    ],
    includeSnackByDefault: true,
    mealsPerDay: 4,
    glutenFreeOnly: true,
    vegetarianSharePct: 40,
    fishSharePct: 20,
    meatSharePct: 40,
    excludedIngredients: [],
    maxRecipeRepeatsPerWeek: 2,
    ...overrides,
  };
}

function recipe(overrides = {}) {
  return {
    id: "recipe-a",
    name: "Testrezept",
    description: "Test",
    mealType: "lunch",
    glutenFree: true,
    vegetarian: false,
    prepTimeMinutes: 20,
    calories: 500,
    proteinG: 50,
    carbsG: 40,
    fatG: 20,
    baseServings: 2,
    ingredients: [],
    instructions: ["Zubereiten."],
    tags: [],
    proteinSource: "Fleisch",
    ...overrides,
  };
}

test("date helpers keep inclusive ranges and reject invalid ranges", () => {
  assert.equal(addDays("2026-04-24", 1), "2026-04-25");
  assert.deepEqual(listDatesInRange("2026-04-24", "2026-04-26"), [
    "2026-04-24",
    "2026-04-25",
    "2026-04-26",
  ]);
  assert.deepEqual(listDatesInRange("2026-04-26", "2026-04-24"), []);
});

test("protein targets are calculated from body weight and grams per kilogram", () => {
  const targets = normalizeProteinTargets(
    [
      { id: "p1", label: "Person 1", bodyWeightKg: 72.5, proteinGPerKg: 2 },
      { id: "p2", label: "Person 2", bodyWeightKg: 83, proteinGPerKg: 1.6 },
    ],
    2,
  );

  assert.equal(proteinGramsForPerson(targets[0]), 145);
  assert.equal(averageActiveProteinTargetGrams(settings({ proteinTargets: targets })), 138.9);
});

test("daily targets use the active per-person protein average", () => {
  const targets = calculateTargets(settings());

  assert.equal(targets.protein, 151);
  assert.equal(targets.carbs, 150);
  assert.equal(targets.fat, 66.7);
  assert.equal(targets.macroPercents.protein, 40);
});

test("disabled meals are excluded from day evaluation", () => {
  const activeRecipe = recipe({ id: "active", calories: 400, proteinG: 40, carbsG: 30, fatG: 15 });
  const disabledRecipe = recipe({ id: "disabled", calories: 900, proteinG: 90, carbsG: 80, fatG: 35 });
  const evaluation = evaluateMeals(
    [
      {
        mealType: "lunch",
        portionFactor: 1,
        recipe: activeRecipe,
        calculated: multiplyRecipe(activeRecipe),
        isEnabled: true,
      },
      {
        mealType: "dinner",
        portionFactor: 1,
        recipe: disabledRecipe,
        calculated: multiplyRecipe(disabledRecipe),
        isEnabled: false,
      },
    ],
    settings(),
  );

  assert.deepEqual(evaluation.totals, {
    calories: 400,
    protein: 40,
    carbs: 30,
    fat: 15,
  });
});

test("planned-day shopping list scales people counts and normalizes eggs", () => {
  const eggRecipe = recipe({
    baseServings: 2,
    ingredients: [
      { category: "Eier", name: "Ei", amount: 1, unit: "Stk" },
      { category: "Eier", name: "Eier", amount: 2, unit: "Stk" },
      { category: "Eier", name: "Eiweiß", amount: 60, unit: "g" },
      { category: "Milchprodukte", name: "Quark", amount: 100, unit: "g" },
    ],
  });
  const disabledRecipe = recipe({
    id: "disabled",
    ingredients: [{ category: "Eier", name: "Eier", amount: 99, unit: "Stk" }],
  });
  const excludedRecipe = recipe({
    id: "excluded",
    ingredients: [{ category: "Milchprodukte", name: "Joghurt", amount: 500, unit: "g" }],
  });
  const groups = buildShoppingListGroupsForPlannedDays([
    {
      date: "2026-04-24",
      weekdayLabel: "Freitag",
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      targets: calculateTargets(settings()),
      macroPercents: { protein: 0, carbs: 0, fat: 0 },
      score: 0,
      withinTolerance: false,
      meals: [
        {
          mealType: "breakfast",
          portionFactor: 1,
          recipe: eggRecipe,
          calculated: multiplyRecipe(eggRecipe),
          peopleCount: 4,
          isEnabled: true,
          includeInShoppingList: true,
        },
        {
          mealType: "lunch",
          portionFactor: 1,
          recipe: disabledRecipe,
          calculated: multiplyRecipe(disabledRecipe),
          peopleCount: 4,
          isEnabled: false,
          includeInShoppingList: true,
        },
        {
          mealType: "dinner",
          portionFactor: 1,
          recipe: excludedRecipe,
          calculated: multiplyRecipe(excludedRecipe),
          peopleCount: 4,
          isEnabled: true,
          includeInShoppingList: false,
        },
      ],
    },
  ]);

  const eggGroup = groups.find((group) => group.category === "Eier");
  const dairyGroup = groups.find((group) => group.category === "Milchprodukte");

  assert.equal(eggGroup.items.length, 1);
  assert.deepEqual(eggGroup.items[0], { name: "Eier", unit: "Stk", totalAmount: 10 });
  assert.deepEqual(dairyGroup.items[0], { name: "Quark", unit: "g", totalAmount: 200 });
});

test("recipe instruction renderer scales ingredient quantities and reports unknown references", () => {
  const omelet = recipe({
    baseServings: 1,
    ingredients: [
      { category: "Eier", name: "Eier", amount: 3, unit: "Stk" },
      { category: "Eier", name: "Eiweiß", amount: 120, unit: "g" },
      { category: "Milchprodukte", name: "Feta", amount: 50, unit: "g" },
    ],
    instructions: [
      "{{Eier}} und {{Eiweiß}} verquirlen.",
      "Mit {{Feta}} bestreuen.",
      "{{Nicht vorhanden}} später ergänzen.",
    ],
  });

  assert.deepEqual(renderRecipeInstructions(omelet, 2), [
    "6 Eier und 240 g Eiweiß verquirlen.",
    "Mit 100 g Feta bestreuen.",
    "Nicht vorhanden später ergänzen.",
  ]);
  assert.deepEqual(findUnknownInstructionIngredientReferences(omelet), ["Nicht vorhanden"]);
});

test("recipe instruction details expose practical step chips", () => {
  const panRecipe = recipe({
    baseServings: 1,
    ingredients: [{ category: "Gemüse und Obst", name: "Spinat", amount: 80, unit: "g" }],
    instructions: ["Spinat in der Pfanne bei mittlerer Hitze kurz anbraten, bis er weich ist."],
  });

  const [step] = renderRecipeInstructionDetails(panRecipe, 2);

  assert.equal(step.text, "160 g Spinat in der Pfanne bei mittlerer Hitze kurz anbraten, bis er weich ist.");
  assert.deepEqual(
    step.chips.map((chip) => chip.label),
    ["ca. 2-3 Min.", "Pfanne", "mittlere Hitze", "bis weich"],
  );
});

test("seed recipe pool contains additional recipes and recipe-specific preparation steps", () => {
  assert.equal(seedRecipes.length, 94);

  const recipeCounts = seedRecipes.reduce((counts, currentRecipe) => {
    counts[currentRecipe.mealType] += 1;
    return counts;
  }, { breakfast: 0, lunch: 0, dinner: 0, snack: 0 });

  assert.deepEqual(recipeCounts, {
    breakfast: 22,
    lunch: 24,
    dinner: 25,
    snack: 23,
  });

  for (const currentRecipe of seedRecipes) {
    const renderedInstructions = renderRecipeInstructions(currentRecipe, 2);

    assert.equal(currentRecipe.instructions[0].startsWith("Vorbereitung:"), false, currentRecipe.id);
    assert.equal(currentRecipe.instructions.at(-1).startsWith("Abschluss:"), false, currentRecipe.id);
    assert.equal(currentRecipe.instructions.length >= 2, true, currentRecipe.id);
    assert.deepEqual(findUnknownInstructionIngredientReferences(currentRecipe), [], currentRecipe.id);
    assert.equal(renderedInstructions.some((instruction) => instruction.includes("{{")), false, currentRecipe.id);
    assert.match(renderedInstructions.join(" "), /\d/, currentRecipe.id);
  }
});
