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

const MAX_TURNS = 12;
const MAX_CHARS = 2000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ChatInput {
  messages: { role: "user" | "assistant"; text: string }[];
  equipmentId: string | null;
}

interface RawReply {
  reply?: string;
  actions?: {
    type?: string;
    title?: string;
    category?: string;
    interval_days?: number;
    description?: string | null;
    label?: string;
  }[];
}

const SCHEMA = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    actions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING", enum: ["create_routine", "open_emergency"] },
          title: { type: "STRING", nullable: true },
          category: { type: "STRING", enum: [...CATEGORIES], nullable: true },
          interval_days: { type: "INTEGER", nullable: true },
          description: { type: "STRING", nullable: true },
          label: { type: "STRING", nullable: true },
        },
        required: ["type"],
      },
    },
  },
  required: ["reply", "actions"],
};

const SYSTEM = `You are HomeKeep's home assistant. You help one household look after their own house.
Ground every answer in the HOME FACTS below: their equipment (brands, models, part sizes), their schedule, where the emergency shutoffs are, and what was done recently. Quote those facts directly when they answer the question ("Your furnace filter is 16x25x1; it was last changed on 2026-03-02").
If the facts don't cover something, say so briefly and give general guidance, clearly marked as general.

Style: plain, warm, short. Lead with the answer. Use at most 5 short bullet points or 120 words unless the user asks for detail. No markdown headers.

Safety: for gas smells, sparking, flooding, or carbon monoxide alarms, lead with the immediate safety step (leave the house, call the gas utility or 911, shut off water at the main) and point to their emergency spot if known. Recommend a licensed pro for gas, electrical panel, structural, and roof work. Never tell them to bypass a safety device.

Actions (optional, at most 2):
- create_routine: when a recurring task would clearly help and it is NOT already on their schedule. Give title (imperative, under 50 chars), category, interval_days, and a one-line description.
- open_emergency: when the answer relies on an emergency spot; label must match one of the listed emergency spots.
Return an empty actions array otherwise.`;

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
    return { messages, equipmentId };
  },

  async run(ctx, input) {
    const home = await buildHomeContext(ctx.userClient, ctx.userId, ctx.householdId, {
      focusEquipmentId: input.equipmentId,
    });

    const contents: GeminiContent[] = input.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    const response = await generateJson<RawReply>({
      system: `${SYSTEM}\n\n# HOME FACTS\n${home.text}`,
      schema: SCHEMA,
      contents,
      temperature: 0.4,
      maxOutputTokens: 1024,
    });

    const reply = cleanString(response.data.reply, 4000)
      ? String(response.data.reply).trim().slice(0, 4000)
      : null;
    if (!reply) throw new Error("Empty assistant reply");

    const emergency = new Set(home.emergencyLabels.map((l) => l.toLowerCase()));
    const actions = (response.data.actions ?? [])
      .map((action) => {
        if (action.type === "create_routine") {
          const title = cleanString(action.title, 60);
          const interval = Math.round(Number(action.interval_days));
          const category = CATEGORIES.includes(action.category as any)
            ? action.category
            : "GENERAL";
          if (!title || !Number.isFinite(interval) || interval < 1 || interval > 3650) return null;
          return {
            type: "create_routine" as const,
            title,
            category,
            interval_days: interval,
            description: cleanString(action.description, 200),
          };
        }
        if (action.type === "open_emergency") {
          const label = cleanString(action.label, 60);
          if (!label || !emergency.has(label.toLowerCase())) return null;
          return { type: "open_emergency" as const, label };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 2);

    return {
      result: { reply, actions },
      usage: {
        model: response.model,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
      },
    };
  },
};
