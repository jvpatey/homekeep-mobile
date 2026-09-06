import {
  homeHeatSources,
  type HomeSystems,
} from "../data/maintenancePlans/homeSystems";

export interface HomeEmergencySpot {
  note?: string | null;
  howto?: string | null;
  photo_storage_path?: string | null;
}

export interface HomeEmergencyCustomSpot extends HomeEmergencySpot {
  id: string;
  label: string;
}

export interface HomeEmergencyFacts {
  waterShutoff?: HomeEmergencySpot | null;
  waterHeater?: HomeEmergencySpot | null;
  breakerPanel?: HomeEmergencySpot | null;
  gasShutoff?: HomeEmergencySpot | null;
  custom?: HomeEmergencyCustomSpot[] | null;
}

export const MAX_CUSTOM_EMERGENCY_SPOTS = 8;

export function createCustomEmergencySpot(): HomeEmergencyCustomSpot {
  return {
    id: `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    label: "",
  };
}

export const HOME_EMERGENCY_SPOT_KEYS = [
  "waterShutoff",
  "waterHeater",
  "breakerPanel",
  "gasShutoff",
] as const;

export type HomeEmergencySpotKey = (typeof HOME_EMERGENCY_SPOT_KEYS)[number];

const GAS_HEAT_SOURCES = ["gas_furnace", "propane"] as const;

/**
 * Show the gas card unless the home profile lists heat sources and none
 * are natural gas or propane. Unknown heat → keep the card.
 */
export function homeShowsGasShutoff(
  home: HomeSystems | null | undefined
): boolean {
  const sources = homeHeatSources(home);
  if (sources.length === 0) return true;
  if (
    sources.some((source) =>
      (GAS_HEAT_SOURCES as readonly string[]).includes(source)
    )
  ) {
    return true;
  }
  return sources.includes("other");
}

export function visibleEmergencySpotKeys(
  home: HomeSystems | null | undefined
): HomeEmergencySpotKey[] {
  return HOME_EMERGENCY_SPOT_KEYS.filter(
    (key) => key !== "gasShutoff" || homeShowsGasShutoff(home)
  );
}

/** Title substrings that link a schedule task to an emergency spot. */
export const EMERGENCY_SPOT_TASK_HINTS: Record<
  HomeEmergencySpotKey,
  string[]
> = {
  waterShutoff: ["water shutoff", "main shutoff", "main water"],
  waterHeater: ["water heater", "hot water heater", "hot-water heater"],
  breakerPanel: ["breaker panel", "electrical panel", "service panel"],
  gasShutoff: ["gas shutoff", "gas meter"],
};

export function isEmergencySpotFilled(
  spot: HomeEmergencySpot | null | undefined
): boolean {
  if (!spot) return false;
  const note = spot.note?.trim();
  const howto = spot.howto?.trim();
  return Boolean(note) || Boolean(howto) || Boolean(spot.photo_storage_path);
}

/** How many visible emergency spots have a note, how-to, or photo. */
export function countFilledEmergencySpots(
  facts: HomeEmergencyFacts | null | undefined,
  home?: HomeSystems | null
): { filled: number; total: number } {
  const keys = visibleEmergencySpotKeys(home);
  const custom = facts?.custom ?? [];
  const total = keys.length + custom.length;
  if (!facts) return { filled: 0, total };
  let filled = 0;
  for (const key of keys) {
    if (isEmergencySpotFilled(facts[key])) filled += 1;
  }
  for (const spot of custom) {
    if (isEmergencySpotFilled(spot)) filled += 1;
  }
  return { filled, total };
}

export function emergencyProgressSubtitle(
  facts: HomeEmergencyFacts | null | undefined,
  home?: HomeSystems | null
): string {
  const { filled, total } = countFilledEmergencySpots(facts, home);
  if (filled === 0) {
    return homeShowsGasShutoff(home)
      ? "Save water, heater, panel, and gas"
      : "Save water, heater, and the panel";
  }
  if (filled === total) {
    return `All ${total} spots saved`;
  }
  return `${filled} of ${total} spots saved`;
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
      howto: typeof rec.howto === "string" ? rec.howto : null,
      photo_storage_path:
        typeof rec.photo_storage_path === "string"
          ? rec.photo_storage_path
          : null,
    };
  }
  const customRaw = row.custom;
  if (Array.isArray(customRaw)) {
    const custom: HomeEmergencyCustomSpot[] = [];
    for (const item of customRaw) {
      const parsed = parseCustomEmergencySpot(item);
      if (parsed) custom.push(parsed);
    }
    if (custom.length > 0) next.custom = custom;
  }
  return next;
}

function parseCustomEmergencySpot(
  value: unknown
): HomeEmergencyCustomSpot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const rec = value as Record<string, unknown>;
  if (typeof rec.id !== "string" || !rec.id.trim()) return null;
  return {
    id: rec.id.trim(),
    label: typeof rec.label === "string" ? rec.label : "",
    note: typeof rec.note === "string" ? rec.note : null,
    howto: typeof rec.howto === "string" ? rec.howto : null,
    photo_storage_path:
      typeof rec.photo_storage_path === "string"
        ? rec.photo_storage_path
        : null,
  };
}
