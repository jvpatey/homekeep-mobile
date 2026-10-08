// deno-lint-ignore-file no-explicit-any
/**
 * Daily CPSC recall scan. Groups equipment by normalized manufacturer, asks
 * saferproducts.gov for that maker's recalls, and writes matches to
 * equipment_recalls. notification-worker pushes new rows at 08:00 local.
 *
 * Privileged only (service role or x-cron-secret). Query params:
 *   full=1           ignore last_run_at and fetch every recall per maker
 *   max_requests=N   override the per-run request cap
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleOptions, jsonResponse } from "@shared/cors.ts";
import {
  createServiceClient,
  isPrivilegedRequest,
} from "@shared/notification-runner.ts";
import {
  matchRecall,
  normalizeManufacturer,
  recallFields,
  type CpscRecall,
} from "@shared/recallMatch.ts";

const CPSC_RECALL_URL =
  "https://www.saferproducts.gov/RestWebServices/Recall";
const DEFAULT_MAX_REQUESTS = 60;
const REQUEST_GAP_MS = 750;
const REQUEST_TIMEOUT_MS = 20_000;
const EQUIPMENT_PAGE_SIZE = 1000;
/** Re-read a day of overlap so recalls published mid-run aren't missed. */
const SINCE_OVERLAP_DAYS = 1;

interface EquipmentRow {
  id: string;
  user_id: string;
  household_id: string | null;
  name: string | null;
  manufacturer: string | null;
  model_number: string | null;
  updated_at: string | null;
}

interface ManufacturerGroup {
  key: string;
  query: string;
  items: EquipmentRow[];
}

interface ScanState {
  last_run_at: string | null;
  cursor: string | null;
  pass_started_at: string | null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function loadEquipment(supabase: any): Promise<EquipmentRow[]> {
  const rows: EquipmentRow[] = [];
  for (let from = 0; ; from += EQUIPMENT_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("equipment_manuals")
      .select("id, user_id, household_id, name, manufacturer, model_number, updated_at")
      .not("manufacturer", "is", null)
      .order("id")
      .range(from, from + EQUIPMENT_PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...((data || []) as EquipmentRow[]));
    if (!data || data.length < EQUIPMENT_PAGE_SIZE) break;
  }
  return rows;
}

/** "Rheem Manufacturing Co." → "Rheem Manufacturing" for the API's name search. */
function searchTerm(raw: string): string {
  return raw
    .trim()
    .replace(/[,.]?\s+(inc|llc|ltd|corp|corporation|co|company)\.?$/i, "")
    .trim();
}

function groupByManufacturer(rows: EquipmentRow[]): ManufacturerGroup[] {
  const groups = new Map<string, ManufacturerGroup>();
  for (const row of rows) {
    const key = normalizeManufacturer(row.manufacturer);
    // Single letters match far too broadly.
    if (key.length < 2) continue;
    const group = groups.get(key);
    if (group) {
      group.items.push(row);
    } else {
      groups.set(key, {
        key,
        query: searchTerm(row.manufacturer ?? "") || key,
        items: [row],
      });
    }
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}

async function fetchRecalls(
  manufacturer: string,
  since: Date | null
): Promise<CpscRecall[]> {
  const url = new URL(CPSC_RECALL_URL);
  url.searchParams.set("format", "json");
  url.searchParams.set("Manufacturer", manufacturer);
  if (since) url.searchParams.set("LastPublishDateStart", isoDate(since));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`CPSC ${response.status} ${response.statusText}`);
    }
    const body = await response.json();
    return Array.isArray(body) ? (body as CpscRecall[]) : [];
  } finally {
    clearTimeout(timer);
  }
}

async function loadState(supabase: any): Promise<ScanState> {
  const { data, error } = await supabase
    .from("recall_scan_state")
    .select("last_run_at, cursor, pass_started_at")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  return {
    last_run_at: data?.last_run_at ?? null,
    cursor: data?.cursor ?? null,
    pass_started_at: data?.pass_started_at ?? null,
  };
}

async function saveState(
  supabase: any,
  patch: Record<string, string | null>
): Promise<void> {
  const { error } = await supabase
    .from("recall_scan_state")
    .upsert({ id: true, ...patch, updated_at: new Date().toISOString() });
  if (error) console.error("Failed to save recall_scan_state", error);
}

serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  if (!isPrivilegedRequest(req)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const url = new URL(req.url);
    const forceFull = url.searchParams.get("full") === "1";
    const maxParam = Number(url.searchParams.get("max_requests"));
    const maxRequests =
      Number.isFinite(maxParam) && maxParam > 0
        ? Math.floor(maxParam)
        : DEFAULT_MAX_REQUESTS;

    const supabase = createServiceClient();
    const now = new Date();
    const state = await loadState(supabase);

    // A capped pass resumes from its cursor; a full=1 run starts over.
    const resuming = !forceFull && !!state.cursor;
    const passStartedAt = resuming && state.pass_started_at
      ? state.pass_started_at
      : now.toISOString();
    const lastRun = forceFull || !state.last_run_at
      ? null
      : new Date(state.last_run_at);
    const since = lastRun
      ? new Date(lastRun.getTime() - SINCE_OVERLAP_DAYS * 86_400_000)
      : null;

    const groups = groupByManufacturer(await loadEquipment(supabase));
    const pending = resuming
      ? groups.filter((group) => group.key > (state.cursor as string))
      : groups;

    let requests = 0;
    let fetchErrors = 0;
    let recallsSeen = 0;
    let lastProcessed: string | null = null;
    const rows: Record<string, unknown>[] = [];

    for (const group of pending) {
      if (requests >= maxRequests) break;

      // Equipment added or edited since the last pass needs the maker's
      // full history, not just newly published recalls.
      const needsFull =
        !since ||
        group.items.some(
          (item) => !item.updated_at || new Date(item.updated_at) > (lastRun as Date)
        );

      if (requests > 0) await sleep(REQUEST_GAP_MS);
      requests++;

      let recalls: CpscRecall[];
      try {
        recalls = await fetchRecalls(group.query, needsFull ? null : since);
      } catch (error) {
        fetchErrors++;
        console.warn(`CPSC fetch failed for "${group.query}"`, error);
        lastProcessed = group.key;
        continue;
      }
      recallsSeen += recalls.length;
      lastProcessed = group.key;

      for (const recall of recalls) {
        const fields = recallFields(recall);
        if (!fields) continue;
        for (const item of group.items) {
          const match = matchRecall(item, recall);
          if (!match) continue;
          rows.push({
            equipment_id: item.id,
            user_id: item.user_id,
            household_id: item.household_id,
            matched_on: match.matchedOn,
            ...fields,
          });
        }
      }
    }

    let inserted = 0;
    if (rows.length > 0) {
      // ignoreDuplicates keeps notified_at / dismissed_at on known recalls.
      const { data, error } = await supabase
        .from("equipment_recalls")
        .upsert(rows, {
          onConflict: "equipment_id,recall_number",
          ignoreDuplicates: true,
        })
        .select("id");
      if (error) throw error;
      inserted = data?.length ?? 0;
    }

    const finishedPass =
      lastProcessed === null || pending[pending.length - 1]?.key === lastProcessed;

    if (finishedPass) {
      // After fetch errors, keep the old window so the next pass re-reads
      // whatever this one missed.
      const advance = fetchErrors === 0;
      await saveState(supabase, {
        cursor: null,
        pass_started_at: null,
        ...(advance ? { last_run_at: passStartedAt } : {}),
        ...(advance && lastRun === null
          ? { last_full_run_at: now.toISOString() }
          : {}),
      });
    } else {
      await saveState(supabase, {
        cursor: lastProcessed,
        pass_started_at: passStartedAt,
      });
    }

    return jsonResponse({
      success: true,
      manufacturers: groups.length,
      requests,
      fetch_errors: fetchErrors,
      recalls_seen: recallsSeen,
      matches: rows.length,
      inserted,
      incremental: since !== null,
      finished_pass: finishedPass,
      cursor: finishedPass ? null : lastProcessed,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("recall-scan error:", error);
    return jsonResponse({ error: "Internal server error", details: message }, 500);
  }
});
