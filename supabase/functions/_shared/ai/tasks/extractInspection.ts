// deno-lint-ignore-file no-explicit-any
import {
  bytesToBase64,
  generateJson,
  type GeminiPart,
  INLINE_DATA_MAX_BYTES,
  uploadFile,
} from "../gemini.ts";
import { type AiTask, cleanString, TaskInputError } from "./types.ts";

const BUCKET = "equipment-manuals";
const MAX_FILE_BYTES = 45 * 1024 * 1024;
const MAX_FINDINGS = 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CATEGORIES = [
  "HVAC",
  "PLUMBING",
  "ELECTRICAL",
  "APPLIANCES",
  "EXTERIOR",
  "INTERIOR",
  "LANDSCAPING",
  "SAFETY",
  "GENERAL",
] as const;
const SEVERITIES = ["safety", "major", "minor", "maintenance"] as const;
const ACTIONS = ["repair", "routine", "monitor"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
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

interface InspectionInput {
  documentId: string;
  refresh: boolean;
}

const SCHEMA = {
  type: "OBJECT",
  properties: {
    is_inspection_report: { type: "BOOLEAN" },
    summary: { type: "STRING", nullable: true },
    findings: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          detail: { type: "STRING", nullable: true },
          location: { type: "STRING", nullable: true },
          severity: { type: "STRING", enum: [...SEVERITIES] },
          category: { type: "STRING", enum: [...CATEGORIES] },
          action: { type: "STRING", enum: [...ACTIONS] },
          priority: { type: "STRING", enum: [...PRIORITIES] },
          suggested_interval_days: { type: "INTEGER", nullable: true },
          equipment_hint: { type: "STRING", enum: [...EQUIPMENT_TYPES], nullable: true },
          page: { type: "INTEGER", nullable: true },
        },
        required: ["title", "severity", "category", "action", "priority"],
      },
    },
  },
  required: ["is_inspection_report", "findings"],
};

const SYSTEM = `You turn a home inspection report into a homeowner's to-do list.
Read the whole report, including summary pages, defect lists, and photo captions.

For each distinct issue or recommendation, return one finding:
- title: a short imperative task a homeowner would put on a list ("Replace cracked GFCI outlet in kitchen", "Clean gutters and extend downspouts"). Under 60 characters. No inspector jargon.
- detail: one or two plain sentences on what the inspector saw and why it matters.
- location: where in or around the house, if stated.
- severity: "safety" for hazards (fire, shock, CO, gas, trip/fall, structural danger); "major" for costly or worsening defects; "minor" for small fixes; "maintenance" for routine upkeep the inspector recommends.
- action: "repair" for a one-time fix; "routine" for something to do on a recurring schedule (then set suggested_interval_days, e.g. 365 for annual furnace service, 180 for gutter cleaning); "monitor" for things to keep an eye on.
- priority: "urgent" for safety items, "high" for major, "medium" for minor, "low" for monitor/maintenance unless the report says otherwise.
- category: the closest fit.
- equipment_hint: the appliance or system it concerns, if one of the allowed values fits.
- page: the report page number where it appears, if you can tell.

Merge duplicates (the same issue in the summary and the body is one finding). Skip boilerplate, disclaimers, and items marked satisfactory with no recommendation.
summary: two sentences on the overall condition and the most important items.
is_inspection_report: false if this document is not a home inspection report.`;

function clamp<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function normalizeFindings(raw: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const item of raw) {
    const title = cleanString(item?.title, 80);
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const action = clamp(item?.action, ACTIONS, "repair");
    const interval = Math.round(Number(item?.suggested_interval_days));
    const page = Math.round(Number(item?.page));
    out.push({
      id: `f${out.length + 1}`,
      title,
      detail: cleanString(item?.detail, 400),
      location: cleanString(item?.location, 80),
      severity: clamp(item?.severity, SEVERITIES, "minor"),
      category: clamp(item?.category, CATEGORIES, "GENERAL"),
      action,
      priority: clamp(item?.priority, PRIORITIES, "medium"),
      suggested_interval_days:
        action === "routine" && Number.isFinite(interval) && interval >= 7 && interval <= 3650
          ? interval
          : action === "routine"
            ? 365
            : null,
      equipment_hint: EQUIPMENT_TYPES.includes(item?.equipment_hint) ? item.equipment_hint : null,
      page: Number.isFinite(page) && page > 0 ? page : null,
    });
    if (out.length >= MAX_FINDINGS) break;
  }
  const rank = { safety: 0, major: 1, minor: 2, maintenance: 3 } as Record<string, number>;
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export const extractInspection: AiTask<InspectionInput> = {
  feature: "extract_inspection",

  parse(body) {
    const documentId = typeof body.document_id === "string" ? body.document_id : "";
    if (!UUID.test(documentId)) throw new TaskInputError("Missing document");
    return { documentId, refresh: body.refresh === true };
  },

  async run(ctx, input) {
    const { data: doc, error } = await ctx.userClient
      .from("documents")
      .select("id, kind, storage_path, mime_type, ai_extraction")
      .eq("id", input.documentId)
      .maybeSingle();
    if (error) throw error;
    if (!doc) throw new TaskInputError("Document not found", "not_found");
    if (!doc.storage_path) {
      throw new TaskInputError("Attach the report file first", "no_file");
    }

    const cached = doc.ai_extraction;
    if (!input.refresh && cached?.storage_path === doc.storage_path && Array.isArray(cached?.findings)) {
      const { storage_path: _path, ...result } = cached;
      return { result, usage: null };
    }

    const mime = String(doc.mime_type ?? "application/pdf");
    if (mime !== "application/pdf" && !mime.startsWith("image/")) {
      throw new TaskInputError("Inspection import reads PDFs and photos", "unsupported_file");
    }

    const { data: blob, error: downloadError } = await ctx.userClient.storage
      .from(BUCKET)
      .download(doc.storage_path);
    if (downloadError || !blob) throw downloadError ?? new Error("Download failed");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (bytes.byteLength > MAX_FILE_BYTES) {
      throw new TaskInputError("That report is too large to read", "too_large");
    }

    const filePart: GeminiPart =
      bytes.byteLength <= INLINE_DATA_MAX_BYTES
        ? { inlineData: { mimeType: mime, data: bytesToBase64(bytes) } }
        : { fileData: await uploadFile(bytes, mime, `inspection-${doc.id}`) };

    const response = await generateJson<any>({
      system: SYSTEM,
      schema: SCHEMA,
      temperature: 0.1,
      maxOutputTokens: 16384,
      timeoutMs: 130_000,
      retry: false,
      thinking: "low",
      contents: [
        {
          role: "user",
          parts: [filePart, { text: "Extract the findings from this inspection report." }],
        },
      ],
    });

    if (response.data?.is_inspection_report === false) {
      throw new TaskInputError(
        "This doesn't look like a home inspection report",
        "not_inspection"
      );
    }

    const result = {
      summary: cleanString(response.data?.summary, 600),
      findings: normalizeFindings(Array.isArray(response.data?.findings) ? response.data.findings : []),
      extracted_at: new Date().toISOString(),
    };

    const { error: saveError } = await ctx.supabase
      .from("documents")
      .update({ ai_extraction: { ...result, storage_path: doc.storage_path } })
      .eq("id", doc.id);
    if (saveError) console.warn("Couldn't cache inspection extraction", saveError);

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
