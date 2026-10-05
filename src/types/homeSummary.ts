import { ServiceResponse } from "./maintenance";

export interface HomeSummaryEquipmentItem {
  name: string;
  manufacturer: string | null;
  modelNumber: string | null;
  serialNumber: string | null;
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

export interface HomeSummaryPaint {
  room: string;
  name: string;
  brand: string | null;
  code: string | null;
  finish: string | null;
  hex: string | null;
}

export interface HomeSummaryReportData {
  generatedAt: Date;
  ownerName: string | null;
  addressLines: string[];
  hasAddress: boolean;
  equipment: HomeSummaryEquipmentItem[];
  taskGroups: HomeSummaryTaskGroup[];
  spendTotals: HomeSummarySpendTotals;
  paints: HomeSummaryPaint[];
  /** ISO 4217 code used for every amount in the report. */
  currency: string;
}

export interface HomeSummaryReportResponse
  extends ServiceResponse<HomeSummaryReportData> {}
