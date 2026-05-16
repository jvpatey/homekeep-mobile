import {
  format,
  isToday,
  isTomorrow,
  isSameYear,
  isValid,
  parseISO,
} from "date-fns";

const INVALID_LABEL = "—";

function toDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  const parsed = parseISO(value);
  if (isValid(parsed)) return parsed;
  const fallback = new Date(value);
  return fallback;
}

function assertValid(date: Date): boolean {
  return isValid(date) && !Number.isNaN(date.getTime());
}

/** Compact due label: Today, Tomorrow, Mar 15, or Mar 15, 2027 */
export function formatTaskDueDate(
  value: Date | string,
  referenceDate: Date = new Date()
): string {
  const date = toDate(value);
  if (!assertValid(date)) return INVALID_LABEL;

  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";

  if (isSameYear(date, referenceDate)) {
    return format(date, "MMM d");
  }
  return format(date, "MMM d, yyyy");
}

/** Schedule row footer: Due today, Due Mar 15, Due Mar 15, 2027 */
export function formatTaskDueLabel(
  value: Date | string,
  referenceDate: Date = new Date()
): string {
  const date = toDate(value);
  if (!assertValid(date)) return "Due —";

  if (isToday(date)) return "Due today";
  if (isTomorrow(date)) return "Due tomorrow";

  return `Due ${formatTaskDueDate(date, referenceDate)}`;
}

/** Section list title: Today, Monday, Mar 15, or Monday, Mar 15, 2027 */
export function formatTaskSectionHeading(
  date: Date,
  referenceDate: Date = new Date()
): string {
  if (!assertValid(date)) return INVALID_LABEL;

  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";

  if (isSameYear(date, referenceDate)) {
    return format(date, "EEEE, MMM d");
  }
  return format(date, "EEEE, MMM d, yyyy");
}

/** Month abbreviation for schedule date badge */
export function formatTaskSectionMonth(date: Date): string {
  if (!assertValid(date)) return "";
  return format(date, "MMM");
}

/** Year under badge when section is not in the current calendar year */
export function formatTaskSectionYear(
  date: Date,
  referenceDate: Date = new Date()
): string | null {
  if (!assertValid(date)) return null;
  if (isSameYear(date, referenceDate)) return null;
  return format(date, "yyyy");
}
