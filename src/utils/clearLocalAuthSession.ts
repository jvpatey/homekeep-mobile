import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SupabaseClient } from "@supabase/supabase-js";

type AuthInternals = {
  stopAutoRefresh: () => void;
  storageKey: string;
  _removeSession?: () => Promise<void>;
  _acquireLock?: (
    timeout: number,
    fn: () => Promise<unknown>
  ) => Promise<unknown>;
};

/**
 * Clears the in-app Supabase session WITHOUT calling /logout.
 *
 * `signOut({ scope: "local" })` still revokes the current refresh token on the
 * server. Face ID needs that token to restore the session after "sign out",
 * so we only wipe local storage + in-memory auth state.
 */
export async function clearLocalSessionKeepRefreshToken(
  client: SupabaseClient
): Promise<void> {
  const auth = client.auth as unknown as AuthInternals;

  try {
    auth.stopAutoRefresh();
  } catch {
    // Best-effort
  }

  if (typeof auth._removeSession === "function") {
    const remove = () => auth._removeSession!();
    if (typeof auth._acquireLock === "function") {
      await auth._acquireLock(-1, remove);
    } else {
      await remove();
    }
    return;
  }

  // Fallback if the private API shape changes in a future supabase-js.
  const key = auth.storageKey;
  if (!key) return;
  await AsyncStorage.multiRemove([
    key,
    `${key}-code-verifier`,
    `${key}-user`,
  ]);
}
