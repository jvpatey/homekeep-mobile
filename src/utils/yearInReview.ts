import { differenceInCalendarDays, startOfDay } from "date-fns";
import {
  MaintenanceCategory,
  MaintenanceTask,
  isRepairRoutine,
} from "../types/maintenance";
import { HomeMapZone, HomeMapZoneId, taskMatchesZone } from "../data/homeMapZones";
import { SpendYear, computeSpendLedger, spendForYear } from "./spendLedger";

export interface YearInReviewRank<K> {
  key: K;
  label: string;
  count: number;
}

export interface YearInReviewJob {
  title: string;
  date: Date;
}

export interface YearInReviewContributor {
  userId: string | null;
  name: string;
  count: number;
}

export interface YearInReview {
  year: number;
  jobsDone: number;
  /** Share of scheduled (non-repair) jobs finished by their due date, 0–1. Null with nothing scheduled. */
  onTimeRate: number | null;
  /** From each task's estimate; jobs without one don't count. */
  estimatedHours: number;
  repairsLogged: number;
  spend: SpendYear | null;
  topZones: YearInReviewRank<HomeMapZoneId>[];
  topCategories: YearInReviewRank<MaintenanceCategory>[];
  busiestMonth: { month: number; count: number } | null;
  /** Jobs per calendar month, Jan–Dec. */
  monthCounts: number[];
  contributors: YearInReviewContributor[];
  firstJob: YearInReviewJob | null;
  lastJob: YearInReviewJob | null;
  photoPaths: string[];
}

const MAX_RANKED = 3;
const MAX_PHOTOS = 3;

function completedOn(task: MaintenanceTask): Date | null {
  const raw = task.completed_at || task.due_date;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function rank<K>(
  counts: Map<K, number>,
  labelFor: (key: K) => string
): YearInReviewRank<K>[] {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_RANKED)
    .map(([key, count]) => ({ key, label: labelFor(key), count }));
}

/** Years (newest first) that have at least one completion. */
export function yearsWithCompletions(tasks: MaintenanceTask[]): number[] {
  const years = new Set<number>();
  for (const task of tasks) {
    if (!task.is_completed) continue;
    const date = completedOn(task);
    if (date) years.add(date.getFullYear());
  }
  return Array.from(years).sort((a, b) => b - a);
}

export function computeYearInReview(
  completedTasks: MaintenanceTask[],
  year: number,
  options: {
    zones: HomeMapZone[];
    categoryLabel: (category: MaintenanceCategory) => string;
  }
): YearInReview {
  const jobs = completedTasks
    .filter((t) => t.is_completed)
    .map((task) => ({ task, date: completedOn(task) }))
    .filter(
      (j): j is { task: MaintenanceTask; date: Date } =>
        j.date !== null && j.date.getFullYear() === year
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  let scheduled = 0;
  let onTime = 0;
  let minutes = 0;
  let repairsLogged = 0;
  const monthCounts = new Array<number>(12).fill(0);
  const zoneCounts = new Map<HomeMapZoneId, number>();
  const categoryCounts = new Map<MaintenanceCategory, number>();
  const contributors = new Map<string, YearInReviewContributor>();
  const photoPaths: string[] = [];

  for (const { task, date } of jobs) {
    monthCounts[date.getMonth()] += 1;
    if (task.estimated_duration_minutes > 0) {
      minutes += task.estimated_duration_minutes;
    }

    if (isRepairRoutine(task)) {
      repairsLogged += 1;
    } else if (task.due_date) {
      scheduled += 1;
      const late = differenceInCalendarDays(
        startOfDay(date),
        startOfDay(new Date(task.due_date))
      );
      if (late <= 0) onTime += 1;
    }

    categoryCounts.set(task.category, (categoryCounts.get(task.category) ?? 0) + 1);
    const zone = options.zones.find((z) => taskMatchesZone(task, z));
    if (zone) zoneCounts.set(zone.id, (zoneCounts.get(zone.id) ?? 0) + 1);

    const name = task.completed_by_name?.trim();
    if (task.completed_by || name) {
      const key = task.completed_by ?? `name:${name}`;
      const existing = contributors.get(key);
      if (existing) existing.count += 1;
      else
        contributors.set(key, {
          userId: task.completed_by ?? null,
          name: name || "HomeShare member",
          count: 1,
        });
    }

    if (task.photo_storage_path) photoPaths.push(task.photo_storage_path);
  }

  const busiestIndex = monthCounts.reduce(
    (best, count, i) => (count > monthCounts[best] ? i : best),
    0
  );
  const zoneLabel = new Map(options.zones.map((z) => [z.id, z.label]));
  const ledger = computeSpendLedger(completedTasks);
  const spend = spendForYear(ledger, year);

  return {
    year,
    jobsDone: jobs.length,
    onTimeRate: scheduled > 0 ? onTime / scheduled : null,
    estimatedHours: Math.round(minutes / 60),
    repairsLogged,
    spend: spend && spend.count > 0 ? spend : null,
    topZones: rank(zoneCounts, (id) => zoneLabel.get(id) ?? id),
    topCategories: rank(categoryCounts, options.categoryLabel),
    busiestMonth:
      jobs.length > 0
        ? { month: busiestIndex, count: monthCounts[busiestIndex] }
        : null,
    monthCounts,
    contributors: Array.from(contributors.values()).sort(
      (a, b) => b.count - a.count
    ),
    firstJob: jobs[0] ? { title: jobs[0].task.title, date: jobs[0].date } : null,
    lastJob: jobs.length
      ? {
          title: jobs[jobs.length - 1].task.title,
          date: jobs[jobs.length - 1].date,
        }
      : null,
    photoPaths: photoPaths.slice(-MAX_PHOTOS).reverse(),
  };
}
