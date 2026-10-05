import type { Ionicons } from "@expo/vector-icons";
import { MaintenanceCategory, ServiceResponse } from "./maintenance";

export const EQUIPMENT_TYPES = [
  "furnace",
  "ac",
  "heat_pump",
  "water_heater",
  "water_softener",
  "fridge",
  "dishwasher",
  "washer",
  "dryer",
  "stove",
  "range_hood",
  "microwave",
  "lawn_mower",
  "other",
] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

/** Types accepted before the equipment-details migration widened the check. */
export const LEGACY_EQUIPMENT_TYPES = [
  "furnace",
  "ac",
  "water_heater",
  "fridge",
  "washer",
  "dryer",
  "other",
] as const satisfies readonly EquipmentType[];

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  furnace: "Furnace",
  ac: "Air conditioner",
  heat_pump: "Heat pump",
  water_heater: "Water heater",
  water_softener: "Water softener",
  fridge: "Fridge",
  dishwasher: "Dishwasher",
  washer: "Washer",
  dryer: "Dryer",
  stove: "Stove / oven",
  range_hood: "Range hood",
  microwave: "Microwave",
  lawn_mower: "Lawn mower",
  other: "Other",
};

export const EQUIPMENT_TYPE_ICONS: Record<
  EquipmentType,
  keyof typeof Ionicons.glyphMap
> = {
  furnace: "flame-outline",
  ac: "snow-outline",
  heat_pump: "thermometer-outline",
  water_heater: "water-outline",
  water_softener: "beaker-outline",
  fridge: "cube-outline",
  dishwasher: "restaurant-outline",
  washer: "shirt-outline",
  dryer: "sunny-outline",
  stove: "bonfire-outline",
  range_hood: "cloud-upload-outline",
  microwave: "radio-outline",
  lawn_mower: "leaf-outline",
  other: "construct-outline",
};

export function equipmentTypeIcon(
  type: EquipmentType | null | undefined
): keyof typeof Ionicons.glyphMap {
  return EQUIPMENT_TYPE_ICONS[type ?? "other"] ?? "construct-outline";
}

/** Best-fit task category for work on a piece of equipment. */
export function categoryForEquipmentType(
  type: EquipmentType | null | undefined
): MaintenanceCategory {
  switch (type) {
    case "furnace":
    case "ac":
    case "heat_pump":
      return "HVAC";
    case "water_heater":
    case "water_softener":
      return "PLUMBING";
    case "lawn_mower":
      return "LANDSCAPING";
    case "other":
    case null:
    case undefined:
      return "GENERAL";
    default:
      return "APPLIANCES";
  }
}

export interface EquipmentConsumable {
  id: string;
  /** e.g. "Air filter", "Water filter", "Salt". */
  label: string;
  partNumber?: string | null;
  /** e.g. "16x25x1". */
  size?: string | null;
  notes?: string | null;
}

export interface EquipmentManual {
  id: string;
  user_id: string;
  name: string;
  model_number: string | null;
  manufacturer?: string | null;
  serial_number?: string | null;
  consumables?: EquipmentConsumable[] | null;
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
  manufacturer?: string | null;
  serial_number?: string | null;
  consumables?: EquipmentConsumable[];
  purchase_date?: string | null;
  warranty_expires_on?: string | null;
  equipment_type?: EquipmentType | null;
}

export interface UpdateEquipmentManualData {
  name?: string;
  model_number?: string | null;
  manufacturer?: string | null;
  serial_number?: string | null;
  consumables?: EquipmentConsumable[];
  purchase_date?: string | null;
  warranty_expires_on?: string | null;
  equipment_type?: EquipmentType | null;
  manual_storage_path?: string | null;
  manual_mime_type?: string | null;
  receipt_storage_path?: string | null;
  receipt_mime_type?: string | null;
}

/** Defensive read of the consumables jsonb (missing column or bad rows). */
export function parseConsumables(raw: unknown): EquipmentConsumable[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object"
    )
    .map((item, index) => ({
      id: typeof item.id === "string" && item.id ? item.id : `c${index}`,
      label: typeof item.label === "string" ? item.label.trim() : "",
      partNumber:
        typeof item.partNumber === "string" ? item.partNumber.trim() || null : null,
      size: typeof item.size === "string" ? item.size.trim() || null : null,
      notes: typeof item.notes === "string" ? item.notes.trim() || null : null,
    }))
    .filter((item) => item.label.length > 0);
}

export interface EquipmentManualResponse extends ServiceResponse<EquipmentManual> {}

export interface EquipmentManualsResponse extends ServiceResponse<EquipmentManual[]> {}

export interface EquipmentManualSignedUrlResponse extends ServiceResponse<string> {}
