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
