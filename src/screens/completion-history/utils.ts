import {
  format,
  isSameYear,
  isToday,
  isValid,
  isYesterday,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { MaintenanceTask } from "../../types/maintenance";

export type HistoryLookback = 30 | 90 | "all";

export interface CompletionDaySection {
  key: string;
  title: string;
  data: MaintenanceTask[];
}

function toLocalDate(dateString: string): Date {
  const parsed = parseISO(dateString);
  if (isValid(parsed)) return parsed;
  return new Date(dateString);
}

function historyDatePattern(date: Date, referenceDate: Date): string {
  if (isSameYear(date, referenceDate)) {
    return "EEE, MMM d";
  }
  return "EEE, MMM d, yyyy";
}

function completionTimestamp(task: MaintenanceTask): number {
  const raw = task.completed_at || task.due_date;
  const time = toLocalDate(raw).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function dayKey(task: MaintenanceTask): string {
  const raw = task.completed_at || task.due_date;
  const date = toLocalDate(raw);
  if (!isValid(date)) return "unknown";
  return format(date, "yyyy-MM-dd");
}

function daySectionTitle(key: string, referenceDate: Date): string {
  if (key === "unknown") return "Unknown date";
  const date = parseISO(key);
  if (!isValid(date)) return "Unknown date";
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, historyDatePattern(date, referenceDate));
}

export function filterCompletionsByLookback(
  tasks: MaintenanceTask[],
  lookback: HistoryLookback
): MaintenanceTask[] {
  if (lookback === "all") return tasks;
  const cutoff = subDays(startOfDay(new Date()), lookback);
  return tasks.filter((task) => {
    const date = toLocalDate(task.completed_at || task.due_date);
    return isValid(date) && date >= cutoff;
  });
}

export function groupCompletionsByDay(
  tasks: MaintenanceTask[]
): CompletionDaySection[] {
  const sorted = [...tasks].sort(
    (a, b) => completionTimestamp(b) - completionTimestamp(a)
  );
  const byDay = new Map<string, MaintenanceTask[]>();

  for (const task of sorted) {
    const key = dayKey(task);
    const list = byDay.get(key);
    if (list) {
      list.push(task);
    } else {
      byDay.set(key, [task]);
    }
  }

  const now = new Date();
  return Array.from(byDay.entries()).map(([key, data]) => ({
    key,
    title: daySectionTitle(key, now),
    data,
  }));
}

export const formatDate = (dateString: string) => {
  const date = toLocalDate(dateString);
  if (!isValid(date)) return "—";
  return format(date, historyDatePattern(date, new Date()));
};

export const formatDateTime = (dateString: string) => {
  const date = toLocalDate(dateString);
  if (!isValid(date)) return "—";
  const base = historyDatePattern(date, new Date());
  return format(date, `${base} · h:mm a`);
};

export const formatCompletionTime = (dateString: string) => {
  const date = toLocalDate(dateString);
  if (!isValid(date)) return "—";
  return format(date, "h:mm a");
};
