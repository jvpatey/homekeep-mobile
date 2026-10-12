// deno-lint-ignore-file no-explicit-any
/**
 * Daily recall scan. Each piece of equipment is checked against the recall
 * agency for its home's country (the household owner's address):
 *   - US, or no address yet → CPSC (saferproducts.gov), queried per maker
 *   - Canada → Health Canada's daily open-data feed, filtered by brand, with
 *     candidate detail pages parsed for models (cached)
 * Matches go to equipment_recalls; notification-worker pushes new rows at
 * 08:00 local.
 *
 * Privileged only (service role or x-cron-secret). Query params:
 *   full=1           ignore the last run and re-check every recall
 *   source=cpsc|health_canada   run one source only (default: both)
 *   max_requests=N   CPSC request cap per run
 *   max_details=N    Health Canada detail-page fetch cap per run
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleOptions, jsonResponse } from "@shared/cors.ts";
import {
  createServiceClient,
  isPrivilegedRequest,
} from "@shared/notification-runner.ts";
import {
  fromCpsc,
  matchRecall,
  mentionsMakerInWords,
  normalizeManufacturer,
  recallCountry,
  recallFields,
  searchWords,
  type CpscRecall,
  type RecallCountry,
} from "@shared/recallMatch.ts";
import {
  HEALTH_CANADA_FEED_URL,
  feedSearchText,
  fromHealthCanada,
  isConsumerProduct,
  parseHealthCanadaDetail,
  type HealthCanadaDetail,
  type HealthCanadaFeedItem,
} from "@shared/healthCanadaRecalls.ts";

const CPSC_RECALL_URL =
  "https://www.saferproducts.gov/RestWebServices/Recall";
const DEFAULT_MAX_REQUESTS = 60;
const DEFAULT_MAX_DETAILS = 40;
const REQUEST_GAP_MS = 750;
const DETAIL_GAP_MS = 300;
const REQUEST_TIMEOUT_MS = 20_000;
const FEED_TIMEOUT_MS = 60_000;
const EQUIPMENT_PAGE_SIZE = 1000;
const IN_CHUNK = 300;
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
  ca_last_run_at: string | null;
}

interface ScanOptions {
  forceFull: boolean;
  now: Date;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

async function fetchWithTimeout(url: string, timeoutMs: number, accept: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { Accept: accept },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText} for ${url}`);
    }
    return response;
  } finally {
    clearTimeout(timer);
  }
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

/** Equipment id → recall country, from the household owner's (or user's) address. */
async function loadHomeCountries(
  supabase: any,
  rows: EquipmentRow[]
): Promise<Map<string, RecallCountry | null>> {
  const householdIds = [
    ...new Set(rows.map((row) => row.household_id).filter(Boolean)),
  ] as string[];
  const ownerByHousehold = new Map<string, string>();
  for (const ids of chunks(householdIds, IN_CHUNK)) {
    const { data, error } = await supabase
      .from("households")
      .select("id, created_by")
      .in("id", ids);
    if (error) throw error;
    for (const household of data ?? []) {
      ownerByHousehold.set(household.id, household.created_by);
    }
  }

  const profileFor = (row: EquipmentRow) =>
    (row.household_id && ownerByHousehold.get(row.household_id)) || row.user_id;
  const profileIds = [...new Set(rows.map(profileFor))];
  const countryByProfile = new Map<string, string | null>();
  for (const ids of chunks(profileIds, IN_CHUNK)) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, country")
      .in("id", ids);
    if (error) throw error;
    for (const profile of data ?? []) {
      countryByProfile.set(profile.id, profile.country ?? null);
    }
  }

  const result = new Map<string, RecallCountry | null>();
  for (const row of rows) {
    result.set(row.id, recallCountry(countryByProfile.get(profileFor(row))));
  }
  return result;
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

/** Equipment added or edited since the last pass needs the maker's full history. */
function groupNeedsFull(group: ManufacturerGroup, lastRun: Date | null): boolean {
  return (
    !lastRun ||
    group.items.some(
      (item) => !item.updated_at || new Date(item.updated_at) > lastRun
    )
  );
}

async function loadState(supabase: any): Promise<ScanState> {
  const { data, error } = await supabase
    .from("recall_scan_state")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  return {
    last_run_at: data?.last_run_at ?? null,
    cursor: data?.cursor ?? null,
    pass_started_at: data?.pass_started_at ?? null,
    ca_last_run_at: data?.ca_last_run_at ?? null,
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

async function upsertMatches(
  supabase: any,
  rows: Record<string, unknown>[]
): Promise<number> {
  if (rows.length === 0) return 0;
  // ignoreDuplicates keeps notified_at / dismissed_at on known recalls.
  const { data, error } = await supabase
    .from("equipment_recalls")
    .upsert(rows, {
      onConflict: "equipment_id,recall_number",
      ignoreDuplicates: true,
    })
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

// ---------------------------------------------------------------------------
// CPSC (US)
// ---------------------------------------------------------------------------

async function fetchCpscRecalls(
  manufacturer: string,
  since: Date | null
): Promise<CpscRecall[]> {
  const url = new URL(CPSC_RECALL_URL);
  url.searchParams.set("format", "json");
  url.searchParams.set("Manufacturer", manufacturer);
  if (since) url.searchParams.set("LastPublishDateStart", isoDate(since));
  const response = await fetchWithTimeout(
    url.toString(),
    REQUEST_TIMEOUT_MS,
    "application/json"
  );
  const body = await response.json();
  return Array.isArray(body) ? (body as CpscRecall[]) : [];
}

async function scanCpsc(
  supabase: any,
  equipment: EquipmentRow[],
  state: ScanState,
  options: ScanOptions & { maxRequests: number }
) {
  const { forceFull, now, maxRequests } = options;
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

  const groups = groupByManufacturer(equipment);
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
    const needsFull = groupNeedsFull(group, lastRun);

    if (requests > 0) await sleep(REQUEST_GAP_MS);
    requests++;

    let recalls: CpscRecall[];
    try {
      recalls = await fetchCpscRecalls(group.query, needsFull ? null : since);
    } catch (error) {
      fetchErrors++;
      console.warn(`CPSC fetch failed for "${group.query}"`, error);
      lastProcessed = group.key;
      continue;
    }
    recallsSeen += recalls.length;
    lastProcessed = group.key;

    for (const recall of recalls) {
      const candidate = fromCpsc(recall);
      if (!candidate) continue;
      for (const item of group.items) {
        const match = matchRecall(item, candidate);
        if (!match) continue;
        rows.push({
          equipment_id: item.id,
          user_id: item.user_id,
          household_id: item.household_id,
          matched_on: match.matchedOn,
          ...recallFields(candidate),
        });
      }
    }
  }

  const inserted = await upsertMatches(supabase, rows);

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

  return {
    equipment: equipment.length,
    manufacturers: groups.length,
    requests,
    fetch_errors: fetchErrors,
    recalls_seen: recallsSeen,
    matches: rows.length,
    inserted,
    incremental: since !== null,
    finished_pass: finishedPass,
    cursor: finishedPass ? null : lastProcessed,
  };
}

// ---------------------------------------------------------------------------
// Health Canada
// ---------------------------------------------------------------------------

async function fetchHealthCanadaFeed(): Promise<HealthCanadaFeedItem[]> {
  const response = await fetchWithTimeout(
    HEALTH_CANADA_FEED_URL,
    FEED_TIMEOUT_MS,
    "application/json"
  );
  const body = await response.json();
  // ~34k records across food, drugs and vehicles; keep consumer products only.
  return Array.isArray(body)
    ? (body as HealthCanadaFeedItem[]).filter(isConsumerProduct)
    : [];
}

async function loadCachedDetails(
  supabase: any,
  nids: string[]
): Promise<Map<string, HealthCanadaDetail>> {
  const cache = new Map<string, HealthCanadaDetail>();
  for (const ids of chunks(nids, IN_CHUNK)) {
    const { data, error } = await supabase
      .from("health_canada_recall_details")
      .select("nid, last_updated, recall_number, recall_date, hazard, remedy, product_text, companies")
      .in("nid", ids);
    if (error) throw error;
    for (const row of data ?? []) {
      cache.set(row.nid, { ...row, companies: row.companies ?? [] });
    }
  }
  return cache;
}

async function scanHealthCanada(
  supabase: any,
  equipment: EquipmentRow[],
  state: ScanState,
  options: ScanOptions & { maxDetails: number }
) {
  const { forceFull, now, maxDetails } = options;
  const startedAt = now.toISOString();
  const groups = groupByManufacturer(equipment);
  if (groups.length === 0) {
    await saveState(supabase, { ca_last_run_at: startedAt });
    return { equipment: 0, manufacturers: 0, candidates: 0, matches: 0, inserted: 0 };
  }

  const lastRun = forceFull || !state.ca_last_run_at
    ? null
    : new Date(state.ca_last_run_at);
  const sinceDay = lastRun
    ? isoDate(new Date(lastRun.getTime() - SINCE_OVERLAP_DAYS * 86_400_000))
    : null;

  const feed = (await fetchHealthCanadaFeed())
    .map((item) => ({
      item,
      nid: String(item.NID ?? "").trim(),
      updated: item["Last updated"] ?? "",
      words: searchWords(feedSearchText(item)),
    }))
    .filter((entry) => entry.nid);

  // Brand pre-filter: which feed items could concern which maker groups.
  const candidates = new Map<
    string,
    { item: HealthCanadaFeedItem; groups: ManufacturerGroup[] }
  >();
  for (const group of groups) {
    const needsFull = groupNeedsFull(group, lastRun);
    for (const { item, nid, updated, words } of feed) {
      if (!needsFull && sinceDay && updated < sinceDay) continue;
      if (!mentionsMakerInWords(words, group.key)) continue;
      const entry = candidates.get(nid);
      if (entry) entry.groups.push(group);
      else candidates.set(nid, { item, groups: [group] });
    }
  }

  const cache = await loadCachedDetails(supabase, [...candidates.keys()]);
  let detailFetches = 0;
  let fetchErrors = 0;
  let deferred = 0;
  const rows: Record<string, unknown>[] = [];

  for (const [nid, { item, groups: itemGroups }] of candidates) {
    let detail = cache.get(nid);
    const stale = !detail || detail.last_updated !== (item["Last updated"] ?? null);
    if (stale) {
      if (detailFetches >= maxDetails) {
        deferred++;
        continue;
      }
      if (detailFetches > 0) await sleep(DETAIL_GAP_MS);
      detailFetches++;
      try {
        const response = await fetchWithTimeout(
          item.URL ?? "",
          REQUEST_TIMEOUT_MS,
          "text/html"
        );
        detail = parseHealthCanadaDetail(await response.text(), item);
        const { error } = await supabase
          .from("health_canada_recall_details")
          .upsert({ ...detail, fetched_at: new Date().toISOString() });
        if (error) console.warn("Failed to cache Health Canada detail", nid, error);
      } catch (error) {
        fetchErrors++;
        console.warn(`Health Canada detail fetch failed for ${nid}`, error);
        continue;
      }
    }
    if (!detail) continue;

    const candidate = fromHealthCanada(item, detail);
    for (const group of itemGroups) {
      for (const equipmentRow of group.items) {
        const match = matchRecall(equipmentRow, candidate);
        if (!match) continue;
        rows.push({
          equipment_id: equipmentRow.id,
          user_id: equipmentRow.user_id,
          household_id: equipmentRow.household_id,
          matched_on: match.matchedOn,
          ...recallFields(candidate),
        });
      }
    }
  }

  const inserted = await upsertMatches(supabase, rows);

  // Capped or failed runs keep the old window; the detail cache means the
  // next run picks up where this one stopped instead of re-fetching.
  const complete = deferred === 0 && fetchErrors === 0;
  if (complete) {
    await saveState(supabase, {
      ca_last_run_at: startedAt,
      ...(lastRun === null ? { ca_last_full_run_at: startedAt } : {}),
    });
  }

  return {
    equipment: equipment.length,
    manufacturers: groups.length,
    feed_items: feed.length,
    candidates: candidates.size,
    detail_fetches: detailFetches,
    deferred,
    fetch_errors: fetchErrors,
    matches: rows.length,
    inserted,
    incremental: sinceDay !== null,
    complete,
  };
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
    const sourceParam = url.searchParams.get("source");
    const runCpsc = !sourceParam || sourceParam === "cpsc";
    const runHealthCanada = !sourceParam || sourceParam === "health_canada";
    const now = new Date();

    const supabase = createServiceClient();
    const state = await loadState(supabase);
    const equipment = await loadEquipment(supabase);
    const countries = await loadHomeCountries(supabase, equipment);
    const usEquipment = equipment.filter((row) => countries.get(row.id) === "US");
    const caEquipment = equipment.filter((row) => countries.get(row.id) === "CA");

    const cpsc = runCpsc
      ? await scanCpsc(supabase, usEquipment, state, {
          forceFull,
          now,
          maxRequests: positiveInt(
            url.searchParams.get("max_requests"),
            DEFAULT_MAX_REQUESTS
          ),
        })
      : null;

    let healthCanada: Record<string, unknown> | null = null;
    if (runHealthCanada) {
      try {
        healthCanada = await scanHealthCanada(supabase, caEquipment, state, {
          forceFull,
          now,
          maxDetails: positiveInt(
            url.searchParams.get("max_details"),
            DEFAULT_MAX_DETAILS
          ),
        });
      } catch (error) {
        // Keep the CPSC results; the Canadian window isn't advanced.
        console.error("Health Canada scan failed:", error);
        healthCanada = {
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    return jsonResponse({
      success: true,
      skipped_other_countries: equipment.filter(
        (row) => countries.get(row.id) === null
      ).length,
      // CPSC fields stay top-level for existing callers.
      ...(cpsc ?? {}),
      cpsc,
      health_canada: healthCanada,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("recall-scan error:", error);
    return jsonResponse({ error: "Internal server error", details: message }, 500);
  }
});
