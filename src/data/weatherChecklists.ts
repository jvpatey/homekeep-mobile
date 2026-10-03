import { ClimateAlertKind } from "../services/WeatherService";
import { CreateMaintenanceRoutineData } from "../types/maintenance";

export type WeatherChecklistItem = {
  title: string;
  category: CreateMaintenanceRoutineData["category"];
  priority: CreateMaintenanceRoutineData["priority"];
  estimated_duration_minutes: number;
  description: string;
};

const FREEZE_ITEMS: WeatherChecklistItem[] = [
  {
    title: "Disconnect and drain outdoor hoses",
    category: "PLUMBING",
    priority: "high",
    estimated_duration_minutes: 15,
    description: "Prevent frozen hose bibs and burst outdoor lines.",
  },
  {
    title: "Protect outdoor taps and hose bibs",
    category: "PLUMBING",
    priority: "high",
    estimated_duration_minutes: 10,
    description: "Insulate or cover outdoor faucets before a freeze.",
  },
];

const HEAT_ITEMS: WeatherChecklistItem[] = [
  {
    title: "Check cooling and indoor HVAC clearance",
    category: "HVAC",
    priority: "medium",
    estimated_duration_minutes: 15,
    description: "Clear vents and outdoor unit so cooling can keep up.",
  },
  {
    title: "Confirm thermostat and filter are ready for heat",
    category: "HVAC",
    priority: "medium",
    estimated_duration_minutes: 10,
    description: "A clogged filter struggles hardest on hot days.",
  },
];

const STORM_ITEMS: WeatherChecklistItem[] = [
  {
    title: "Secure loose outdoor items before storms",
    category: "EXTERIOR",
    priority: "high",
    estimated_duration_minutes: 20,
    description: "Bring in or tie down furniture, bins, and decor.",
  },
  {
    title: "Glance at roof and gutters after the storm",
    category: "EXTERIOR",
    priority: "medium",
    estimated_duration_minutes: 15,
    description: "Look for debris, leaks, or damaged shingles once it clears.",
  },
];

const BY_KIND: Record<ClimateAlertKind, WeatherChecklistItem[]> = {
  freeze: FREEZE_ITEMS,
  heat: HEAT_ITEMS,
  storm: STORM_ITEMS,
};

export function weatherChecklistForKind(
  kind: ClimateAlertKind
): WeatherChecklistItem[] {
  return BY_KIND[kind] ?? [];
}

/** Build one-shot routine payloads due at local noon today. */
export function buildWeatherChecklistPayloads(
  kind: ClimateAlertKind,
  now: Date = new Date()
): CreateMaintenanceRoutineData[] {
  const start = new Date(now);
  start.setHours(12, 0, 0, 0);
  const startIso = start.toISOString();
  return weatherChecklistForKind(kind).map((item) => ({
    title: item.title,
    category: item.category,
    priority: item.priority,
    estimated_duration_minutes: item.estimated_duration_minutes,
    interval_days: 0,
    start_date: startIso,
    description: item.description,
    source_plan_id: `weather-${kind}`,
  }));
}
