/** A CPSC recall matched to a piece of equipment by the recall-scan job. */
export interface EquipmentRecall {
  id: string;
  equipment_id: string;
  user_id: string;
  household_id: string | null;
  home_id: string | null;
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
