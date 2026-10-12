// deno-lint-ignore-file no-explicit-any
import type { AiFeature } from "../quota.ts";

export interface TaskContext {
  /** Service-role client; tasks must scope reads to `userId` / `householdId`. */
  supabase: any;
  /** Client acting as the caller, so RLS scopes reads to their home. */
  userClient: any;
  userId: string;
  householdId: string | null;
}

export interface TaskUsage {
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

export interface TaskOutput {
  result: unknown;
  /** Null when no model call was made (e.g. a cached result); not billed. */
  usage: TaskUsage | null;
}

export interface AiTask<I> {
  feature: AiFeature;
  parse(body: Record<string, unknown>): I;
  run(ctx: TaskContext, input: I): Promise<TaskOutput>;
}

/** Caller sent something the task can't use; surfaced as `bad_input`. */
export class TaskInputError extends Error {
  constructor(message: string, readonly reason?: string) {
    super(message);
  }
}

export function cleanString(value: unknown, max = 120): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed || /^(n\/?a|none|unknown|null)$/i.test(trimmed)) return null;
  return trimmed.slice(0, max);
}
