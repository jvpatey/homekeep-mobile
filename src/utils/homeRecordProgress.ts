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
  done: boolean;
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
    { key: "emergency", label: "Emergency info", done: input.emergencyComplete },
    { key: "equipment", label: "An appliance", done: input.equipmentCount > 0 },
    { key: "documents", label: "A document", done: input.documentCount > 0 },
    { key: "pros", label: "A pro", done: input.proCount > 0 },
    {
      key: "notes",
      label: "House notes or paint",
      done: input.noteCount > 0 || input.paintCount > 0,
    },
    { key: "homeShare", label: "HomeShare", done: input.householdShared },
  ];
  return {
    items,
    done: items.filter((item) => item.done).length,
    total: items.length,
  };
}
