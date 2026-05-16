export const OVERDUE_LOOKBACK_DAYS = 14;

export interface LocalParts {
  hour: number;
  weekday: number;
  localDate: string;
  weekStart: string;
}

export function tzStartOfDay(d: Date, timeZone: string): Date {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    f.formatToParts(d).map((p) => [p.type, p.value])
  );
  return new Date(
    Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day))
  );
}

export function addUtcDays(d: Date, days: number): Date {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function formatLocalDate(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function getLocalParts(now: Date, timeZone: string): LocalParts {
  const localDate = formatLocalDate(now, timeZone);
  const hour = parseInt(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "numeric",
      hour12: false,
    }).format(now),
    10
  );

  const weekdayShort = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(now);
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const weekday = weekdayMap[weekdayShort] ?? 0;

  const todayStart = tzStartOfDay(now, timeZone);
  const mondayOffset = weekday === 0 ? 6 : weekday - 1;
  const weekStart = formatLocalDate(
    addUtcDays(todayStart, -mondayOffset),
    timeZone
  );

  return { hour, weekday, localDate, weekStart };
}

export function isBetweenDaysInTz(
  dueIso: string,
  startInclusive: Date,
  endExclusive: Date,
  tz: string
): boolean {
  const dd = tzStartOfDay(new Date(dueIso), tz).getTime();
  return dd >= startInclusive.getTime() && dd < endExclusive.getTime();
}
