import type { Ionicons } from "@expo/vector-icons";
import type { HomeSystems } from "../../data/maintenancePlans/homeSystems";
import {
  HomeEmergencyFacts,
  HomeEmergencySpotKey,
  isEmergencySpotFilled,
  visibleEmergencySpotKeys,
} from "../../types/homeEmergency";
import type { ContactTrade } from "../../types/homeContact";

export interface BuiltInSpotMeta {
  key: HomeEmergencySpotKey;
  label: string;
  hint: string;
  howtoHint: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  trade: ContactTrade | null;
  /** Shown on the card in bold before anything else. */
  safety?: string;
}

export const BUILT_IN_SPOTS: Record<HomeEmergencySpotKey, BuiltInSpotMeta> = {
  waterShutoff: {
    key: "waterShutoff",
    label: "Main water shutoff",
    hint: "Basement wall, utility room, crawlspace…",
    howtoHint: "Turn clockwise until it stops",
    icon: "water",
    tint: "#2E86AB",
    trade: "plumber",
  },
  waterHeater: {
    key: "waterHeater",
    label: "Water heater",
    hint: "Utility closet, basement, garage…",
    howtoHint: "Close the cold inlet on top, then turn off gas or power",
    icon: "thermometer",
    tint: "#3E8E7E",
    trade: "plumber",
  },
  breakerPanel: {
    key: "breakerPanel",
    label: "Breaker panel",
    hint: "Where the main electrical panel lives",
    howtoHint: "The main breaker is the large switch at the top",
    icon: "flash",
    tint: "#D4A017",
    trade: "electrician",
  },
  gasShutoff: {
    key: "gasShutoff",
    label: "Gas shutoff",
    hint: "Meter outside, or the valve at the appliance",
    howtoHint: "Quarter-turn so the handle sits across the pipe",
    icon: "flame",
    tint: "#C0392B",
    trade: "hvac",
    safety:
      "Smell gas? Get everyone outside first, then call your gas utility or 911.",
  },
};

export const CUSTOM_SPOT_META = {
  hint: "Where to find it",
  howtoHint: "Any steps you'll need in a hurry",
  icon: "bookmark" as keyof typeof Ionicons.glyphMap,
  tint: "#7A6BB0",
};

/** One card on the Emergency info screen, built-in or custom. */
export interface EmergencySpotView {
  id: string;
  builtInKey: HomeEmergencySpotKey | null;
  /** File name stem for the photo in storage. */
  storageKey: string;
  label: string;
  hint: string;
  howtoHint: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  trade: ContactTrade | null;
  safety?: string;
  note: string;
  howto: string;
  photoPath: string | null;
  filled: boolean;
}

export function buildEmergencySpots(
  facts: HomeEmergencyFacts | null | undefined,
  home: HomeSystems | null | undefined
): EmergencySpotView[] {
  const builtIn = visibleEmergencySpotKeys(home).map((key) => {
    const meta = BUILT_IN_SPOTS[key];
    const spot = facts?.[key];
    return {
      id: key,
      builtInKey: key,
      storageKey: key,
      label: meta.label,
      hint: meta.hint,
      howtoHint: meta.howtoHint,
      icon: meta.icon,
      tint: meta.tint,
      trade: meta.trade,
      safety: meta.safety,
      note: spot?.note ?? "",
      howto: spot?.howto ?? "",
      photoPath: spot?.photo_storage_path ?? null,
      filled: isEmergencySpotFilled(spot),
    };
  });
  const custom = (facts?.custom ?? []).map((spot) => ({
    id: spot.id,
    builtInKey: null,
    storageKey: `custom_${spot.id}`,
    label: spot.label || "Custom spot",
    hint: CUSTOM_SPOT_META.hint,
    howtoHint: CUSTOM_SPOT_META.howtoHint,
    icon: CUSTOM_SPOT_META.icon,
    tint: CUSTOM_SPOT_META.tint,
    trade: null,
    note: spot.note ?? "",
    howto: spot.howto ?? "",
    photoPath: spot.photo_storage_path ?? null,
    filled: isEmergencySpotFilled(spot),
  }));
  return [...builtIn, ...custom];
}

/** Plain-text summary for Messages, Mail, or AirDrop. */
export function emergencyShareText(
  spots: EmergencySpotView[],
  address: string | null,
  contacts: { label: string; name: string; phone: string | null }[]
): string {
  const filled = spots.filter((spot) => spot.filled);
  const sections = filled.map((spot) =>
    [
      spot.label,
      spot.note.trim() ? `Where: ${spot.note.trim()}` : null,
      spot.howto.trim() ? `How: ${spot.howto.trim()}` : null,
      spot.safety ?? null,
    ]
      .filter(Boolean)
      .join("\n")
  );
  const calls = contacts
    .filter((contact) => contact.phone)
    .map((contact) => `${contact.label}: ${contact.name} · ${contact.phone}`);
  const hasPhotos = filled.some((spot) => spot.photoPath);
  return [
    address ? `Emergency info for ${address}` : "Emergency info",
    ...sections,
    calls.length > 0 ? ["Who to call", ...calls].join("\n") : null,
    hasPhotos ? "Photos of each spot are saved in HomeKeep." : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}
