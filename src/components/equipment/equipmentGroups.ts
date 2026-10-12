import { EquipmentType } from "../../types/equipmentManual";

export const EQUIPMENT_GROUPS: {
  title: string;
  tint: string;
  types: (EquipmentType | null)[];
}[] = [
  {
    title: "Heating and cooling",
    tint: "#C45C26",
    types: ["furnace", "ac", "heat_pump"],
  },
  {
    title: "Water",
    tint: "#3E7CB1",
    types: ["water_heater", "water_softener"],
  },
  {
    title: "Kitchen",
    tint: "#5B6C8F",
    types: ["fridge", "dishwasher", "stove", "range_hood", "microwave"],
  },
  { title: "Laundry", tint: "#8A6FB0", types: ["washer", "dryer"] },
  { title: "Outdoor", tint: "#4F8A3C", types: ["lawn_mower"] },
  { title: "Other", tint: "#6B645C", types: ["other", null] },
];

export function equipmentTint(type: EquipmentType | null | undefined) {
  return (
    EQUIPMENT_GROUPS.find((group) => group.types.includes(type ?? null))
      ?.tint ?? "#6B645C"
  );
}
