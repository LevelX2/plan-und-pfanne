export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type ShoppingCategory =
  | "Gemüse und Obst"
  | "Milchprodukte"
  | "Fleisch und Fisch"
  | "Eier"
  | "Vorrat und Trockenware"
  | "Gewürze und Sonstiges";

export type Ingredient = {
  name: string;
  amount: number;
  unit: string;
  category: ShoppingCategory;
};

export type Recipe = {
  id: string;
  name: string;
  description: string;
  mealType: MealType;
  glutenFree: boolean;
  vegetarian: boolean;
  prepTimeMinutes: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
  proteinSource: string;
};

export type UserSettings = {
  calorieTarget: number;
  macroCarbsPct: number;
  macroFatPct: number;
  macroProteinPct: number;
  mealsPerDay: number;
  glutenFreeOnly: boolean;
  vegetarian: boolean;
  reduceMeat: boolean;
  excludedIngredients: string[];
  maxRecipeRepeatsPerWeek: number;
};

export type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DailyTargets = MacroTotals & {
  macroPercents: {
    protein: number;
    carbs: number;
    fat: number;
  };
};

export type PlannedMeal = {
  mealType: MealType;
  portionFactor: number;
  recipe: Recipe;
  calculated: MacroTotals;
};

export type DayPlan = {
  date: string;
  weekdayLabel: string;
  totals: MacroTotals;
  targets: DailyTargets;
  macroPercents: {
    protein: number;
    carbs: number;
    fat: number;
  };
  score: number;
  withinTolerance: boolean;
  meals: PlannedMeal[];
};

export type WeekPlan = {
  startDate: string;
  endDate: string;
  averageScore: number;
  averageProteinPct: number;
  averageCarbsPct: number;
  averageFatPct: number;
  days: DayPlan[];
};

export type ShoppingListItem = {
  name: string;
  unit: string;
  totalAmount: number;
};

export type ShoppingGroup = {
  category: ShoppingCategory;
  items: ShoppingListItem[];
};
