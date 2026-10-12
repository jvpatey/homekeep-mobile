import { MaintenanceCategory } from "../types/maintenance";

const KEYWORDS: [MaintenanceCategory, RegExp][] = [
  ["SAFETY", /\b(smoke|carbon|co detector|alarm|extinguisher|radon|railing|handrail)\b/i],
  ["HVAC", /\b(furnace|hvac|a\/?c|air ?con\w*|heat ?pump|thermostat|duct|vent|boiler|filter|blower|condenser)\b/i],
  ["PLUMBING", /\b(plumb\w*|faucet|tap|leak\w*|pipe|drain|toilet|sink|shower|tub|water heater|softener|sump|valve|clog\w*|disposal|garbage disposal)\b/i],
  ["ELECTRICAL", /\b(electric\w*|outlet|socket|breaker|panel|wiring|wire|switch|light|fixture|gfci|fuse|ceiling fan)\b/i],
  ["APPLIANCES", /\b(fridge|refrigerator|freezer|dishwasher|washer|dryer|oven|stove|range|cooktop|microwave|hood|ice maker|appliance)\b/i],
  ["EXTERIOR", /\b(roof\w*|gutter\w*|siding|deck|fence|driveway|garage|window|shingle|chimney|porch|paint(ed|ing)? exterior|caulk\w*|soffit|fascia)\b/i],
  ["LANDSCAPING", /\b(lawn|mower|grass|tree|shrub|hedge|sprinkler|irrigation|garden|yard|mulch|leaf|leaves|snow ?blower)\b/i],
  ["INTERIOR", /\b(wall|drywall|floor\w*|carpet|door|cabinet|paint\w*|ceiling|stair\w*|tile|grout|closet|trim|baseboard)\b/i],
];

/** First category whose keywords appear in a free-text job title. */
export function guessRepairCategory(title: string): MaintenanceCategory | null {
  const text = title.trim();
  if (text.length < 3) return null;
  for (const [category, pattern] of KEYWORDS) {
    if (pattern.test(text)) return category;
  }
  return null;
}
