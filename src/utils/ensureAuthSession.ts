import { supabase } from "../lib/supabase";

const REFRESH_BUFFER_MS = 60_000;

export type EnsureAuthSessionOptions = {
  /** Always refresh, e.g. after an empty fetch that may be an RLS race. */
  forceRefresh?: boolean;
};

/** Ensures a valid access token before Supabase data queries. */
export async function ensureAuthSession(
  options?: EnsureAuthSessionOptions
): Promise<boolean> {
  if (!supabase) return false;

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
}
