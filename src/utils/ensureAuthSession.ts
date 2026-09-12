import { supabase } from "../lib/supabase";

const REFRESH_BUFFER_MS = 60_000;
const DEFAULT_TIMEOUT_MS = 8_000;

export type EnsureAuthSessionOptions = {
  /** Always refresh, e.g. after an empty fetch that may be an RLS race. */
  forceRefresh?: boolean;
  /** Max time to wait for getSession/refreshSession before giving up. */
  timeoutMs?: number;
};

/** Ensures a valid access token before Supabase data queries. */
export async function ensureAuthSession(
  options?: EnsureAuthSessionOptions
): Promise<boolean> {
  if (!supabase) return false;

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const run = async (): Promise<boolean> => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error || !session) return false;

    const expiresAtMs = (session.expires_at ?? 0) * 1000;
    const needsRefresh =
      options?.forceRefresh || expiresAtMs < Date.now() + REFRESH_BUFFER_MS;

    if (needsRefresh) {
      const { data: refreshed, error: refreshError } =
        await supabase.auth.refreshSession();
      if (refreshError || !refreshed.session) return false;
    }

    return true;
  };

  try {
    const result = await Promise.race([
      run(),
      new Promise<"timeout">((resolve) =>
        setTimeout(() => resolve("timeout"), timeoutMs)
      ),
    ]);

    if (result === "timeout") {
      // Cold-start / flaky networks can hang refresh forever. Prefer proceeding
      // with the stored session over blocking the UI; later API calls will fail
      // cleanly if the token is truly unusable.
      if (__DEV__) {
        console.warn("ensureAuthSession timed out; proceeding with stored session");
      }
      return true;
    }

    return result;
  } catch (err) {
    if (__DEV__) {
      console.warn("ensureAuthSession failed:", err);
    }
    return false;
  }
}
