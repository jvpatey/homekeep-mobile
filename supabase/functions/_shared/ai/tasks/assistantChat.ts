// deno-lint-ignore-file no-explicit-any
import { generateJson, type GeminiContent } from "../gemini.ts";
import { buildHomeContext } from "../homeContext.ts";
import { type AiTask, cleanString, TaskInputError } from "./types.ts";

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

// Mirrors src/types (equipmentManual, homeNotes, homeContact, homeEmergency).
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
const PAINT_FINISHES = ["flat", "matte", "eggshell", "satin", "semi_gloss", "gloss"] as const;
const NOTE_KINDS = ["wifi", "access", "trash", "utilities", "yard", "guests", "quirks", "general"] as const;
const CONTACT_TRADES = [
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
const EMERGENCY_SPOTS = ["waterShutoff", "waterHeater", "breakerPanel", "gasShutoff", "custom"] as const;

const ACTION_TYPES = [
  "create_routine",
  "create_task",
  "log_repair",
  "add_equipment",
  "update_equipment",
  "add_paint",
  "add_note",
  "add_pro",
  "set_emergency_spot",
  "open_emergency",
] as const;

const MAX_TURNS = 12;
const MAX_CHARS = 2000;
const MAX_ACTIONS = 3;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HEX = /^#[0-9a-f]{6}$/i;

interface ChatInput {
  messages: { role: "user" | "assistant"; text: string }[];
  equipmentId: string | null;
  /** The user's local date (YYYY-MM-DD); null falls back to UTC. */
  today: string | null;
}

const DAY_MS = 86_400_000;
const GUIDE_DAYS = 14;

/** Accepts the client's local date only if it's within a day of UTC now. */
function clientToday(value: unknown): string | null {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return null;
  const at = Date.parse(`${value}T12:00:00Z`);
  if (Number.isNaN(at) || Math.abs(at - Date.now()) > 1.5 * DAY_MS) return null;
  return value;
}

/** Day-number lookup so the model never does calendar arithmetic itself. */
export function dateGuide(today: string): string {
  const base = Date.parse(`${today}T12:00:00Z`);
  const label = (offset: number) =>
    new Date(base + offset * DAY_MS).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  const rows = Array.from({ length: GUIDE_DAYS + 1 }, (_, offset) => {
    const tag = offset === 0 ? " (today)" : offset === 1 ? " (tomorrow)" : "";
    return `${offset} = ${label(offset)}${tag}`;
  });
  return [
    `Today is ${label(0)}, ${today.slice(0, 4)}.`,
    `Day numbers for due_in_days (ahead) and days_ago (back; 1 = yesterday):`,
    ...rows,
    `"Saturday" or "this weekend" means the next one on this list. Beyond two weeks, count the days from today.`,
  ].join("\n");
}

const str = { type: "STRING", nullable: true };
const int = { type: "INTEGER", nullable: true };
const oneOf = (values: readonly string[]) => ({ type: "STRING", enum: [...values], nullable: true });

const ACTION_PROPERTIES: Record<string, unknown> = {
  type: { type: "STRING", enum: [...ACTION_TYPES] },
  title: str,
  category: oneOf(CATEGORIES),
  interval_days: int,
  due_in_days: int,
  days_ago: int,
  cost: { type: "NUMBER", nullable: true },
  labor: oneOf(["diy", "hired"]),
  description: str,
  notes: str,
  label: str,
  name: str,
  equipment_name: str,
  equipment_type: oneOf(EQUIPMENT_TYPES),
  manufacturer: str,
  model_number: str,
  serial_number: str,
  purchase_date: str,
  warranty_expires_on: str,
  parts: {
    type: "ARRAY",
    nullable: true,
    items: {
      type: "OBJECT",
      properties: { label: { type: "STRING" }, size: str, part_number: str },
      required: ["label"],
    },
  },
  room: str,
  brand: str,
  color_name: str,
  color_code: str,
  finish: oneOf(PAINT_FINISHES),
  hex: str,
  body: str,
  kind: oneOf(NOTE_KINDS),
  company: str,
  trade: oneOf(CONTACT_TRADES),
  phone: str,
  email: str,
  website: str,
  spot: oneOf(EMERGENCY_SPOTS),
  where: str,
  howto: str,
};
const ACTION_FIELDS = Object.keys(ACTION_PROPERTIES);

/**
 * Every field is required-but-nullable: Gemini skips optional fields (e.g. a
 * paint's room), and it writes keys alphabetically unless told otherwise, so
 * `type` goes first to pick the action before filling its fields.
 */
const SCHEMA = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    actions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: ACTION_PROPERTIES,
        required: ACTION_FIELDS,
        propertyOrdering: ACTION_FIELDS,
      },
    },
  },
  required: ["reply", "actions"],
  propertyOrdering: ["reply", "actions"],
};

const SYSTEM = `You are Keeper, HomeKeep's AI home assistant. You help one household look after their own house. If asked who you are, say you're Keeper, HomeKeep's AI; don't claim to be a person or a licensed tradesperson.
Ground every answer in the HOME FACTS below: their equipment (brands, models, part sizes), schedule, emergency shutoffs, recent work, pros, paint colours, and house notes. Quote those facts directly when they answer the question ("Your furnace filter is 16x25x1; it was last changed on 2026-03-02").
If the facts don't cover something, say so briefly and give general guidance, clearly marked as general.

Style: plain, warm, short. Lead with the answer. Use at most 5 short bullet points or 120 words unless the user asks for detail. No markdown headers.

Safety: for gas smells, sparking, flooding, or carbon monoxide alarms, lead with the immediate safety step (leave the house, call the gas utility or 911, shut off water at the main) and point to their emergency spot if known. Recommend a licensed pro for gas, electrical panel, structural, and roof work. Never tell them to bypass a safety device.

# Actions
You can save things to their home record through actions (at most ${MAX_ACTIONS}). Each action appears as a button under your reply, and nothing is saved until they tap it. Never say you added, saved, set up, scheduled, or updated something; say "Tap below to save it" (or "add it") instead.
Whenever they ask you to add, save, log, record, remember, schedule, or remind them about something, you MUST include the matching action. If something they mention in passing is worth saving (a new appliance, a pro's number, a paint colour), offer the action too.
Only use details the user gave or that appear in HOME FACTS. Never invent phone numbers, model or serial numbers, colour codes, prices, or dates. Leave unknown fields null. If a required detail is missing (a pro's name, a room for a paint colour), ask for it instead of guessing.
Check HOME FACTS first: don't add something that's already there. For equipment that exists, use update_equipment.

- create_routine: repeating task. title (imperative, under 50 chars), category, interval_days, description.
- create_task: one-time task to do later. title (the job only; keep timing like "tomorrow" out of it), category, due_in_days (always set it: read the number off the DATES list, e.g. "tomorrow" = 1; use 7 only when they gave no timing at all), description. Mention the day in your reply ("Tap below to add it for Tuesday").
- log_repair: work that's already done ("I replaced the toilet flapper yesterday", "we had the furnace serviced for $180"). title, category, days_ago (from the DATES list; 0 today, 1 yesterday), cost (number, only if given), labor ("diy" or "hired", only if known), notes.
- add_equipment: a new appliance or system. name (what they call it, e.g. "Basement furnace"), equipment_type, manufacturer, model_number, serial_number, purchase_date and warranty_expires_on (YYYY-MM-DD), parts (filters and other consumables: label, size, part_number).
- update_equipment: add details to equipment already in HOME FACTS. equipment_name must match its name exactly; include only the fields to change. parts are added to its existing parts.
- add_paint: room (required, e.g. "Living room walls"), brand, color_name, color_code, finish, hex (#RRGGBB, only if given). Example: "Simply White Benjamin Moore for the kitchen" -> {"type":"add_paint","room":"Kitchen","brand":"Benjamin Moore","color_name":"Simply White"}.
- add_note: a house note (Wi-Fi details, door codes, trash day, utility accounts, quirks). title, body (the full details, keep their wording), kind.
- add_pro: a tradesperson or service. name (required), company, trade, phone, email, website, notes. Example: "save Dave from Coastal Plumbing, 902-555-0142" -> {"type":"add_pro","name":"Dave","company":"Coastal Plumbing","trade":"plumber","phone":"902-555-0142"}.
- set_emergency_spot: where a shutoff or panel is. spot (waterShutoff, waterHeater, breakerPanel, gasShutoff, or custom with label), where, howto.
- open_emergency: when the answer relies on an emergency spot; label must match one listed in HOME FACTS.
Return an empty actions array when no action fits.`;

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (!trimmed || /^(n\/?a|none|unknown|null)$/i.test(trimmed)) return null;
  return trimmed.slice(0, max);
}

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

function isoDate(value: unknown): string | null {
  return typeof value === "string" && ISO_DATE.test(value) && !Number.isNaN(Date.parse(value))
    ? value
    : null;
}

function intIn(value: unknown, min: number, max: number): number | null {
  const n = Math.round(Number(value));
  return value != null && Number.isFinite(n) && n >= min && n <= max ? n : null;
}

function parts(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 5)
    .map((p: any) => ({
      label: cleanString(p?.label, 60),
      size: cleanString(p?.size, 40),
      part_number: cleanString(p?.part_number, 40),
    }))
    .filter((p): p is { label: string; size: string | null; part_number: string | null } =>
      Boolean(p.label)
    );
}

const PROMISES_BUTTON = /\btap (below|the button|to (save|add))\b/i;

const REQUIRED_FIELDS = `create_routine: title, interval_days. create_task: title, due_in_days. log_repair: title, days_ago. add_equipment: name. update_equipment: equipment_name plus a field to change. add_paint: room plus brand, color_name, or color_code. add_note: title and body. add_pro: name. set_emergency_spot: spot plus where or howto.`;

function retryNudge(rejected: unknown[]): string {
  const problem = rejected.length
    ? `These actions were rejected because a required field was missing or in the wrong field: ${JSON.stringify(rejected).slice(0, 1500)}.`
    : "Your reply tells them to tap below, but you didn't include an action.";
  return `[System check, not from the user] ${problem} Required fields: ${REQUIRED_FIELDS} Send your answer again with a complete action using the exact field names, or, if a required detail really is unknown, ask the user for it and return no actions.`;
}

/** Drops a "tap below" promise when no button made it through. */
function withoutButtonPromise(reply: string): string {
  const trimmed = reply
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !PROMISES_BUTTON.test(sentence))
    .join(" ")
    .trim();
  const note = "I couldn't put that into a save button. Could you say it again with the details?";
  return trimmed ? `${trimmed}\n\n${note}` : note;
}

function sumTokens(a: number | null, b: number | null): number | null {
  return a == null && b == null ? null : (a ?? 0) + (b ?? 0);
}

/** First usable string among the given fields, so a value in the wrong field still counts. */
function firstString(action: any, keys: string[], max: number): string | null {
  for (const key of keys) {
    const value = cleanString(action?.[key], max);
    if (value) return value;
  }
  return null;
}

/** Validates one model action; returns null when it can't be saved as given. */
export function normalizeAction(
  action: any,
  ctx: {
    emergencyLabels: Set<string>;
    equipmentIdByName: Map<string, string>;
    focusEquipmentId: string | null;
  }
): Record<string, unknown> | null {
  const category = pick(action?.category, CATEGORIES) ?? "GENERAL";
  switch (action?.type) {
    case "create_routine": {
      const title = firstString(action, ["title", "name", "label"], 60);
      const interval = intIn(action.interval_days, 1, 3650);
      if (!title || interval == null) return null;
      return {
        type: "create_routine",
        title,
        category,
        interval_days: interval,
        description: cleanString(action.description, 200),
      };
    }
    case "create_task": {
      const title = firstString(action, ["title", "name", "label"], 60);
      const due = intIn(action.due_in_days ?? 7, 0, 365);
      if (!title || due == null) return null;
      return {
        type: "create_task",
        title,
        category,
        due_in_days: due,
        description: cleanString(action.description, 200),
      };
    }
    case "log_repair": {
      const title = firstString(action, ["title", "name", "label"], 60);
      const daysAgo = intIn(action.days_ago ?? 0, 0, 3650);
      if (!title || daysAgo == null) return null;
      const cost = Number(action.cost);
      return {
        type: "log_repair",
        title,
        category,
        days_ago: daysAgo,
        cost: action.cost != null && Number.isFinite(cost) && cost > 0 ? Math.round(cost * 100) / 100 : null,
        labor: pick(action.labor, ["diy", "hired"] as const),
        notes: text(action.notes, 500),
      };
    }
    case "add_equipment": {
      const name = firstString(action, ["name", "equipment_name", "title"], 60);
      if (!name) return null;
      return {
        type: "add_equipment",
        name,
        equipment_type: pick(action.equipment_type, EQUIPMENT_TYPES) ?? "other",
        manufacturer: cleanString(action.manufacturer, 60),
        model_number: cleanString(action.model_number, 60),
        serial_number: cleanString(action.serial_number, 60),
        purchase_date: isoDate(action.purchase_date),
        warranty_expires_on: isoDate(action.warranty_expires_on),
        parts: parts(action.parts),
      };
    }
    case "update_equipment": {
      const named = cleanString(action.equipment_name ?? action.name, 60);
      const equipmentId =
        (named && ctx.equipmentIdByName.get(named.toLowerCase())) || ctx.focusEquipmentId;
      if (!equipmentId) return null;
      const changes = {
        manufacturer: cleanString(action.manufacturer, 60),
        model_number: cleanString(action.model_number, 60),
        serial_number: cleanString(action.serial_number, 60),
        purchase_date: isoDate(action.purchase_date),
        warranty_expires_on: isoDate(action.warranty_expires_on),
        parts: parts(action.parts),
      };
      const hasChange =
        changes.parts.length > 0 ||
        Object.entries(changes).some(([key, value]) => key !== "parts" && value != null);
      if (!hasChange) return null;
      return { type: "update_equipment", equipment_id: equipmentId, equipment_name: named, ...changes };
    }
    case "add_paint": {
      const room = firstString(action, ["room", "label"], 60);
      if (!room) return null;
      const hex = typeof action.hex === "string" && HEX.test(action.hex.trim()) ? action.hex.trim().toUpperCase() : null;
      const paint = {
        type: "add_paint",
        room,
        brand: cleanString(action.brand, 60),
        color_name: firstString(action, ["color_name", "name"], 60),
        color_code: cleanString(action.color_code, 30),
        finish: pick(action.finish, PAINT_FINISHES),
        hex,
      };
      return paint.brand || paint.color_name || paint.color_code || hex ? paint : null;
    }
    case "add_note": {
      const title = firstString(action, ["title", "label", "name"], 60);
      const body = text(action.body ?? action.notes ?? action.description, 2000);
      if (!title || !body) return null;
      return { type: "add_note", title, body, kind: pick(action.kind, NOTE_KINDS) ?? "general" };
    }
    case "add_pro": {
      const name = firstString(action, ["name", "title", "label"], 80);
      if (!name) return null;
      return {
        type: "add_pro",
        name,
        company: cleanString(action.company, 80),
        trade: pick(action.trade, CONTACT_TRADES),
        phone: cleanString(action.phone, 40),
        email: cleanString(action.email, 120),
        website: cleanString(action.website, 200),
        notes: text(action.notes, 500),
      };
    }
    case "set_emergency_spot": {
      const spot = pick(action.spot, EMERGENCY_SPOTS);
      const where = text(action.where, 300);
      const howto = text(action.howto, 300);
      const label = cleanString(action.label, 40);
      if (!spot || (!where && !howto) || (spot === "custom" && !label)) return null;
      return { type: "set_emergency_spot", spot, label: spot === "custom" ? label : null, where, howto };
    }
    case "open_emergency": {
      const label = cleanString(action.label, 60);
      if (!label || !ctx.emergencyLabels.has(label.toLowerCase())) return null;
      return { type: "open_emergency", label };
    }
    default:
      return null;
  }
}

export const assistantChat: AiTask<ChatInput> = {
  feature: "assistant_chat",

  parse(body) {
    const raw = Array.isArray(body.messages) ? body.messages : [];
    const messages = raw
      .slice(-MAX_TURNS)
      .map((m: any) => ({
        role: m?.role === "assistant" ? ("assistant" as const) : ("user" as const),
        text: typeof m?.text === "string" ? m.text.trim().slice(0, MAX_CHARS) : "",
      }))
      .filter((m) => m.text);
    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      throw new TaskInputError("Ask a question first");
    }
    const equipmentId =
      typeof body.equipment_id === "string" && UUID.test(body.equipment_id)
        ? body.equipment_id
        : null;
    return { messages, equipmentId, today: clientToday(body.today) };
  },

  async run(ctx, input) {
    const today = input.today ?? new Date().toISOString().slice(0, 10);
    const home = await buildHomeContext(ctx.userClient, ctx.userId, ctx.householdId, {
      focusEquipmentId: input.equipmentId,
      today,
    });

    const contents: GeminiContent[] = input.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    const system = `${SYSTEM}\n\n# DATES\n${dateGuide(today)}\n\n# HOME FACTS\n${home.text}`;
    const normalizeCtx = {
      emergencyLabels: new Set(home.emergencyLabels.map((l) => l.toLowerCase())),
      equipmentIdByName: new Map(
        Object.entries(home.equipmentNames).map(([id, name]) => [name.toLowerCase(), id])
      ),
      focusEquipmentId: input.equipmentId,
    };

    const ask = async (turns: GeminiContent[]) => {
      const response = await generateJson<{ reply?: string; actions?: unknown[] }>({
        system,
        schema: SCHEMA,
        contents: turns,
        temperature: 0.4,
        maxOutputTokens: 1536,
      });
      const reply = cleanString(response.data.reply, 4000)
        ? String(response.data.reply).trim().slice(0, 4000)
        : null;
      const raw = Array.isArray(response.data.actions) ? response.data.actions : [];
      const actions: Record<string, unknown>[] = [];
      const rejected: unknown[] = [];
      for (const action of raw) {
        const normalized = normalizeAction(action, normalizeCtx);
        if (normalized) actions.push(normalized);
        else rejected.push(action);
      }
      return { response, reply, actions: actions.slice(0, MAX_ACTIONS), rejected };
    };

    let turn = await ask(contents);
    let inputTokens = turn.response.inputTokens;
    let outputTokens = turn.response.outputTokens;
    const rejected = [...turn.rejected];

    const promisedButton = (reply: string | null) => !!reply && PROMISES_BUTTON.test(reply);
    if (turn.actions.length === 0 && (turn.rejected.length > 0 || promisedButton(turn.reply))) {
      console.warn("assistant_chat: no usable action, retrying", JSON.stringify(turn.rejected));
      const retry = await ask([
        ...contents,
        { role: "model", parts: [{ text: JSON.stringify(turn.response.data) }] },
        { role: "user", parts: [{ text: retryNudge(turn.rejected) }] },
      ]);
      rejected.push(...retry.rejected);
      inputTokens = sumTokens(inputTokens, retry.response.inputTokens);
      outputTokens = sumTokens(outputTokens, retry.response.outputTokens);
      if (retry.reply && (retry.actions.length > 0 || !promisedButton(retry.reply))) {
        turn = retry;
      } else if (retry.rejected.length > 0) {
        console.warn("assistant_chat: retry still unusable", JSON.stringify(retry.rejected));
      }
    }

    let reply = turn.reply;
    if (!reply) throw new Error("Empty assistant reply");
    if (turn.actions.length === 0 && promisedButton(reply)) reply = withoutButtonPromise(reply);

    return {
      result: {
        reply,
        actions: turn.actions,
        ...(rejected.length > 0 && { rejected: rejected.slice(0, 4) }),
      },
      usage: { model: turn.response.model, inputTokens, outputTokens },
    };
  },
};
