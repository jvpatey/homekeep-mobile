import { differenceInCalendarDays, startOfDay } from "date-fns";
import { MaintenanceTask } from "../types/maintenance";
import {
  HomeMapZone,
  HomeMapZoneId,
  taskMatchesZone,
} from "../data/homeMapZones";

export type ZoneHealthGrade = "good" | "fair" | "needs_attention";

export interface ZoneHealth {
  /** 0–100, or null when the zone has no recurring tasks. */
  score: number | null;
  grade: ZoneHealthGrade | null;
  routineCount: number;
  overdueCount: number;
  /** Routines not completed within their own interval. */
  staleCount: number;
  /** Stale routines that aren't also overdue (e.g. skipped repeatedly). */
  staleOnlyCount: number;
  /** Longest gap since a completion among stale-only routines, in days. */
  longestGapDays: number;
}

/** routine_id → latest completed_at (ISO). */
export type LastCompletionMap = Record<string, string>;

const OVERDUE_WEIGHT = 60;
const RECENCY_WEIGHT = 40;

const EMPTY: ZoneHealth = {
  score: null,
  grade: null,
  routineCount: 0,
  overdueCount: 0,
  staleCount: 0,
  staleOnlyCount: 0,
  longestGapDays: 0,
};

export function gradeForScore(score: number): ZoneHealthGrade {
  if (score >= 80) return "good";
  if (score >= 55) return "fair";
  return "needs_attention";
}

/** One open occurrence per recurring routine; repairs and one-offs drop out. */
function openRoutines(tasks: MaintenanceTask[]): MaintenanceTask[] {
  const byRoutine = new Map<string, MaintenanceTask>();
  for (const task of tasks) {
    if (task.is_completed || !(task.interval_days > 0)) continue;
    const existing = byRoutine.get(task.id);
    if (!existing || new Date(task.due_date) < new Date(existing.due_date)) {
      byRoutine.set(task.id, task);
    }
  }
  return Array.from(byRoutine.values());
}

/** A small grace period so a task done a few days late isn't flagged stale. */
function graceDays(intervalDays: number): number {
  return Math.max(3, Math.round(intervalDays * 0.1));
}

/** Overdue tasks weigh at least half, scaling to full weight as lateness approaches the interval. */
function overdueSeverity(task: MaintenanceTask, today: Date): number {
  const daysLate = differenceInCalendarDays(today, new Date(task.due_date));
  if (daysLate <= 0) return 0;
  const window = Math.min(task.interval_days, 90);
  return 0.5 + 0.5 * Math.min(1, daysLate / window);
}

export function computeZoneHealth(
  zone: HomeMapZone,
  tasks: MaintenanceTask[],
  lastCompletion: LastCompletionMap,
  now: Date = new Date()
): ZoneHealth {
  const today = startOfDay(now);
  const routines = openRoutines(tasks).filter((t) => taskMatchesZone(t, zone));
  if (routines.length === 0) return EMPTY;

  let severityTotal = 0;
  let overdueCount = 0;
  let staleCount = 0;
  let staleOnlyCount = 0;
  let longestGapDays = 0;
  for (const task of routines) {
    const severity = overdueSeverity(task, today);
    const overdue = severity > 0;
    if (overdue) overdueCount += 1;
    severityTotal += severity;

    const last = lastCompletion[task.id];
    const gap = last ? differenceInCalendarDays(today, new Date(last)) : null;
    const stale =
      gap === null
        ? overdue
        : gap > task.interval_days + graceDays(task.interval_days);
    if (!stale) continue;
    staleCount += 1;
    if (!overdue) {
      staleOnlyCount += 1;
      if (gap !== null) longestGapDays = Math.max(longestGapDays, gap);
    }
  }

  const n = routines.length;
  const penalty =
    OVERDUE_WEIGHT * (severityTotal / n) + RECENCY_WEIGHT * (staleCount / n);
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  return {
    score,
    grade: gradeForScore(score),
    routineCount: n,
    overdueCount,
    staleCount,
    staleOnlyCount,
    longestGapDays,
  };
}

export function computeAllZoneHealth(
  zones: HomeMapZone[],
  tasks: MaintenanceTask[],
  lastCompletion: LastCompletionMap,
  now: Date = new Date()
): Partial<Record<HomeMapZoneId, ZoneHealth>> {
  const result: Partial<Record<HomeMapZoneId, ZoneHealth>> = {};
  for (const zone of zones) {
    result[zone.id] = computeZoneHealth(zone, tasks, lastCompletion, now);
  }
  return result;
}

/** Routine-weighted average across zones that have tasks. */
export function overallHomeHealth(
  zoneHealth: Partial<Record<HomeMapZoneId, ZoneHealth>>
): { score: number; grade: ZoneHealthGrade } | null {
  let weighted = 0;
  let count = 0;
  for (const health of Object.values(zoneHealth)) {
    if (!health || health.score === null) continue;
    weighted += health.score * health.routineCount;
    count += health.routineCount;
  }
  if (count === 0) return null;
  const score = Math.round(weighted / count);
  return { score, grade: gradeForScore(score) };
}

/** e.g. "2 overdue · 1 not done in over a year". Null when nothing is wrong. */
export function zoneHealthReason(health: ZoneHealth): string | null {
  const parts: string[] = [];
  if (health.overdueCount > 0) parts.push(`${health.overdueCount} overdue`);
  if (health.staleOnlyCount > 0) {
    const gap = health.longestGapDays;
    const span =
      gap >= 365 ? "over a year" : gap >= 180 ? "6+ months" : "a while";
    parts.push(`${health.staleOnlyCount} not done in ${span}`);
  }
  return parts.length ? parts.join(" · ") : null;
}
