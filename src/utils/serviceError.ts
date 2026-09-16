import { ServiceError } from "../types/maintenance";

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringifyUnknown(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

/** Normalize Postgrest / Auth / thrown values into a ServiceError. */
export function toServiceError(
  error: unknown,
  fallback = "Something went wrong"
): ServiceError {
  if (!error) return { message: fallback };

  if (typeof error === "string") {
    return { message: error.trim() || fallback };
  }

  if (typeof error === "object") {
    const obj = error as Record<string, unknown>;
    const nested = obj.error;
    if (nested && nested !== error && typeof nested === "object") {
      const fromNested = toServiceError(nested, fallback);
      if (fromNested.message !== fallback) return fromNested;
    }

    const rawMessage = readString(obj.message);
    const code =
      readString(obj.code) ??
      (typeof obj.status === "number" ? String(obj.status) : undefined);
    const details = stringifyUnknown(obj.details);
    const hint = readString(obj.hint);

    if (rawMessage) {
      return { message: rawMessage, code, details, hint };
    }

    const fromParts = [code, details, hint].filter(Boolean).join(" — ");
    if (fromParts) {
      return { message: fromParts, code, details, hint };
    }

    if (error instanceof Error && error.message.trim()) {
      return { message: error.message, code, details, hint };
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return { message: error.message };
  }

  return { message: fallback };
}

export function isTransientServiceError(error: unknown): boolean {
  const parsed = toServiceError(error);
  const blob =
    `${parsed.message} ${parsed.code ?? ""} ${parsed.details ?? ""}`.toLowerCase();

  if (
    parsed.message === "Something went wrong" ||
    parsed.message === "Unknown error occurred"
  ) {
    return true;
  }

  return (
    blob.includes("network") ||
    blob.includes("connection was lost") ||
    blob.includes("failed to fetch") ||
    blob.includes("fetch failed") ||
    blob.includes("unexpectedexception") ||
    blob.includes("timeout") ||
    blob.includes("timed out") ||
    blob.includes("jwt") ||
    blob.includes("not authenticated") ||
    parsed.code === "PGRST301" ||
    parsed.code === "401" ||
    parsed.code === "408" ||
    parsed.code === "503"
  );
}

/** LogBox treats console.error as a red screen — keep flakes out of it. */
export function logServiceFailure(label: string, error: unknown) {
  const parsed = toServiceError(error);
  if (isTransientServiceError(parsed)) {
    console.log(label, parsed);
  } else {
    console.error(label, parsed);
  }
  return parsed;
}
