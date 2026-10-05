import type { Ionicons } from "@expo/vector-icons";

export const CONTACT_TRADES = [
  "plumber",
  "electrician",
  "hvac",
  "handyman",
  "roofer",
  "landscaper",
  "cleaner",
  "pest",
  "appliance",
  "painter",
  "carpenter",
  "other",
] as const;

export type ContactTrade = (typeof CONTACT_TRADES)[number];

export const CONTACT_TRADE_META: Record<
  ContactTrade,
  {
    label: string;
    plural: string;
    icon: keyof typeof Ionicons.glyphMap;
    tint: string;
  }
> = {
  plumber: {
    label: "Plumber",
    plural: "Plumbing",
    icon: "water",
    tint: "#2E86AB",
  },
  electrician: {
    label: "Electrician",
    plural: "Electrical",
    icon: "flash",
    tint: "#D4A017",
  },
  hvac: {
    label: "HVAC",
    plural: "Heating & cooling",
    icon: "thermometer",
    tint: "#C0392B",
  },
  handyman: {
    label: "Handyperson",
    plural: "Handyperson",
    icon: "hammer",
    tint: "#6B645C",
  },
  roofer: { label: "Roofer", plural: "Roofing", icon: "home", tint: "#8E5B3E" },
  landscaper: {
    label: "Landscaper",
    plural: "Yard & garden",
    icon: "leaf",
    tint: "#3E8E5E",
  },
  cleaner: {
    label: "Cleaner",
    plural: "Cleaning",
    icon: "sparkles",
    tint: "#5B8FB9",
  },
  pest: {
    label: "Pest control",
    plural: "Pest control",
    icon: "bug",
    tint: "#7A6A3A",
  },
  appliance: {
    label: "Appliance repair",
    plural: "Appliances",
    icon: "construct",
    tint: "#5B6C8F",
  },
  painter: {
    label: "Painter",
    plural: "Painting",
    icon: "color-palette",
    tint: "#B5739D",
  },
  carpenter: {
    label: "Carpenter",
    plural: "Carpentry",
    icon: "cube",
    tint: "#A0703C",
  },
  other: { label: "Other", plural: "Other", icon: "person", tint: "#7D7D7D" },
};

export function tradeMeta(trade: string | null | undefined) {
  return (
    CONTACT_TRADE_META[(trade as ContactTrade) ?? "other"] ??
    CONTACT_TRADE_META.other
  );
}

export interface HomeContact {
  id: string;
  household_id: string | null;
  user_id: string;
  name: string;
  company: string | null;
  trade: ContactTrade | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  notes: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HomeContactInput {
  name: string;
  company?: string | null;
  trade?: ContactTrade | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  notes?: string | null;
}

/** Digits and a leading + only, for tel:/sms: links. */
export function dialablePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d+]/g, "");
  return digits.replace(/(?!^)\+/g, "").length >= 3 ? digits : null;
}

export function contactInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}
