import { costEstimateFor } from "../data/maintenancePlans/costEstimates";

export interface UpkeepRange {
  /** Yearly total if you do it yourself (supplies only). */
  diy: number;
  /** Yearly total if you hire everything out. */
  pro: number;
  /** Routines with a known cost. */
  covered: number;
  /** Recurring routines considered. */
  total: number;
}

interface UpkeepRoutine {
  title: string;
  interval_days: number;
  estimated_cost_diy?: number | null;
  estimated_cost_pro?: number | null;
  is_active?: boolean;
}

/**
 * "Your home's expected annual upkeep": per-occurrence cost × occurrences a
 * year, summed as a DIY-to-pro range. One-time tasks (interval 0) are skipped.
 */
export function expectedAnnualUpkeep(routines: UpkeepRoutine[]): UpkeepRange {
  let diy = 0;
  let pro = 0;
  let covered = 0;
  let total = 0;
  for (const routine of routines) {
    if (routine.is_active === false || !(routine.interval_days > 0)) continue;
    total++;
    const cost = costEstimateFor(routine);
    if (!cost) continue;
    covered++;
    const occurrences = Math.min(
      365 / routine.interval_days,
      cost.perYear ?? Infinity
    );
    diy += cost.diy * occurrences;
    pro += cost.pro * occurrences;
  }
  return { diy, pro, covered, total };
}

/**
 * Catalog prices are USD. Rough conversion for currencies where US pricing is
 * a fair guide; null elsewhere so we don't show misleading numbers.
 */
const USD_TO: Record<string, number> = {
  USD: 1,
  CAD: 1.35,
  AUD: 1.5,
  NZD: 1.65,
  GBP: 0.8,
  EUR: 0.92,
};

/** Converts and rounds a range for display; null when the currency isn't supported. */
export function upkeepInCurrency(
  range: UpkeepRange,
  currency: string
): UpkeepRange | null {
  const rate = USD_TO[currency];
  if (!rate || range.covered === 0) return null;
  const round = (value: number) =>
    value >= 1000 ? Math.round(value / 50) * 50 : Math.round(value / 10) * 10;
  return {
    ...range,
    diy: round(range.diy * rate),
    pro: round(range.pro * rate),
  };
}
