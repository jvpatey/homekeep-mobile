export const PAINT_FINISHES = [
  "flat",
  "matte",
  "eggshell",
  "satin",
  "semi_gloss",
  "gloss",
] as const;

export type PaintFinish = (typeof PAINT_FINISHES)[number];

export const PAINT_FINISH_LABELS: Record<PaintFinish, string> = {
  flat: "Flat",
  matte: "Matte",
  eggshell: "Eggshell",
  satin: "Satin",
  semi_gloss: "Semi-gloss",
  gloss: "Gloss",
};

export interface PaintColor {
  id: string;
  /** e.g. "Living room walls", "Trim". */
  room: string;
  brand?: string | null;
  colorName?: string | null;
  /** Manufacturer code, e.g. "SW 7008" or "OC-17". */
  colorCode?: string | null;
  finish?: PaintFinish | null;
  /** "#RRGGBB" for the swatch. */
  hex?: string | null;
}

export const NOTE_KINDS = [
  "wifi",
  "access",
  "trash",
  "utilities",
  "yard",
  "guests",
  "quirks",
  "general",
] as const;

export type NoteKind = (typeof NOTE_KINDS)[number];

export interface HomeNote {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
  /** Template the note started from; drives its icon and colour. */
  kind?: NoteKind | null;
}

export interface HomeNotes {
  paints: PaintColor[];
  notes: HomeNote[];
}

export const EMPTY_HOME_NOTES: HomeNotes = { paints: [], notes: [] };

/** Close-enough swatches for common interior colours when the hex is unknown. */
export const PAINT_PALETTE: { hex: string; label: string }[] = [
  { hex: "#F4F1EA", label: "Warm white" },
  { hex: "#ECEDE8", label: "Cool white" },
  { hex: "#E3DCCB", label: "Cream" },
  { hex: "#CFC6B6", label: "Greige" },
  { hex: "#B9B3A8", label: "Taupe" },
  { hex: "#A7ABA9", label: "Light grey" },
  { hex: "#6E7370", label: "Charcoal" },
  { hex: "#2F3336", label: "Near black" },
  { hex: "#B8C7CF", label: "Pale blue" },
  { hex: "#5C7A93", label: "Slate blue" },
  { hex: "#2E3F5C", label: "Navy" },
  { hex: "#B9C4AE", label: "Sage" },
  { hex: "#5E7357", label: "Forest" },
  { hex: "#E8CFA8", label: "Sand" },
  { hex: "#C98B63", label: "Terracotta" },
  { hex: "#D9B9B3", label: "Blush" },
];

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Normalise "abc" / "#AABBCC" input to "#AABBCC"; null when invalid. */
export function normalizeHex(input: string | null | undefined): string | null {
  const match = input?.trim().match(HEX_PATTERN);
  if (!match) return null;
  const digits =
    match[1].length === 3
      ? match[1]
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : match[1];
  return `#${digits.toUpperCase()}`;
}

/** True when dark text reads better than white on the swatch. */
export function isLightHex(hex: string): boolean {
  const value = normalizeHex(hex);
  if (!value) return true;
  const r = parseInt(value.slice(1, 3), 16);
  const g = parseInt(value.slice(3, 5), 16);
  const b = parseInt(value.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}

export function paintTitle(paint: PaintColor): string {
  return paint.colorName?.trim() || paint.colorCode?.trim() || "Unnamed colour";
}

/** "Sherwin-Williams · SW 7008" */
export function paintSubtitle(paint: PaintColor): string | null {
  return (
    [paint.brand?.trim(), paint.colorName ? paint.colorCode?.trim() : null]
      .filter(Boolean)
      .join(" · ") || null
  );
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function parseHomeNotes(raw: unknown): HomeNotes {
  if (!raw || typeof raw !== "object") return { paints: [], notes: [] };
  const source = raw as { paints?: unknown; notes?: unknown };

  const paints: PaintColor[] = Array.isArray(source.paints)
    ? source.paints.flatMap((entry, index) => {
        if (!entry || typeof entry !== "object") return [];
        const row = entry as Record<string, unknown>;
        const room = str(row.room);
        const colorName = str(row.colorName);
        const colorCode = str(row.colorCode);
        if (!room && !colorName && !colorCode) return [];
        const finish = str(row.finish);
        return [
          {
            id: str(row.id) ?? `paint_${index}`,
            room: room ?? "",
            brand: str(row.brand),
            colorName,
            colorCode,
            finish: (PAINT_FINISHES as readonly string[]).includes(finish ?? "")
              ? (finish as PaintFinish)
              : null,
            hex: normalizeHex(str(row.hex)),
          },
        ];
      })
    : [];

  const notes: HomeNote[] = Array.isArray(source.notes)
    ? source.notes.flatMap((entry, index) => {
        if (!entry || typeof entry !== "object") return [];
        const row = entry as Record<string, unknown>;
        const title = str(row.title);
        const body = typeof row.body === "string" ? row.body : "";
        if (!title && !body.trim()) return [];
        const kind = str(row.kind);
        return [
          {
            id: str(row.id) ?? `note_${index}`,
            title: title ?? "",
            body,
            updatedAt: str(row.updatedAt) ?? new Date(0).toISOString(),
            kind: (NOTE_KINDS as readonly string[]).includes(kind ?? "")
              ? (kind as NoteKind)
              : null,
          },
        ];
      })
    : [];

  return { paints, notes };
}
