import { makeRedirectUri } from "expo-auth-session";

/** Deep link used after Google OAuth (must be allow-listed in Supabase Auth redirect URLs). */
export const AUTH_CALLBACK_REDIRECT = makeRedirectUri({
  scheme: "homekeep",
  path: "auth/callback",
});

/** Fallback when makeRedirectUri is unavailable in some native builds. */
export const AUTH_CALLBACK_REDIRECT_FALLBACK = "homekeep://auth/callback";

export function getAuthCallbackRedirect(): string {
  return AUTH_CALLBACK_REDIRECT || AUTH_CALLBACK_REDIRECT_FALLBACK;
}
