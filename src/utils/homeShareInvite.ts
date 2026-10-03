import { normalizeInviteCode } from "../services/HouseholdService";

/** Deep-link style payload for HomeShare QR codes (in-app scan + future links). */
export function homeShareInvitePayload(code: string): string {
  const normalized = normalizeInviteCode(code);
  return `homekeep://homeshare/join?code=${encodeURIComponent(normalized)}`;
}

/**
 * Pull an invite code from a scanned QR / typed string.
 * Accepts raw codes or homekeep://homeshare/join?code=…
 */
export function parseHomeShareInvitePayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const normalizedDirect = normalizeInviteCode(trimmed);
  if (
    normalizedDirect.length >= 4 &&
    normalizedDirect.length <= 8 &&
    !/[/?&=]/.test(trimmed)
  ) {
    return normalizedDirect;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol === "homekeep:") {
      const code =
        url.searchParams.get("code") ??
        url.searchParams.get("invite") ??
        "";
      const normalized = normalizeInviteCode(code);
      return normalized.length >= 4 ? normalized : null;
    }
  } catch {
    // not a URL
  }

  // Fallback: last path segment or query-ish CODE=
  const queryMatch = trimmed.match(/[?&]code=([A-Za-z0-9]+)/i);
  if (queryMatch?.[1]) {
    const normalized = normalizeInviteCode(queryMatch[1]);
    return normalized.length >= 4 ? normalized : null;
  }

  return null;
}
