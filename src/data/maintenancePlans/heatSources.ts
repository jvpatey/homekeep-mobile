/** Heating equipment that changes which maintenance tasks we generate. */
export type HomeHeatSource =
  | "gas_furnace"
  | "oil"
  | "propane"
  | "central_heat_pump"
  | "mini_split"
  | "geothermal"
  | "electric"
  | "wood_pellet"
  | "other";

export const HOME_HEAT_SOURCE_OPTIONS: {
  id: HomeHeatSource;
  label: string;
}[] = [
  { id: "gas_furnace", label: "Natural gas furnace" },
  { id: "oil", label: "Oil furnace or boiler" },
  { id: "propane", label: "Propane furnace" },
  { id: "central_heat_pump", label: "Central heat pump" },
  { id: "mini_split", label: "Mini-split (ductless)" },
  { id: "geothermal", label: "Geothermal" },
  { id: "electric", label: "Electric (baseboard / radiant)" },
  { id: "wood_pellet", label: "Wood or pellet stove" },
  { id: "other", label: "Other" },
];

/** Forced-air and ground-source pumps that need filters / pro service. */
export const HEAT_PUMP_FAMILY: readonly HomeHeatSource[] = [
  "central_heat_pump",
  "mini_split",
  "geothermal",
];

export function isHomeHeatSource(value: unknown): value is HomeHeatSource {
  return HOME_HEAT_SOURCE_OPTIONS.some((option) => option.id === value);
}

/** Maps older stored values (e.g. `heat_pump`) onto the current set. */
export function canonicalizeHeatSource(
  value: unknown
): HomeHeatSource | null {
  if (value === "heat_pump") return "central_heat_pump";
  return isHomeHeatSource(value) ? value : null;
}

export function uniqueHeatSources(values: unknown[]): HomeHeatSource[] {
  const out: HomeHeatSource[] = [];
  for (const value of values) {
    const source = canonicalizeHeatSource(value);
    if (source && !out.includes(source)) out.push(source);
  }
  return out;
}

export function isHeatPumpFamily(source: HomeHeatSource): boolean {
  return (HEAT_PUMP_FAMILY as readonly string[]).includes(source);
}

export function heatSourcesInclude(
  sources: readonly HomeHeatSource[],
  ...needles: HomeHeatSource[]
): boolean {
  return needles.some((needle) => sources.includes(needle));
}
