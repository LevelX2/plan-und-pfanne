import { parseIsoDate } from "@/lib/date";
import type { MealType } from "@/lib/types";

export function formatPercent(value: number) {
  return `${Math.round(value)} %`;
}

export function formatCalories(value: number) {
  return `${Math.round(value)} kcal`;
}

export function formatGrams(value: number) {
  return `${Math.round(value)} g`;
}

export function formatDateGerman(isoDate: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseIsoDate(isoDate));
}

export function formatWeekdayLong(isoDate: string, capitalized = false) {
  const label = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    timeZone: "UTC",
  }).format(parseIsoDate(isoDate));

  if (!capitalized) {
    return label;
  }

  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });

  return `${formatter.format(parseIsoDate(startDate))} - ${formatter.format(parseIsoDate(endDate))}`;
}

export function formatMealType(mealType: MealType) {
  switch (mealType) {
    case "breakfast":
      return "Frühstück";
    case "lunch":
      return "Mittagessen";
    case "dinner":
      return "Abendessen";
    case "snack":
      return "Snack";
  }
}

export function qualityLabel(score: number) {
  if (score <= 38) {
    return "sehr passend";
  }

  if (score <= 55) {
    return "stabil";
  }

  if (score <= 72) {
    return "okay";
  }

  return "optimierbar";
}

export function formatShoppingQuantity(amount: number, unit: string) {
  const value = Number.isInteger(amount) ? amount.toString() : amount.toFixed(1);
  return `${value} ${unit}`.trim();
}

const wholeShoppingUnits = new Set([
  "stk",
  "stück",
  "stueck",
  "zehe",
  "zehen",
  "bund",
  "packung",
  "packungen",
]);

const spoonShoppingUnits = new Set(["tl", "el"]);
const pinchShoppingUnits = new Set(["prise", "prisen"]);
const gramLikeUnits = new Set(["g", "ml"]);

function formatGermanNumber(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(amount);
}

function roundUpToStep(amount: number, step: number) {
  return Math.ceil(amount / step) * step;
}

function roundShoppingListAmount(amount: number, unit: string) {
  const normalizedUnit = unit.trim().toLowerCase();

  if (wholeShoppingUnits.has(normalizedUnit)) {
    return Math.ceil(amount);
  }

  if (pinchShoppingUnits.has(normalizedUnit)) {
    return Math.max(1, Math.ceil(amount));
  }

  if (spoonShoppingUnits.has(normalizedUnit)) {
    return roundUpToStep(amount, 0.25);
  }

  if (gramLikeUnits.has(normalizedUnit)) {
    if (amount <= 50) {
      return roundUpToStep(amount, 5);
    }

    if (amount <= 250) {
      return roundUpToStep(amount, 10);
    }

    if (amount <= 1000) {
      return roundUpToStep(amount, 25);
    }

    return roundUpToStep(amount, 50);
  }

  return roundUpToStep(amount, 0.5);
}

export function formatShoppingListQuantity(amount: number, unit: string) {
  const roundedAmount = roundShoppingListAmount(amount, unit);
  const roundedLabel = `${formatGermanNumber(roundedAmount)} ${unit}`.trim();
  const exactLabel = `${formatGermanNumber(amount)} ${unit}`.trim();

  if (roundedAmount === amount) {
    return roundedLabel;
  }

  return `${roundedLabel} (${exactLabel})`;
}

export function describeMealPlanMode(mealsPerDay: number) {
  return mealsPerDay >= 4 ? "mit Snack-Fenster" : "ohne Snack";
}
