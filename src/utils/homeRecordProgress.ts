import type { Ionicons } from "@expo/vector-icons";

export type HomeRecordItemKey =
  | "emergency"
  | "equipment"
  | "documents"
  | "pros"
  | "notes"
  | "homeShare";

export interface HomeRecordItem {
  key: HomeRecordItemKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Button copy for the step, e.g. "Add a pro". */
  cta: string;
  done: boolean;
  /** Free users need HomeKeep + for this step (badge in the checklist). */
  plusRequired?: boolean;
}

/** How much of the home record is filled in; separate from the Upkeep score. */
export function homeRecordProgress(input: {
  emergencyComplete: boolean;
  equipmentCount: number;
  documentCount: number;
  proCount: number;
  noteCount: number;
  paintCount: number;
  householdShared: boolean;
}): { items: HomeRecordItem[]; done: number; total: number } {
  const items: HomeRecordItem[] = [
    {
      key: "emergency",
      label: "Emergency info",
      icon: "flash",
      cta: "Save emergency info",
      done: input.emergencyComplete,
    },
    {
      key: "equipment",
      label: "Appliance",
      icon: "cube",
      cta: "Add an appliance",
      done: input.equipmentCount > 0,
    },
    {
      key: "documents",
      label: "Document",
      icon: "folder-open",
      cta: "Add a document",
      done: input.documentCount > 0,
      plusRequired: true,
    },
    {
      key: "pros",
      label: "Trusted pro",
      icon: "call",
      cta: "Add a pro",
      done: input.proCount > 0,
      plusRequired: true,
    },
    {
      key: "notes",
      label: "House notes or paint",
      icon: "document-text",
      cta: "Add a house note",
      done: input.noteCount > 0 || input.paintCount > 0,
    },
    {
      key: "homeShare",
      label: "HomeShare",
      icon: "people",
      cta: "Invite your household",
      done: input.householdShared,
      plusRequired: true,
    },
  ];
  return {
    items,
    done: items.filter((item) => item.done).length,
    total: items.length,
  };
}
