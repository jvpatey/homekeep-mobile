import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import {
  MaintenanceRoutine,
  MaintenanceTask,
  Priority,
  isRepairRoutine,
} from "../types/maintenance";
import {
  HomeMapZone,
  HomeMapZoneId,
  taskMatchesZone,
} from "../data/homeMapZones";

/**
 * Upkeep: are you keeping up with your home's care? Scores recurring
 * reminders only, never the physical condition of the house.
 */

export type UpkeepStatus = "onTrack" | "dueSoon" | "late" | "neglected";
export type UpkeepGrade = "on_track" | "slipping" | "needs_attention";

/** routine_id → latest completed_at (ISO). */
export type LastCompletionMap = Record<string, string>;

export type UpkeepRoutine = Pick<
  MaintenanceRoutine,
  | "id"
  | "title"
  | "category"
  | "priority"
  | "interval_days"
  | "start_date"
  | "source_plan_id"
>;

export interface RoutineUpkeep {
  routine: UpkeepRoutine;
  status: UpkeepStatus;
  /** 0–1; 1 means no drag on the score. */
  value: number;
  weight: number;
  nextDue: Date;
  /** Positive when past due. */
  daysLate: number;
  /** Null when never completed. */
  daysSinceDone: number | null;
  zoneId: HomeMapZoneId | null;
  highStakes: boolean;
}

export type UpkeepResult =
  | { state: "empty"; routines: RoutineUpkeep[] }
  | {
      state: "gettingStarted";
      routines: RoutineUpkeep[];
      completed: number;
      target: number;
      /** Reminders still needed before a score is meaningful. */
      routinesNeeded: number;
    }
  | {
      state: "scored";
      routines: RoutineUpkeep[];
      score: number;
      grade: UpkeepGrade;
      /** True when a weakest-link cap lowered the score. */
      capped: boolean;
    };

export interface UpkeepInput {
  routines: UpkeepRoutine[];
  /** Open (not completed) instances; earliest per routine sets its next due date. */
  openTasks: Pick<MaintenanceTask, "id" | "due_date" | "is_completed">[];
  lastCompletion: LastCompletionMap;
  zones: HomeMapZone[];
  now?: Date;
  /** Off-season reminders (e.g. lawn in winter) are left out entirely. */
  inSeason?: (routine: UpkeepRoutine) => boolean;
}

export const UPKEEP_GRADE_LABEL: Record<UpkeepGrade, string> = {
  on_track: "On track",
  slipping: "Slipping",
  needs_attention: "Needs attention",
};

export const MIN_ROUTINES_FOR_SCORE = 5;
export const MIN_COMPLETIONS_FOR_SCORE = 3;
export const MIN_DAYS_FOR_SCORE = 30;

const DUE_SOON_DAYS = 7;
const SLIPPING_CAP = 79;
const NEEDS_ATTENTION_CAP = 54;

const PRIORITY_WEIGHT: Record<Priority, number> = {
  urgent: 3,
  high: 2,
  medium: 1,
  low: 0.5,
};

const HIGH_STAKES_ZONES: ReadonlySet<HomeMapZoneId> = new Set([
  "safety",
  "water",
  "exterior",
  "electrical",
]);
const HIGH_STAKES_MULTIPLIER = 1.5;

export function upkeepGradeForScore(score: number): UpkeepGrade {
  if (score >= 80) return "on_track";
  if (score >= 55) return "slipping";
  return "needs_attention";
}

export function graceDays(intervalDays: number): number {
  return Math.max(3, Math.round(intervalDays * 0.1));
}

function zoneFor(
  routine: UpkeepRoutine,
  zones: HomeMapZone[]
): HomeMapZoneId | null {
  return zones.find((zone) => taskMatchesZone(routine, zone))?.id ?? null;
}

function nextDueFor(
  routine: UpkeepRoutine,
  earliestOpen: Date | undefined,
  lastDone: Date | null
): Date {
  if (earliestOpen) return earliestOpen;
  if (lastDone) return addDays(lastDone, routine.interval_days);
  return startOfDay(new Date(routine.start_date));
}

export function evaluateRoutine(
  routine: UpkeepRoutine,
  earliestOpen: Date | undefined,
  lastDoneIso: string | undefined,
  zones: HomeMapZone[],
  now: Date = new Date()
): RoutineUpkeep {
  const today = startOfDay(now);
  const interval = routine.interval_days;
  const lastDone = lastDoneIso ? startOfDay(new Date(lastDoneIso)) : null;
  const nextDue = startOfDay(nextDueFor(routine, earliestOpen, lastDone));
  const daysLate = differenceInCalendarDays(today, nextDue);
  const daysSinceDone = lastDone
    ? differenceInCalendarDays(today, lastDone)
    : null;
  const grace = graceDays(interval);

  const zoneId = zoneFor(routine, zones);
  const highStakes = zoneId !== null && HIGH_STAKES_ZONES.has(zoneId);
  const weight =
    PRIORITY_WEIGHT[routine.priority] *
    (highStakes ? HIGH_STAKES_MULTIPLIER : 1);

  const sinceStart = differenceInCalendarDays(
    today,
    startOfDay(new Date(routine.start_date))
  );
  // Never-done reminders past a full cycle are neglected even when skips have
  // pushed the next due date forward.
  const neglected =
    daysSinceDone !== null
      ? daysSinceDone > interval * 2
      : sinceStart > interval + grace;

  let status: UpkeepStatus;
  let value: number;
  if (neglected) {
    status = "neglected";
    value = 0.2;
  } else if (daysLate > grace) {
    status = "late";
    const window = Math.min(interval, 90);
    const progress = Math.min(1, (daysLate - grace) / Math.max(1, window));
    value = 0.85 - 0.45 * progress;
  } else if (daysLate >= -DUE_SOON_DAYS) {
    status = "dueSoon";
    value = 1;
  } else {
    status = "onTrack";
    value = 1;
  }

  return {
    routine,
    status,
    value,
    weight,
    nextDue,
    daysLate,
    daysSinceDone,
    zoneId,
    highStakes,
  };
}

/** Weighted mean of routine values, then lowered by weakest-link caps. */
export function scoreRoutines(routines: RoutineUpkeep[]): {
  score: number;
  capped: boolean;
} {
  let weighted = 0;
  let total = 0;
  for (const item of routines) {
    weighted += item.weight * item.value;
    total += item.weight;
  }
  const raw = total > 0 ? Math.round((100 * weighted) / total) : 100;

  let cap = 100;
  for (const item of routines) {
    const critical =
      item.zoneId === "safety" || item.routine.priority === "urgent";
    if (item.status === "neglected" && item.highStakes) {
      cap = Math.min(cap, NEEDS_ATTENTION_CAP);
    } else if (
      (item.status === "late" || item.status === "neglected") &&
      critical
    ) {
      cap = Math.min(cap, SLIPPING_CAP);
    }
  }

  const score = Math.max(0, Math.min(raw, cap));
  return { score, capped: score < raw };
}

export function computeUpkeep({
  routines,
  openTasks,
  lastCompletion,
  zones,
  now = new Date(),
  inSeason,
}: UpkeepInput): UpkeepResult {
  const earliestOpen = new Map<string, Date>();
  for (const task of openTasks) {
    if (task.is_completed) continue;
    const due = new Date(task.due_date);
    const existing = earliestOpen.get(task.id);
    if (!existing || due < existing) earliestOpen.set(task.id, due);
  }

  const counted = routines.filter(
    (routine) =>
      routine.interval_days > 0 &&
      !isRepairRoutine(routine) &&
      (inSeason ? inSeason(routine) : true)
  );

  const evaluated = counted.map((routine) =>
    evaluateRoutine(
      routine,
      earliestOpen.get(routine.id),
      lastCompletion[routine.id],
      zones,
      now
    )
  );

  if (evaluated.length === 0) return { state: "empty", routines: [] };

  const completed = counted.filter((r) => lastCompletion[r.id]).length;
  const oldestStart = counted.reduce<Date | null>((oldest, routine) => {
    const start = new Date(routine.start_date);
    return !oldest || start < oldest ? start : oldest;
  }, null);
  const daysTracked = oldestStart
    ? differenceInCalendarDays(startOfDay(now), startOfDay(oldestStart))
    : 0;

  const enoughRoutines = evaluated.length >= MIN_ROUTINES_FOR_SCORE;
  const enoughHistory =
    completed >= MIN_COMPLETIONS_FOR_SCORE || daysTracked >= MIN_DAYS_FOR_SCORE;

  if (!enoughRoutines || !enoughHistory) {
    return {
      state: "gettingStarted",
      routines: evaluated,
      completed: Math.min(completed, MIN_COMPLETIONS_FOR_SCORE),
      target: MIN_COMPLETIONS_FOR_SCORE,
      routinesNeeded: Math.max(0, MIN_ROUTINES_FOR_SCORE - evaluated.length),
    };
  }

  const { score, capped } = scoreRoutines(evaluated);
  return {
    state: "scored",
    routines: evaluated,
    score,
    grade: upkeepGradeForScore(score),
    capped,
  };
}

function formatSpan(days: number): string {
  if (days < 7) return days === 1 ? "1 day" : `${days} days`;
  if (days < 60) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? "1 week" : `${weeks} weeks`;
  }
  if (days < 365 * 2) {
    const months = Math.round(days / 30);
    return `${months} months`;
  }
  return `${Math.floor(days / 365)} years`;
}

/** Points lost to each routine, biggest first; empty when nothing drags. */
export function upkeepDrags(routines: RoutineUpkeep[]): RoutineUpkeep[] {
  return routines
    .filter((item) => item.value < 1)
    .sort((a, b) => b.weight * (1 - b.value) - a.weight * (1 - a.value));
}

export function describeDrag(item: RoutineUpkeep): string {
  const title = item.routine.title;
  if (item.status === "neglected") {
    return item.daysSinceDone !== null
      ? `${title} not done in ${formatSpan(item.daysSinceDone)}`
      : `${title} hasn't been done yet`;
  }
  return `${title} is ${formatSpan(item.daysLate)} late`;
}

/** The one-line reason under the score. */
export function upkeepSummary(result: UpkeepResult): string {
  if (result.state === "empty") return "Add reminders to start tracking upkeep.";
  const drags = upkeepDrags(result.routines);
  if (drags.length > 0) {
    const more = drags.length > 1 ? ` +${drags.length - 1} more` : "";
    return `${describeDrag(drags[0])}.${more}`;
  }
  const dueSoon = result.routines.filter((r) => r.status === "dueSoon").length;
  if (dueSoon === 0) return "Everything is on track.";
  return `Everything is on track. ${dueSoon} ${
    dueSoon === 1 ? "thing" : "things"
  } due this week.`;
}

export type ZoneUpkeepState =
  | "quiet"
  | "onTrack"
  | "dueSoon"
  | "late"
  | "needsAttention";

export interface ZoneUpkeep {
  zoneId: HomeMapZoneId;
  state: ZoneUpkeepState;
  routineCount: number;
  lateCount: number;
  dueSoonCount: number;
  neglectedCount: number;
  /** Colour for the status dot; null for zones with no reminders. */
  grade: UpkeepGrade | null;
  label: string;
}

/** Word-based zone status. Zones never show a number. */
export function zoneUpkeep(
  routines: RoutineUpkeep[],
  zoneId: HomeMapZoneId
): ZoneUpkeep {
  const inZone = routines.filter((r) => r.zoneId === zoneId);
  const lateCount = inZone.filter((r) => r.status === "late").length;
  const dueSoonCount = inZone.filter((r) => r.status === "dueSoon").length;
  const neglectedCount = inZone.filter((r) => r.status === "neglected").length;

  let state: ZoneUpkeepState;
  let label: string;
  let grade: UpkeepGrade | null;
  if (inZone.length === 0) {
    state = "quiet";
    label = "No reminders";
    grade = null;
  } else if (neglectedCount > 0) {
    state = "needsAttention";
    label = "Needs attention";
    grade = "needs_attention";
  } else if (lateCount > 0) {
    state = "late";
    label = `${lateCount} late`;
    grade = "slipping";
  } else if (dueSoonCount > 0) {
    state = "dueSoon";
    label = `${dueSoonCount} due this week`;
    grade = "on_track";
  } else {
    state = "onTrack";
    label = "On track";
    grade = "on_track";
  }

  return {
    zoneId,
    state,
    routineCount: inZone.length,
    lateCount,
    dueSoonCount,
    neglectedCount,
    grade,
    label,
  };
}
