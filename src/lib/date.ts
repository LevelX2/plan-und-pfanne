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
