import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

const VAULT_KEY = "homekeep.biometric.session";
const ENABLED_FLAG_KEY = "homekeep.biometric.enabled";

export type BiometricSessionVault = {
  access_token: string;
  refresh_token: string;
  /** Session access-token expiry (unix seconds). Used to ignore stale vault writes. */
  expires_at?: number | null;
  user_id?: string;
  email?: string | null;
};

export type BiometricLabel = "Face ID" | "Touch ID" | "biometrics";

/** Serialize vault writes so TOKEN_REFRESHED can't race with background sync. */
let vaultWriteChain: Promise<void> = Promise.resolve();

function enqueueVaultWrite<T>(fn: () => Promise<T>): Promise<T> {
  const run = vaultWriteChain.then(fn, fn);
  vaultWriteChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function secureStoreOptions(): SecureStore.SecureStoreOptions {
  // Device-only keychain. Biometric gate is LocalAuthentication (avoids a second Face ID prompt on read).
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    };
  }
  return {};
}

function vaultFromSession(session: Session): BiometricSessionVault | null {
  if (!session.refresh_token || !session.access_token) return null;
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at ?? null,
    user_id: session.user?.id,
    email: session.user?.email ?? null,
  };
}

async function readVaultRaw(): Promise<BiometricSessionVault | null> {
  try {
    const raw = await SecureStore.getItemAsync(VAULT_KEY, secureStoreOptions());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BiometricSessionVault;
    if (!parsed?.refresh_token || !parsed?.access_token) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeVaultVerified(vault: BiometricSessionVault): Promise<void> {
  const payload = JSON.stringify(vault);
  await SecureStore.setItemAsync(VAULT_KEY, payload, secureStoreOptions());
  const check = await SecureStore.getItemAsync(VAULT_KEY, secureStoreOptions());
  if (!check) {
    throw new Error("Biometric vault write could not be verified.");
  }
  let parsed: BiometricSessionVault;
  try {
    parsed = JSON.parse(check) as BiometricSessionVault;
  } catch {
    throw new Error("Biometric vault write could not be verified.");
  }
  if (parsed.refresh_token !== vault.refresh_token) {
    throw new Error("Biometric vault write could not be verified.");
  }
}

/** Latest session from Supabase, if any. */
async function fetchFreshSession(
  fallback?: Session | null
): Promise<Session | null> {
  if (!supabase) return fallback ?? null;
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.refresh_token) return data.session;
  } catch {
    // Fall through
  }
  return fallback ?? null;
}

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
}

export async function getBiometricLabel(): Promise<BiometricLabel> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (
      types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    ) {
      return "Face ID";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === "ios" ? "Touch ID" : "biometrics";
    }
  } catch {
    // Fall through
  }
  return "biometrics";
}

export async function authenticateForBiometricLogin(
  reason?: string
): Promise<boolean> {
  const label = await getBiometricLabel();
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason ?? `Sign in with ${label}`,
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
    fallbackLabel: "Use passcode",
  });
  return result.success;
}

export async function hasBiometricLoginEnabled(): Promise<boolean> {
  try {
    const flag = await AsyncStorage.getItem(ENABLED_FLAG_KEY);
    return flag === "1";
  } catch {
    return false;
  }
}

/**
 * True when Face ID can actually restore a session (hardware + flag + vault).
 * Heals a stuck "enabled" flag with a missing SecureStore vault.
 */
export async function isBiometricLoginReady(): Promise<boolean> {
  try {
    const [available, enabled] = await Promise.all([
      isBiometricAvailable(),
      hasBiometricLoginEnabled(),
    ]);
    if (!available || !enabled) return false;

    const vault = await readVaultRaw();
    if (!vault?.refresh_token) {
      // Flag without tokens — user would hit a dead Face ID button.
      await disableBiometricLogin();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function enableBiometricLogin(
  session: Session
): Promise<{ success: boolean; error?: string }> {
  if (!session.refresh_token || !session.access_token) {
    return { success: false, error: "No session tokens available." };
  }

  const available = await isBiometricAvailable();
  if (!available) {
    return {
      success: false,
      error: "Biometric authentication is not available on this device.",
    };
  }

  const label = await getBiometricLabel();
  const ok = await authenticateForBiometricLogin(`Enable ${label} sign-in`);
  if (!ok) {
    return { success: false, error: "Biometric authentication was canceled." };
  }

  // Tokens may rotate while the Face ID sheet is open — persist whatever is current.
  const fresh = await fetchFreshSession(session);
  const vault = vaultFromSession(fresh ?? session);
  if (!vault) {
    return { success: false, error: "No session tokens available." };
  }

  try {
    await enqueueVaultWrite(async () => {
      await writeVaultVerified(vault);
      await AsyncStorage.setItem(ENABLED_FLAG_KEY, "1");
    });
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save biometric sign-in.";
    return { success: false, error: message };
  }
}

/**
 * Update stored tokens without a biometric prompt (caller already authenticated).
 * Ignores older sessions so a late background sync can't overwrite a newer refresh.
 */
export async function updateBiometricSession(
  session: Session
): Promise<void> {
  await enqueueVaultWrite(async () => {
    const enabled = await hasBiometricLoginEnabled();
    if (!enabled) return;

    const vault = vaultFromSession(session);
    if (!vault) return;

    const existing = await readVaultRaw();
    const incomingExpiry = vault.expires_at ?? 0;
    const existingExpiry = existing?.expires_at ?? 0;
    // Same refresh token already stored — skip.
    if (
      existing?.refresh_token === vault.refresh_token &&
      existing?.access_token === vault.access_token
    ) {
      return;
    }
    // Don't clobber a newer rotation with a stale snapshot.
    if (
      existing?.refresh_token &&
      existing.refresh_token !== vault.refresh_token &&
      existingExpiry > incomingExpiry
    ) {
      return;
    }

    await writeVaultVerified(vault);
  });
}

/**
 * True when a restore failure means the stored refresh token is dead
 * (clear Face ID) vs a transient network/server blip (keep Face ID).
 */
export function isBiometricSessionInvalidError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { message?: string; code?: string; status?: number };
  const message = (err.message ?? "").toLowerCase();
  const code = (err.code ?? "").toLowerCase();

  // Network / timeout — keep Face ID enabled.
  if (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("fetch") ||
    message.includes("offline") ||
    code === "network_error"
  ) {
    return false;
  }

  if (err.status === 400 || err.status === 401 || err.status === 403) {
    return true;
  }
  return (
    code.includes("refresh") ||
    code.includes("invalid") ||
    code.includes("session") ||
    message.includes("refresh token") ||
    message.includes("invalid refresh") ||
    message.includes("invalid_grant") ||
    message.includes("token not found") ||
    message.includes("already used")
  );
}

export async function getBiometricSession(): Promise<BiometricSessionVault | null> {
  const enabled = await hasBiometricLoginEnabled();
  if (!enabled) return null;
  return readVaultRaw();
}

export async function disableBiometricLogin(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(VAULT_KEY, secureStoreOptions());
  } catch {
    // Best-effort
  }
  try {
    await AsyncStorage.removeItem(ENABLED_FLAG_KEY);
  } catch {
    // Best-effort
  }
}

export const clearBiometricLogin = disableBiometricLogin;
