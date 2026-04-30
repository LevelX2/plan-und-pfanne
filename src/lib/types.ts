export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type FrequencyWeight = "rare" | "normal" | "often";

export type RecipeMixCategory = "vegetarian" | "fish" | "meat";

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
  baseServings?: number;
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
  defaultPeopleCount: number;
  proteinTargets: ProteinTargetPerson[];
  includeSnackByDefault: boolean;
  mealsPerDay: number;
  glutenFreeOnly: boolean;
  vegetarianSharePct: number;
  fishSharePct: number;
  meatSharePct: number;
  excludedIngredients: string[];
  maxRecipeRepeatsPerWeek: number;
};

export type ProteinTargetPerson = {
  id: string;
  label: string;
  bodyWeightKg: number;
  proteinGPerKg: number;
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

export type MealTypeDefinition = {
  id: string;
  key: MealType;
  label: string;
  sortOrder: number;
};

export type RecipeMealTypeDefaultAssignment = {
  id: string;
  recipeId: string;
  mealType: MealType;
  defaultEnabled: boolean;
};

export type RecipeMealTypePreference = {
  id: string;
  recipeId: string;
  mealType: MealType;
  enabledForPlanning: boolean;
  frequencyWeight: FrequencyWeight;
  updatedAt: string;
};

export type RecipeFavorite = {
  id: string;
  recipeId: string;
  isFavorite: boolean;
  updatedAt: string;
};

export type EffectiveRecipeMealTypePreference = {
  recipe: Recipe;
  mealType: MealType;
  defaultEnabled: boolean;
  enabledForPlanning: boolean;
  frequencyWeight: FrequencyWeight;
  updatedAt: string | null;
};

export type PlannedDaySourceType = "generated" | "copied" | "manual";

export type PlannedMeal = {
  id?: string;
  plannedDayId?: string;
  date?: string;
  mealType: MealType;
  portionFactor: number;
  recipe: Recipe;
  calculated: MacroTotals;
  peopleCount?: number;
  isEnabled?: boolean;
  includeInShoppingList?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type DayPlan = {
  id?: string;
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
  sourceType?: PlannedDaySourceType;
  sourcePeriodStart?: string;
  sourcePeriodEnd?: string;
  copiedFromStart?: string | null;
  copiedFromEnd?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type WeekPlan = {
  startDate: string;
  endDate: string;
  generatedAt: string;
  averageScore: number;
  averageProteinPct: number;
  averageCarbsPct: number;
  averageFatPct: number;
  days: DayPlan[];
};

export type PlanRange = WeekPlan;

export type PlannedDayRecord = {
  id: string;
  date: string;
  sourceType: PlannedDaySourceType;
  sourcePeriodStart: string;
  sourcePeriodEnd: string;
  copiedFromStart: string | null;
  copiedFromEnd: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlannedMealRecord = {
  id: string;
  plannedDayId: string;
  date: string;
  mealType: MealType;
  recipeId: string;
  peopleCount: number;
  isEnabled: boolean;
  includeInShoppingList: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
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
