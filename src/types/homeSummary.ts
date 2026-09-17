import { ServiceResponse } from "./maintenance";

export interface HomeSummaryEquipmentItem {
  name: string;
  modelNumber: string | null;
  purchaseDateLabel: string | null;
  hasManual: boolean;
  hasReceipt: boolean;
  warrantyExpiresOn: string | null;
  warrantyExpiresLabel: string | null;
  /** expired | expiring_soon | ok | none */
  warrantyStatus: "expired" | "expiring_soon" | "ok" | "none";
}

export interface HomeSummaryTaskCompletion {
  completedDateLabel: string;
  completedByLabel: string | null;
  notes: string | null;
  costAmount: number | null;
  laborType: "diy" | "hired" | null;
  /** ISO date used for year spend totals. */
  completedAtIso: string | null;
}

/** One maintenance routine with one or more completion dates. */
export interface HomeSummaryTaskGroup {
  title: string;
  category: string;
  completions: HomeSummaryTaskCompletion[];
}

export interface HomeSummarySpendTotals {
  yearLabel: string;
  yearTotal: number;
  allTimeTotal: number;
  hasAnyCost: boolean;
}

export interface HomeSummaryReportData {
  generatedAt: Date;
  ownerName: string | null;
  addressLines: string[];
  hasAddress: boolean;
  equipment: HomeSummaryEquipmentItem[];
  taskGroups: HomeSummaryTaskGroup[];
  spendTotals: HomeSummarySpendTotals;
}

export interface HomeSummaryReportResponse
  extends ServiceResponse<HomeSummaryReportData> {}
