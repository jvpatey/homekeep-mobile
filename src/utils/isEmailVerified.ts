import { User } from "@supabase/supabase-js";

export const EMAIL_NOT_CONFIRMED = "email_not_confirmed";

/** True when the user may enter the app (confirmed email or Apple). */
export function isEmailVerified(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.email_confirmed_at) return true;

  const provider = user.app_metadata?.provider;
  const providers = user.app_metadata?.providers;
  if (provider === "apple") return true;
  if (Array.isArray(providers) && providers.includes("apple")) return true;
  if (user.identities?.some((identity) => identity.provider === "apple")) {
    return true;
  }

  return false;
}
