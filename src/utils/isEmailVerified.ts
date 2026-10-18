import { User } from "@supabase/supabase-js";

export const EMAIL_NOT_CONFIRMED = "email_not_confirmed";

function hasOAuthProvider(
  user: User,
  provider: "apple" | "google"
): boolean {
  const metaProvider = user.app_metadata?.provider;
  const providers = user.app_metadata?.providers;
  if (metaProvider === provider) return true;
  if (Array.isArray(providers) && providers.includes(provider)) return true;
  return (
    user.identities?.some((identity) => identity.provider === provider) ?? false
  );
}

/** True when the user may enter the app (confirmed email, Apple, or Google). */
export function isEmailVerified(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.email_confirmed_at) return true;
  if (hasOAuthProvider(user, "apple")) return true;
  if (hasOAuthProvider(user, "google")) return true;
  return false;
}

/** True when the account can sign in with email + password (not Apple-only). */
export function userHasEmailPassword(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.identities?.some((identity) => identity.provider === "email")) {
    return true;
  }
  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers) && providers.includes("email")) {
    return true;
  }
  return user.app_metadata?.provider === "email";
}
