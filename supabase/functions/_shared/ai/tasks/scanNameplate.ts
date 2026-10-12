import { generateJson } from "../gemini.ts";
import { type AiTask, cleanString, TaskInputError } from "./types.ts";

/** Mirrors EQUIPMENT_TYPES in src/types/equipmentManual.ts. */
const EQUIPMENT_TYPES = [
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

type EquipmentType = (typeof EQUIPMENT_TYPES)[number];
type Confidence = "high" | "medium" | "low";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const MAX_BASE64_CHARS = 4 * 1024 * 1024;

interface ScanInput {
  imageBase64: string;
  mimeType: string;
}

interface RawScan {
  is_nameplate?: boolean;
  manufacturer?: string | null;
  model_number?: string | null;
  serial_number?: string | null;
  equipment_type?: string | null;
  manufactured_year?: number | null;
  confidence?: {
    manufacturer?: Confidence;
    model_number?: Confidence;
    serial_number?: Confidence;
    equipment_type?: Confidence;
  };
}

export interface NameplateScanResult {
  manufacturer: string | null;
  model_number: string | null;
  serial_number: string | null;
  equipment_type: EquipmentType | null;
  manufactured_year: number | null;
  confidence: {
    manufacturer: Confidence;
    model_number: Confidence;
    serial_number: Confidence;
    equipment_type: Confidence;
  };
}

const CONFIDENCE = { type: "STRING", enum: ["high", "medium", "low"] };

const SCHEMA = {
  type: "OBJECT",
  properties: {
    is_nameplate: { type: "BOOLEAN" },
    manufacturer: { type: "STRING", nullable: true },
    model_number: { type: "STRING", nullable: true },
    serial_number: { type: "STRING", nullable: true },
    equipment_type: { type: "STRING", enum: [...EQUIPMENT_TYPES], nullable: true },
    manufactured_year: { type: "INTEGER", nullable: true },
    confidence: {
      type: "OBJECT",
      properties: {
        manufacturer: CONFIDENCE,
        model_number: CONFIDENCE,
        serial_number: CONFIDENCE,
        equipment_type: CONFIDENCE,
      },
      required: ["manufacturer", "model_number", "serial_number", "equipment_type"],
    },
  },
  required: ["is_nameplate", "confidence"],
};

const SYSTEM = `You read rating plates (nameplates / data labels) on home equipment and appliances.
Extract exactly what is printed. Never invent or guess characters you cannot read.

- manufacturer: the brand as printed (e.g. "Rheem", "Carrier", "Whirlpool"). Use the consumer brand, not the parent company, unless only the parent is printed.
- model_number: the value labelled Model, Model No., M/N, or MOD. Keep dashes and slashes; remove spaces inside the code.
- serial_number: the value labelled Serial, Serial No., S/N, or SER. Remove spaces inside the code.
- equipment_type: pick the closest of the allowed values from the label text and photo (gas input in BTU/h with "furnace" -> furnace; tank capacity in gallons/litres -> water_heater; "condensing unit" -> ac; "heat pump" -> heat_pump). Use "other" if none fit, null if you cannot tell.
- manufactured_year: only if a manufacture date is printed, or the brand's serial-number date code is well known and unambiguous. Otherwise null.
- confidence per field: "high" when clearly legible, "medium" when partly obscured, "low" when guessed from fragments. Use "low" for null fields.
- is_nameplate: false if the photo does not show an equipment label at all.`;

/**
 * Codes are a few alphanumeric chunks with a digit somewhere; reject prose
 * like "maybe something like 58".
 */
function looksLikeCode(value: string): boolean {
  const tokens = value.split(" ");
  const words = tokens.filter((token) => /^[a-z]{3,}$/i.test(token));
  if (words.length >= 2 || !/\d/.test(value)) return false;
  return /^[A-Z0-9][A-Z0-9\-/.#]{2,39}$/i.test(tokens.join(""));
}

export const scanNameplate: AiTask<ScanInput> = {
  feature: "scan_nameplate",

  parse(body) {
    const imageBase64 =
      typeof body.image_base64 === "string" ? body.image_base64 : "";
    const mimeType =
      typeof body.mime_type === "string" ? body.mime_type : "image/jpeg";
    if (!imageBase64) throw new TaskInputError("Missing image_base64");
    if (imageBase64.length > MAX_BASE64_CHARS) {
      throw new TaskInputError("Image is too large", "too_large");
    }
    if (!ALLOWED_MIME.has(mimeType)) {
      throw new TaskInputError("Unsupported image type");
    }
    return { imageBase64, mimeType };
  },

  async run(_ctx, input) {
    const response = await generateJson<RawScan>({
      system: SYSTEM,
      schema: SCHEMA,
      temperature: 0,
      maxOutputTokens: 512,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: input.mimeType, data: input.imageBase64 } },
            { text: "Read this equipment label." },
          ],
        },
      ],
    });

    const raw = response.data;
    if (raw.is_nameplate === false) {
      throw new TaskInputError("That doesn't look like a label", "not_nameplate");
    }

    const conf = {
      manufacturer: raw.confidence?.manufacturer ?? "low",
      model_number: raw.confidence?.model_number ?? "low",
      serial_number: raw.confidence?.serial_number ?? "low",
      equipment_type: raw.confidence?.equipment_type ?? "low",
    };

    const code = (value: unknown, confidence: Confidence) => {
      const cleaned = cleanString(value, 60);
      if (!cleaned) return null;
      if (!looksLikeCode(cleaned) && confidence === "low") return null;
      return cleaned.replace(/\s+/g, "").slice(0, 40).toUpperCase();
    };

    const type = EQUIPMENT_TYPES.includes(raw.equipment_type as EquipmentType)
      ? (raw.equipment_type as EquipmentType)
      : null;
    const year = Number(raw.manufactured_year);
    const thisYear = new Date().getUTCFullYear();

    const result: NameplateScanResult = {
      manufacturer: cleanString(raw.manufacturer, 60),
      model_number: code(raw.model_number, conf.model_number),
      serial_number: code(raw.serial_number, conf.serial_number),
      equipment_type: type,
      manufactured_year:
        Number.isInteger(year) && year >= 1950 && year <= thisYear ? year : null,
      confidence: conf,
    };

    if (!result.manufacturer && !result.model_number && !result.serial_number) {
      throw new TaskInputError("Couldn't read the label", "unreadable");
    }

    return {
      result,
      usage: {
        model: response.model,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
      },
    };
  },
};
