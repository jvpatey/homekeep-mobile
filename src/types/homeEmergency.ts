export interface HomeEmergencySpot {
  note?: string | null;
  photo_storage_path?: string | null;
}

export interface HomeEmergencyFacts {
  waterShutoff?: HomeEmergencySpot | null;
  breakerPanel?: HomeEmergencySpot | null;
  gasShutoff?: HomeEmergencySpot | null;
}

export const HOME_EMERGENCY_SPOT_KEYS = [
  "waterShutoff",
  "breakerPanel",
  "gasShutoff",
] as const;

export type HomeEmergencySpotKey = (typeof HOME_EMERGENCY_SPOT_KEYS)[number];

/** Title substrings that link a schedule task to an emergency spot. */
export const EMERGENCY_SPOT_TASK_HINTS: Record<
  HomeEmergencySpotKey,
  string[]
> = {
  waterShutoff: ["water shutoff", "main shutoff", "main water"],
  breakerPanel: ["breaker panel", "electrical panel", "service panel"],
  gasShutoff: ["gas shutoff", "gas meter"],
};

export function isEmergencySpotFilled(
  spot: HomeEmergencySpot | null | undefined
): boolean {
  if (!spot) return false;
  const note = spot.note?.trim();
  return Boolean(note) || Boolean(spot.photo_storage_path);
}

/** How many of the 3 emergency spots have a note or photo. */
export function countFilledEmergencySpots(
  facts: HomeEmergencyFacts | null | undefined
): { filled: number; total: number } {
  const total = HOME_EMERGENCY_SPOT_KEYS.length;
  if (!facts) return { filled: 0, total };
  let filled = 0;
  for (const key of HOME_EMERGENCY_SPOT_KEYS) {
    if (isEmergencySpotFilled(facts[key])) filled += 1;
  }
  return { filled, total };
}

/** Spots that are filled in `next` but were empty in `prev`. */
export function newlyFilledEmergencySpots(
  prev: HomeEmergencyFacts | null | undefined,
  next: HomeEmergencyFacts | null | undefined
): HomeEmergencySpotKey[] {
  return HOME_EMERGENCY_SPOT_KEYS.filter(
    (key) =>
      isEmergencySpotFilled(next?.[key]) &&
      !isEmergencySpotFilled(prev?.[key])
  );
}

export function taskMatchesEmergencySpot(
  title: string,
  spotKey: HomeEmergencySpotKey
): boolean {
  const haystack = title.toLowerCase();
  return EMERGENCY_SPOT_TASK_HINTS[spotKey].some((hint) =>
    haystack.includes(hint)
  );
}

/**
 * Open (incomplete) schedule tasks that match newly recorded emergency spots —
 * e.g. "Find your main water shutoff" after saving the water shutoff fact.
 */
export function findOpenTasksForEmergencySpots<
  T extends { title: string; is_completed: boolean },
>(tasks: T[], spotKeys: HomeEmergencySpotKey[]): T[] {
  if (spotKeys.length === 0) return [];
  const matched: T[] = [];
  const seen = new Set<T>();
  for (const task of tasks) {
    if (task.is_completed) continue;
    for (const key of spotKeys) {
      if (taskMatchesEmergencySpot(task.title, key) && !seen.has(task)) {
        seen.add(task);
        matched.push(task);
        break;
      }
    }
  }
  return matched;
}

export function parseHomeEmergency(value: unknown): HomeEmergencyFacts {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const row = value as Record<string, unknown>;
  const next: HomeEmergencyFacts = {};
  for (const key of HOME_EMERGENCY_SPOT_KEYS) {
    const spot = row[key];
    if (!spot || typeof spot !== "object" || Array.isArray(spot)) continue;
    const rec = spot as Record<string, unknown>;
    next[key] = {
      note: typeof rec.note === "string" ? rec.note : null,
      photo_storage_path:
        typeof rec.photo_storage_path === "string"
          ? rec.photo_storage_path
          : null,
    };
  }
  return next;
}
