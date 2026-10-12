import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { EquipmentType } from "../types/equipmentManual";
import type { MaintenanceCategory, Priority } from "../types/maintenance";

/** Free lifetime scans; mirrors AI_POLICY in supabase/functions/_shared/ai/quota.ts. */
export const AI_FREE_SCAN_LIMIT = 3;

export type AiErrorCode =
  | "unauthorized"
  | "quota_exhausted"
  | "plus_required"
  | "rate_limited"
  | "bad_input"
  | "model_error"
  | "network";

export class AiError extends Error {
  constructor(
    readonly code: AiErrorCode,
    message: string,
    readonly reason?: string
  ) {
    super(message);
  }
}

export type ScanConfidence = "high" | "medium" | "low";

export interface NameplateScanResult {
  manufacturer: string | null;
  model_number: string | null;
  serial_number: string | null;
  equipment_type: EquipmentType | null;
  manufactured_year: number | null;
  confidence: Record<
    "manufacturer" | "model_number" | "serial_number" | "equipment_type",
    ScanConfidence
  >;
}

export interface AssistantMessage {
  role: "user" | "assistant";
  text: string;
}

export type AssistantAction =
  | {
      type: "create_routine";
      title: string;
      category: MaintenanceCategory;
      interval_days: number;
      description: string | null;
    }
  | { type: "open_emergency"; label: string };

export interface AssistantReply {
  reply: string;
  actions: AssistantAction[];
}

export type FindingSeverity = "safety" | "major" | "minor" | "maintenance";
export type FindingAction = "repair" | "routine" | "monitor";

export interface InspectionFinding {
  id: string;
  title: string;
  detail: string | null;
  location: string | null;
  severity: FindingSeverity;
  category: MaintenanceCategory;
  action: FindingAction;
  priority: Priority;
  suggested_interval_days: number | null;
  equipment_hint: EquipmentType | null;
  page: number | null;
}

export interface InspectionExtraction {
  summary: string | null;
  findings: InspectionFinding[];
  extracted_at: string;
}

interface Envelope<T> {
  result: T;
  /** Free calls left for this feature; null for HomeKeep + members. */
  remaining: number | null;
}

async function invoke<T>(
  task: string,
  payload: Record<string, unknown>
): Promise<Envelope<T>> {
  if (!supabase) throw new AiError("network", "Not configured");
  const { data, error } = await supabase.functions.invoke("homekeep-ai", {
    body: { task, ...payload },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      const info = body?.error;
      if (info?.code) {
        throw new AiError(info.code, info.message ?? "Please try again.", info.reason);
      }
    }
    throw new AiError("network", "Couldn't connect. Check your connection and try again.");
  }
  return data as Envelope<T>;
}

export class AiService {
  static scanNameplate(imageBase64: string, mimeType = "image/jpeg") {
    return invoke<NameplateScanResult>("scan_nameplate", {
      image_base64: imageBase64,
      mime_type: mimeType,
    });
  }

  static chat(messages: AssistantMessage[], equipmentId?: string | null) {
    return invoke<AssistantReply>("assistant_chat", {
      messages,
      equipment_id: equipmentId ?? null,
    });
  }

  static extractInspection(documentId: string, refresh = false) {
    return invoke<InspectionExtraction>("extract_inspection", {
      document_id: documentId,
      refresh,
    });
  }

  /** Successful scans so far (RLS limits rows to the caller). */
  static async scansUsed(): Promise<number> {
    if (!supabase) return 0;
    const { count, error } = await supabase
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("feature", "scan_nameplate")
      .eq("status", "ok");
    if (error) return 0;
    return count ?? 0;
  }
}
