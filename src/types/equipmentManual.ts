import { ServiceResponse } from "./maintenance";

export const EQUIPMENT_TYPES = [
  "furnace",
  "ac",
  "water_heater",
  "fridge",
  "washer",
  "dryer",
  "other",
] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  furnace: "Furnace",
  ac: "Air conditioner",
  water_heater: "Water heater",
  fridge: "Fridge",
  washer: "Washer",
  dryer: "Dryer",
  other: "Other",
};

export interface EquipmentManual {
  id: string;
  user_id: string;
  name: string;
  model_number: string | null;
  purchase_date: string | null;
  warranty_expires_on?: string | null;
  equipment_type?: EquipmentType | null;
  manual_storage_path: string | null;
  manual_mime_type: string | null;
  receipt_storage_path: string | null;
  receipt_mime_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEquipmentManualData {
  name: string;
  model_number?: string | null;
  purchase_date?: string | null;
  warranty_expires_on?: string | null;
  equipment_type?: EquipmentType | null;
}

export interface UpdateEquipmentManualData {
  name?: string;
  model_number?: string | null;
  purchase_date?: string | null;
  warranty_expires_on?: string | null;
  equipment_type?: EquipmentType | null;
  manual_storage_path?: string | null;
  manual_mime_type?: string | null;
  receipt_storage_path?: string | null;
  receipt_mime_type?: string | null;
}

export interface EquipmentManualResponse extends ServiceResponse<EquipmentManual> {}

export interface EquipmentManualsResponse extends ServiceResponse<EquipmentManual[]> {}

export interface EquipmentManualSignedUrlResponse extends ServiceResponse<string> {}
