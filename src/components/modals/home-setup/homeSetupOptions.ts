import { Ionicons } from "@expo/vector-icons";
import type {
  FireplaceType,
  HomeFeatureFlag,
  HomeHeatSource,
  HomePropertyType,
  HomeSystems,
} from "../../../data/maintenancePlans";

type IconName = keyof typeof Ionicons.glyphMap;

export const PROPERTY_TYPE_TILES: {
  id: HomePropertyType;
  label: string;
  icon: IconName;
}[] = [
  { id: "house", label: "House", icon: "home-outline" },
  { id: "condo_townhome", label: "Condo or townhome", icon: "business-outline" },
];

/** Shorter labels than HOME_HEAT_SOURCE_OPTIONS so they fit two-up tiles. */
export const HEAT_SOURCE_TILES: {
  id: HomeHeatSource;
  label: string;
  icon: IconName;
}[] = [
  { id: "gas_furnace", label: "Gas furnace", icon: "flame-outline" },
  { id: "central_heat_pump", label: "Heat pump", icon: "swap-vertical-outline" },
  { id: "mini_split", label: "Mini-split", icon: "tablet-landscape-outline" },
  { id: "electric", label: "Electric baseboard", icon: "flash-outline" },
  { id: "oil", label: "Oil", icon: "color-fill-outline" },
  { id: "propane", label: "Propane", icon: "cube-outline" },
  { id: "geothermal", label: "Geothermal", icon: "earth-outline" },
  { id: "wood_pellet", label: "Wood or pellet stove", icon: "bonfire-outline" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal-circle-outline" },
];

/** Yes/no answers collected as one tap-all-that-apply grid. */
export type HomeHasKey =
  | "hasLawn"
  | "hasAirExchanger"
  | "hasWaterSoftener"
  | "hasRefrigeratorWaterFilter"
  | "hasVentHoodFilters"
  | "hasSeptic"
  | "hasPool"
  | "hasSpa"
  | HomeFeatureFlag
  | "fireplace";

export const HOME_HAS_GROUPS: {
  title: string;
  items: { id: HomeHasKey; label: string; icon: IconName }[];
}[] = [
  {
    title: "Inside",
    items: [
      { id: "hasRefrigeratorWaterFilter", label: "Fridge water filter", icon: "snow-outline" },
      { id: "hasVentHoodFilters", label: "Range hood filter", icon: "restaurant-outline" },
      { id: "fireplace", label: "Fireplace", icon: "flame-outline" },
      { id: "hasAirExchanger", label: "Air exchanger (HRV/ERV)", icon: "sync-outline" },
      { id: "hasWaterSoftener", label: "Water softener", icon: "beaker-outline" },
      { id: "hasSumpPump", label: "Sump pump", icon: "rainy-outline" },
    ],
  },
  {
    title: "Outside",
    items: [
      { id: "hasLawn", label: "Lawn", icon: "leaf-outline" },
      { id: "hasIrrigation", label: "Sprinklers", icon: "water-outline" },
      { id: "hasDeck", label: "Deck", icon: "grid-outline" },
      { id: "hasGarageDoor", label: "Garage door opener", icon: "car-outline" },
      { id: "hasPool", label: "Pool", icon: "umbrella-outline" },
      { id: "hasSpa", label: "Hot tub", icon: "thermometer-outline" },
    ],
  },
  {
    title: "Utilities",
    items: [
      { id: "hasWell", label: "Well water", icon: "funnel-outline" },
      { id: "hasSeptic", label: "Septic system", icon: "layers-outline" },
      { id: "hasGenerator", label: "Generator", icon: "flash-outline" },
      { id: "hasSolar", label: "Solar panels", icon: "sunny-outline" },
      { id: "hasEvCharger", label: "EV charger", icon: "battery-charging-outline" },
    ],
  },
];

export const FIREPLACE_FUEL_CHOICES: {
  id: Exclude<FireplaceType, "none">;
  label: string;
}[] = [
  { id: "wood", label: "Wood" },
  { id: "gas", label: "Gas" },
  { id: "electric", label: "Electric" },
];

export type PoolSanitizer = "salt" | "chlorine";

export const POOL_SANITIZER_CHOICES: { id: PoolSanitizer; label: string }[] = [
  { id: "salt", label: "Salt" },
  { id: "chlorine", label: "Chlorine" },
];

/** Keys already answered "yes" on a saved home. */
export function savedHomeHasKeys(
  home: HomeSystems | null | undefined
): HomeHasKey[] {
  if (!home) return [];
  const keys: HomeHasKey[] = [];
  for (const group of HOME_HAS_GROUPS) {
    for (const item of group.items) {
      if (item.id === "fireplace") {
        if (home.fireplaceType && home.fireplaceType !== "none") {
          keys.push("fireplace");
        }
      } else if (home[item.id] === true) {
        keys.push(item.id);
      }
    }
  }
  return keys;
}
