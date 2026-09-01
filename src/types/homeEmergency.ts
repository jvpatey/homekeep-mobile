export interface HomeEmergencySpot {
  note?: string | null;
  photo_storage_path?: string | null;
}

export interface HomeEmergencyFacts {
  waterShutoff?: HomeEmergencySpot | null;
  breakerPanel?: HomeEmergencySpot | null;
  gasShutoff?: HomeEmergencySpot | null;
}

export function parseHomeEmergency(value: unknown): HomeEmergencyFacts {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const row = value as Record<string, unknown>;
  const next: HomeEmergencyFacts = {};
  const keys = ["waterShutoff", "breakerPanel", "gasShutoff"] as const;
  for (const key of keys) {
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
