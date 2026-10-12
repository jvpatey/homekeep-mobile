import type { Ionicons } from "@expo/vector-icons";
import { HomeNote, NOTE_KINDS, NoteKind } from "../../types/homeNotes";

export interface NoteTemplate {
  kind: NoteKind;
  label: string;
  blurb: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  /** Prefilled title and body; body lines are "Label: " prompts. */
  title: string;
  body: string;
  placeholder: string;
}

export const NOTE_TEMPLATES: Record<NoteKind, NoteTemplate> = {
  wifi: {
    kind: "wifi",
    label: "Wi‑Fi",
    blurb: "Network and password",
    icon: "wifi",
    tint: "#3E7CB1",
    title: "Wi‑Fi",
    body: "Network: \nPassword: \nGuest network: \nGuest password: ",
    placeholder: "Network and password",
  },
  access: {
    kind: "access",
    label: "Keys and codes",
    blurb: "Spare key, garage, alarm",
    icon: "key",
    tint: "#C49A3C",
    title: "Keys and codes",
    body: "Spare key: \nGarage code: \nAlarm code: \nLockbox: ",
    placeholder: "Where the spare key is, door and alarm codes",
  },
  trash: {
    kind: "trash",
    label: "Trash day",
    blurb: "Pickup days and rules",
    icon: "trash",
    tint: "#2F5D50",
    title: "Trash and recycling",
    body: "Garbage: \nRecycling: \nCompost: \nBulk pickup: ",
    placeholder: "Pickup days and what goes where",
  },
  utilities: {
    kind: "utilities",
    label: "Utilities",
    blurb: "Providers and accounts",
    icon: "flash",
    tint: "#C45C26",
    title: "Utilities and accounts",
    body: "Power: \nWater: \nGas: \nInternet: ",
    placeholder: "Providers, account numbers, who to call",
  },
  yard: {
    kind: "yard",
    label: "Yard",
    blurb: "Sprinklers, lawn, garden",
    icon: "leaf",
    tint: "#5E7357",
    title: "Yard and sprinklers",
    body: "Sprinkler schedule: \nZones: \nLawn service: \nWinterizing: ",
    placeholder: "Sprinkler schedule, lawn service, garden notes",
  },
  guests: {
    kind: "guests",
    label: "Guests and sitters",
    blurb: "What a sitter will ask",
    icon: "people",
    tint: "#B5739D",
    title: "For guests and sitters",
    body: "Thermostat: \nTV and remotes: \nPets: \nIf something goes wrong: ",
    placeholder: "Everything a guest or house sitter needs",
  },
  quirks: {
    kind: "quirks",
    label: "House quirks",
    blurb: "The odd things only you know",
    icon: "sparkles",
    tint: "#7A6BB0",
    title: "House quirks",
    body: "",
    placeholder:
      "The back door sticks in summer. Jiggle the downstairs toilet handle…",
  },
  general: {
    kind: "general",
    label: "Blank note",
    blurb: "Start from scratch",
    icon: "document-text",
    tint: "#6B645C",
    title: "",
    body: "",
    placeholder:
      "Guest Wi‑Fi, where the spare key is, which breaker runs the garage…",
  },
};

export const NOTE_TEMPLATE_LIST = NOTE_KINDS.map(
  (kind) => NOTE_TEMPLATES[kind]
);

export function noteTemplate(note: Pick<HomeNote, "kind">): NoteTemplate {
  return NOTE_TEMPLATES[note.kind ?? "general"];
}

/** Body without the template's prompts that were never filled in. */
export function noteDisplayBody(note: Pick<HomeNote, "kind" | "body">): string {
  const prompts = new Set(
    noteTemplate(note)
      .body.split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
  );
  return note.body
    .split("\n")
    .filter((line) => !prompts.has(line.trim()))
    .join("\n")
    .trim();
}

export function noteShareText(
  note: Pick<HomeNote, "kind" | "title" | "body">
): string {
  return [note.title.trim(), noteDisplayBody(note)]
    .filter(Boolean)
    .join("\n\n");
}

function promptValue(body: string, label: RegExp): string | null {
  for (const line of body.split("\n")) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match && label.test(match[1].trim())) return match[2].trim();
  }
  return null;
}

export interface WifiDetails {
  network: string;
  password: string | null;
}

/** Main network from a Wi‑Fi note's "Network:" / "Password:" lines. */
export function parseWifiNote(
  note: Pick<HomeNote, "kind" | "body">
): WifiDetails | null {
  if (note.kind !== "wifi") return null;
  const network = promptValue(note.body, /^(network|ssid|wi-?fi)$/i);
  if (!network) return null;
  return { network, password: promptValue(note.body, /^password$/i) };
}

function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

/** Standard Wi‑Fi join payload the iPhone Camera recognises. */
export function wifiQrPayload({ network, password }: WifiDetails): string {
  const security = password ? "WPA" : "nopass";
  const pass = password ? `P:${escapeWifi(password)};` : "";
  return `WIFI:T:${security};S:${escapeWifi(network)};${pass};`;
}
