import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";

const TREND_KEY = "@homekeep/upkeep_trend";
const MAX_WEEKS = 12;
const TREND_WINDOW_DAYS = 28;

export interface UpkeepTrendEntry {
  /** yyyy-MM-dd of the week's Monday. */
  weekStart: string;
  score: number;
}

export async function loadUpkeepTrend(): Promise<UpkeepTrendEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(TREND_KEY);
    const parsed = raw ? (JSON.parse(raw) as UpkeepTrendEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Keeps the first score seen each week; later launches that week are ignored. */
export async function recordWeeklyUpkeep(
  score: number,
  now: Date = new Date()
): Promise<UpkeepTrendEntry[]> {
  const history = await loadUpkeepTrend();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  if (history.some((entry) => entry.weekStart === weekStart)) return history;
  const next = [...history, { weekStart, score }].slice(-MAX_WEEKS);
  await AsyncStorage.setItem(TREND_KEY, JSON.stringify(next));
  return next;
}

/** Change against the score ~4 weeks ago; null until that much history exists. */
export function upkeepTrendDelta(
  history: UpkeepTrendEntry[],
  currentScore: number,
  now: Date = new Date()
): number | null {
  const baseline = [...history]
    .filter(
      (entry) =>
        differenceInCalendarDays(now, parseISO(entry.weekStart)) >=
        TREND_WINDOW_DAYS
    )
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0];
  return baseline ? currentScore - baseline.score : null;
}

export function formatUpkeepTrend(delta: number): string {
  if (delta === 0) return "Steady this month";
  return `${delta > 0 ? "+" : "−"}${Math.abs(delta)} this month`;
}
