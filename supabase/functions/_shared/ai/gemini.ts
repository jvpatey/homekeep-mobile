// deno-lint-ignore-file no-explicit-any
/**
 * Minimal Gemini REST client: JSON-mode generateContent with a response
 * schema, inline images/PDFs, and Files API upload for large documents.
 */

const API_BASE = "https://generativelanguage.googleapis.com";
const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const REQUEST_TIMEOUT_MS = 60_000;
/** Gemini rejects requests over 20MB; leave headroom for base64 + prompt. */
export const INLINE_DATA_MAX_BYTES = 14 * 1024 * 1024;

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }
  | { fileData: { mimeType: string; fileUri: string } };

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface GenerateJsonOptions {
  system: string;
  contents: GeminiContent[];
  /** OpenAPI-subset schema (Gemini `responseSchema`). */
  schema: Record<string, unknown>;
  model?: string;
  /** Applied to 2.x models only; Gemini 3+ degrades below its default of 1.0. */
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  /** Retry once on 429/5xx/timeouts (default true). Edge functions have a wall-clock cap. */
  retry?: boolean;
  /** Reasoning depth (default "minimal"). Thinking tokens share the output budget. */
  thinking?: ThinkingLevel;
}

export type ThinkingLevel = "minimal" | "low" | "medium";

/** 2.5-series equivalents of Gemini 3 thinking levels. */
const THINKING_BUDGETS: Record<ThinkingLevel, number> = {
  minimal: 0,
  low: 2048,
  medium: 8192,
};

/**
 * Gemini 3+ takes `thinkingLevel` and rejects `thinkingBudget` intermittently;
 * 2.x only understands `thinkingBudget`.
 */
function generationTuning(model: string, options: GenerateJsonOptions) {
  const level = options.thinking ?? "minimal";
  const major = Number(/^gemini-(\d+)/.exec(model)?.[1] ?? 3);
  if (major >= 3) return { thinkingConfig: { thinkingLevel: level } };
  return {
    temperature: options.temperature ?? 0.2,
    thinkingConfig: { thinkingBudget: THINKING_BUDGETS[level] },
  };
}

export interface GenerateJsonResult<T> {
  data: T;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly retryable: boolean
  ) {
    super(message);
  }
}

function apiKey(): string {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new GeminiError("GEMINI_API_KEY is not set", null, false);
  return key;
}

export function geminiModel(): string {
  return Deno.env.get("GEMINI_MODEL") || DEFAULT_MODEL;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    throw new GeminiError(
      aborted ? "Model request timed out" : String(error),
      null,
      true
    );
  } finally {
    clearTimeout(timer);
  }
}

function extractText(body: any): string {
  const candidate = body?.candidates?.[0];
  const parts: any[] = candidate?.content?.parts ?? [];
  const text = parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("");
  if (!text) {
    const reason =
      candidate?.finishReason ?? body?.promptFeedback?.blockReason ?? "empty";
    throw new GeminiError(`Model returned no content (${reason})`, null, false);
  }
  return text;
}

async function generateOnce<T>(
  options: GenerateJsonOptions
): Promise<GenerateJsonResult<T>> {
  const model = options.model ?? geminiModel();
  const response = await fetchWithTimeout(
    `${API_BASE}/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey(),
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: options.system }] },
        contents: options.contents,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: options.schema,
          maxOutputTokens: options.maxOutputTokens ?? 2048,
          ...generationTuning(model, options),
        },
      }),
    },
    options.timeoutMs ?? REQUEST_TIMEOUT_MS
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new GeminiError(
      `Gemini ${response.status}: ${detail.slice(0, 500)}`,
      response.status,
      response.status === 429 || response.status >= 500
    );
  }

  const body = await response.json();
  const text = extractText(body);
  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new GeminiError("Model returned invalid JSON", null, true);
  }
  return {
    data,
    model,
    inputTokens: body?.usageMetadata?.promptTokenCount ?? null,
    outputTokens: body?.usageMetadata?.candidatesTokenCount ?? null,
  };
}

/** generateContent in JSON mode, with one retry on 429/5xx/timeouts. */
export async function generateJson<T>(
  options: GenerateJsonOptions
): Promise<GenerateJsonResult<T>> {
  try {
    return await generateOnce<T>(options);
  } catch (error) {
    if (options.retry === false) throw error;
    if (!(error instanceof GeminiError) || !error.retryable) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return await generateOnce<T>(options);
  }
}

/**
 * Upload bytes to the Gemini Files API (48h retention) and wait until the
 * file is ready. Use for documents too large to send inline.
 */
export async function uploadFile(
  bytes: Uint8Array,
  mimeType: string,
  displayName: string
): Promise<{ mimeType: string; fileUri: string }> {
  const key = apiKey();
  const start = await fetchWithTimeout(
    `${API_BASE}/upload/v1beta/files`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": key,
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(bytes.byteLength),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: { display_name: displayName } }),
    },
    REQUEST_TIMEOUT_MS
  );
  const uploadUrl = start.headers.get("x-goog-upload-url");
  if (!start.ok || !uploadUrl) {
    throw new GeminiError(
      `File upload start failed (${start.status})`,
      start.status,
      start.status >= 500
    );
  }

  const finish = await fetchWithTimeout(
    uploadUrl,
    {
      method: "POST",
      headers: {
        "Content-Length": String(bytes.byteLength),
        "X-Goog-Upload-Offset": "0",
        "X-Goog-Upload-Command": "upload, finalize",
      },
      body: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mimeType }),
    },
    120_000
  );
  if (!finish.ok) {
    throw new GeminiError(
      `File upload failed (${finish.status})`,
      finish.status,
      finish.status >= 500
    );
  }
  let file = (await finish.json())?.file;

  for (let i = 0; i < 20 && file?.state === "PROCESSING"; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const poll = await fetchWithTimeout(
      `${API_BASE}/v1beta/${file.name}`,
      { headers: { "x-goog-api-key": key } },
      REQUEST_TIMEOUT_MS
    );
    if (poll.ok) file = await poll.json();
  }
  if (!file?.uri || file.state === "FAILED" || file.state === "PROCESSING") {
    throw new GeminiError("Uploaded file did not become ready", null, false);
  }
  return { mimeType, fileUri: file.uri };
}

/** Base64 without blowing the call stack on multi-MB buffers. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
