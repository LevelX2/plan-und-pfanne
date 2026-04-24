const BERLIN_TIME_ZONE = "Europe/Berlin";

function berlinParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BERLIN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return { year, month, day };
}

export function todayInBerlinIso() {
  const { year, month, day } = berlinParts(new Date());
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, amount: number) {
  const date = parseIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatIsoDate(date);
}

export function tomorrowInBerlinIso() {
  return addDays(todayInBerlinIso(), 1);
}

export function isIsoDate(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function compareIsoDates(left: string, right: string) {
  return left.localeCompare(right);
}

export function listDatesInRange(startDate: string, endDate: string) {
  if (!isIsoDate(startDate) || !isIsoDate(endDate) || startDate > endDate) {
    return [];
  }

  const dates: string[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return dates;
}

export function startOfWeekMonday(isoDate: string) {
  const date = parseIsoDate(isoDate);
  const weekday = date.getUTCDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  return addDays(isoDate, diff);
}

export function endOfWeekSunday(isoDate: string) {
  return addDays(startOfWeekMonday(isoDate), 6);
}

export function getCurrentWeekStart() {
  return startOfWeekMonday(todayInBerlinIso());
}

export function getNextWeekStartFromSunday(isoDate: string) {
  return addDays(startOfWeekMonday(isoDate), 7);
}

export function getWeekDates(startDate: string) {
  return Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
}

export function getWeekStartForDate(isoDate: string) {
  return startOfWeekMonday(isoDate);
}

export function isSunday(isoDate: string) {
  return parseIsoDate(isoDate).getUTCDay() === 0;
}
