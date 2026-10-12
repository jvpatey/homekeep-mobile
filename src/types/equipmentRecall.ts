/** Recall agency for the home's country: CPSC (US) or Health Canada. */
export type RecallSource = "cpsc" | "health_canada";

export const RECALL_SOURCE_AGENCY: Record<RecallSource, string> = {
  cpsc: "U.S. CPSC",
  health_canada: "Health Canada",
};

export const RECALL_SOURCE_SITE: Record<RecallSource, string> = {
  cpsc: "CPSC.gov",
  health_canada: "Health Canada",
};

/** A recall matched to a piece of equipment by the recall-scan job. */
export interface EquipmentRecall {
  id: string;
  equipment_id: string;
  user_id: string;
  household_id: string | null;
  home_id: string | null;
  source: RecallSource;
  recall_number: string;
  title: string;
  url: string | null;
  hazard: string | null;
  remedy: string | null;
  recall_date: string | null;
  matched_on: "model" | "name";
  notified_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
}
