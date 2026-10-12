/**
 * Typical cost per occurrence for bundled plan tasks, in USD.
 * `diy` is supplies only; `pro` is hiring someone (equal to `diy` for pro-only work).
 * `perYear` caps seasonal tasks whose interval would otherwise overcount
 * (weekly mowing runs ~26 weeks, not 52).
 *
 * Keyed by task title so the same task shared across plans has one price.
 * A template can override with its own `estimated_cost_diy` / `estimated_cost_pro`.
 */
interface CostEstimateRow {
  diy: number;
  pro: number;
  perYear?: number;
}

const CATALOG: Record<string, CostEstimateRow> = {
  // Water & basement
  "Test water leak sensors": { diy: 5, pro: 5 },
  "Empty & clean dehumidifier": { diy: 0, pro: 0 },
  "Check foundation for cracks & damp": { diy: 0, pro: 150 },
  "Check grading & downspout extensions": { diy: 30, pro: 250 },
  "Clear window wells": { diy: 0, pro: 100 },
  "Flush water heater": { diy: 10, pro: 150 },
  "Test sump pump": { diy: 0, pro: 150 },
  "Test well water": { diy: 50, pro: 200 },
  "Check well pump & pressure tank": { diy: 0, pro: 200 },
  "Refill water softener salt": { diy: 8, pro: 30 },
  "Schedule septic tank pumping": { diy: 450, pro: 450 },
  "Sewer line camera inspection": { diy: 275, pro: 275 },

  // Condo & interior
  "Review HOA documents & unit insurance": { diy: 0, pro: 0 },
  "Find your main water shutoff": { diy: 0, pro: 0 },
  "Inspect washing machine hoses": { diy: 10, pro: 100 },
  "Check water heater drain pan": { diy: 0, pro: 80 },
  "Clean dryer vent duct": { diy: 25, pro: 150 },
  "Re-caulk tub & shower": { diy: 15, pro: 200 },
  "Clean sliding door track": { diy: 5, pro: 80 },
  "Clear balcony drain": { diy: 0, pro: 80 },
  "Confirm interconnected alarms with HOA": { diy: 0, pro: 0 },
  "Keep manuals, warranties, and key contacts": { diy: 0, pro: 0 },

  // Exterior & seasonal
  "Clear leaves & lawn debris": { diy: 10, pro: 300 },
  "Clean up lawn debris": { diy: 10, pro: 250 },
  "Late fall lawn fertilize": { diy: 40, pro: 90 },
  "Clean gutters & downspouts": { diy: 0, pro: 175 },
  "Inspect roof and flashing": { diy: 0, pro: 250 },
  "Seal or weatherstrip doors & windows": { diy: 40, pro: 300 },
  "Winterize outdoor faucets": { diy: 10, pro: 100 },
  "Drain & store garden hoses": { diy: 0, pro: 50 },
  "Store outdoor furniture": { diy: 0, pro: 75 },
  "Mow lawn": { diy: 3, pro: 45, perYear: 26 },
  "Fertilize lawn": { diy: 35, pro: 80 },
  "Seed bare spots": { diy: 30, pro: 150 },
  "Lime lawn": { diy: 30, pro: 120 },
  "Clean patio / deck": { diy: 20, pro: 200 },
  "Inspect deck structure": { diy: 0, pro: 200 },
  "Clean & seal deck": { diy: 150, pro: 900 },
  "Start up irrigation system": { diy: 0, pro: 100 },
  "Winterize irrigation (blowout)": { diy: 0, pro: 100 },
  "Adjust irrigation controller schedule": { diy: 0, pro: 0 },
  "Backflow preventer test": { diy: 100, pro: 100 },

  // Garage
  "Check garage door opener & remotes": { diy: 5, pro: 120 },
  "Replace garage door weatherstripping": { diy: 30, pro: 175 },
  "Clean garage floor & drain": { diy: 10, pro: 150 },
  "Store fuels & chemicals safely": { diy: 0, pro: 0 },
  "Lubricate & test garage door": { diy: 10, pro: 120 },

  // Heating & cooling
  "Clean heat pump filters": { diy: 0, pro: 80 },
  "Professional heat pump inspection": { diy: 175, pro: 175 },
  "Clean mini-split indoor filters": { diy: 0, pro: 0 },
  "Professional mini-split service": { diy: 200, pro: 200 },
  "Replace geothermal air-handler filter": { diy: 25, pro: 80 },
  "Professional geothermal inspection": { diy: 250, pro: 250 },
  "Replace HVAC filter": { diy: 15, pro: 80 },
  "Natural gas furnace tune-up": { diy: 150, pro: 150 },
  "Oil furnace or boiler service": { diy: 250, pro: 250 },
  "Propane furnace tune-up": { diy: 150, pro: 150 },
  "Inspect chimney and wood or pellet stove": { diy: 250, pro: 250 },
  "Empty wood or pellet stove ash": { diy: 0, pro: 0 },
  "Chimney sweep & inspection": { diy: 250, pro: 250 },
  "Service gas fireplace": { diy: 150, pro: 150 },
  "Clean electric fireplace": { diy: 5, pro: 80 },
  "Clean air exchanger filters (HRV/ERV)": { diy: 0, pro: 120 },
  "Keep HVAC indoor space clear": { diy: 0, pro: 0 },

  // Electrical & power
  "Electrical panel & wiring inspection": { diy: 300, pro: 300 },
  "Run generator under load": { diy: 5, pro: 5 },
  "Service generator": { diy: 60, pro: 250 },
  "Inspect solar panels & production": { diy: 0, pro: 175 },
  "Inspect EV charger": { diy: 0, pro: 150 },
  "Exercise GFCI outlets": { diy: 0, pro: 0 },

  // Safety
  "Test smoke & CO alarms": { diy: 1, pro: 1 },
  "Check fire extinguisher(s)": { diy: 0, pro: 0 },
  "Lead paint awareness check": { diy: 15, pro: 400 },
  "Asbestos awareness check": { diy: 0, pro: 500 },

  // Appliances
  "Clean dishwasher filter": { diy: 0, pro: 0 },
  "Clean kitchen vent hood grease filters": { diy: 0, pro: 0 },
  "Replace refrigerator water filter": { diy: 40, pro: 100 },
  "Vacuum refrigerator coils": { diy: 0, pro: 100 },
  "Deep-clean oven and cooktop": { diy: 10, pro: 120 },
  "Clean microwave interior": { diy: 0, pro: 0 },
  "Clean washing machine gasket and dispenser": { diy: 5, pro: 5 },
  "Service lawn mower": { diy: 25, pro: 90 },

  // Pool & spa (weekly pool work runs ~20 weeks a season)
  "Test pool water & balance chemistry": { diy: 15, pro: 40, perYear: 20 },
  "Skim pool surface & empty skimmer baskets": { diy: 0, pro: 20, perYear: 20 },
  "Brush pool surfaces & vacuum": { diy: 0, pro: 30, perYear: 20 },
  "Shock or oxidize pool water": { diy: 12, pro: 25, perYear: 10 },
  "Clean or backwash pool filter": { diy: 5, pro: 75, perYear: 5 },
  "Inspect pool pump & strainer basket": { diy: 0, pro: 40, perYear: 5 },
  "Clean salt chlorinator cell": { diy: 10, pro: 100, perYear: 2 },
  "Open pool for swim season": { diy: 100, pro: 350 },
  "Close & winterize pool": { diy: 75, pro: 300 },
  "Test hot tub water & maintain sanitizer": { diy: 5, pro: 30 },
  "Clean spa filters": { diy: 5, pro: 60 },
  "Drain & refill spa": { diy: 10, pro: 150 },
  "Inspect spa cover & straps": { diy: 0, pro: 50 },
};

function normalize(title: string): string {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}

const BY_TITLE = new Map(
  Object.entries(CATALOG).map(([title, row]) => [normalize(title), row])
);

export interface CostEstimate {
  diy: number;
  pro: number;
  /** Max occurrences per year for seasonal tasks. */
  perYear?: number;
}

function finite(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Per-occurrence cost for a template or routine: its own fields first, then the
 * catalog by title. Null when unknown (custom tasks, repairs).
 */
export function costEstimateFor(item: {
  title: string;
  estimated_cost_diy?: number | null;
  estimated_cost_pro?: number | null;
}): CostEstimate | null {
  const row = BY_TITLE.get(normalize(item.title));
  const diy = finite(item.estimated_cost_diy) ?? row?.diy ?? null;
  const pro = finite(item.estimated_cost_pro) ?? row?.pro ?? null;
  if (diy === null && pro === null) return null;
  return {
    diy: diy ?? pro!,
    pro: pro ?? diy!,
    perYear: row?.perYear,
  };
}
