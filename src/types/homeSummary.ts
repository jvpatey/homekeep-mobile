import { ServiceResponse } from "./maintenance";

export interface HomeSummaryEquipmentItem {
  name: string;
  modelNumber: string | null;
  purchaseDateLabel: string | null;
  hasManual: boolean;
  hasReceipt: boolean;
}

export interface HomeSummaryTaskCompletion {
  completedDateLabel: string;
  completedByLabel: string | null;
  notes: string | null;
}

/** One maintenance routine with one or more completion dates. */
export interface HomeSummaryTaskGroup {
  title: string;
  category: string;
  completions: HomeSummaryTaskCompletion[];
}

export interface HomeSummaryReportData {
  generatedAt: Date;
  ownerName: string | null;
  addressLines: string[];
  hasAddress: boolean;
  equipment: HomeSummaryEquipmentItem[];
  taskGroups: HomeSummaryTaskGroup[];
}

export interface HomeSummaryReportResponse
  extends ServiceResponse<HomeSummaryReportData> {}
