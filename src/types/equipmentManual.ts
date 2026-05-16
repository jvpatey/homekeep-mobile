import { ServiceResponse } from "./maintenance";

export interface EquipmentManual {
  id: string;
  user_id: string;
  name: string;
  model_number: string | null;
  purchase_date: string | null;
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
}

export interface UpdateEquipmentManualData {
  name?: string;
  model_number?: string | null;
  purchase_date?: string | null;
  manual_storage_path?: string | null;
  manual_mime_type?: string | null;
  receipt_storage_path?: string | null;
  receipt_mime_type?: string | null;
}

export interface EquipmentManualResponse extends ServiceResponse<EquipmentManual> {}

export interface EquipmentManualsResponse extends ServiceResponse<EquipmentManual[]> {}

export interface EquipmentManualSignedUrlResponse extends ServiceResponse<string> {}
