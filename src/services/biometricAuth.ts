import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { Session } from "@supabase/supabase-js";

const VAULT_KEY = "homekeep.biometric.session";
const ENABLED_FLAG_KEY = "homekeep.biometric.enabled";

export type BiometricSessionVault = {
  access_token: string;
  refresh_token: string;
  user_id?: string;
  email?: string | null;
};

export type BiometricLabel = "Face ID" | "Touch ID" | "biometrics";

function secureStoreOptions(): SecureStore.SecureStoreOptions {
  // Device-only keychain. Biometric gate is LocalAuthentication (avoids a second Face ID prompt on read).
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    };
  }
  return {};
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
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
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

  const vault: BiometricSessionVault = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    user_id: session.user?.id,
    email: session.user?.email ?? null,
  };

  try {
    await SecureStore.setItemAsync(
      VAULT_KEY,
      JSON.stringify(vault),
      secureStoreOptions()
    );
    await AsyncStorage.setItem(ENABLED_FLAG_KEY, "1");
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save biometric sign-in.";
    return { success: false, error: message };
  }
}

/** Update stored tokens without a biometric prompt (caller already authenticated). */
export async function updateBiometricSession(
  session: Session
): Promise<void> {
  const enabled = await hasBiometricLoginEnabled();
  if (!enabled || !session.refresh_token || !session.access_token) return;

  const vault: BiometricSessionVault = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    user_id: session.user?.id,
    email: session.user?.email ?? null,
  };

  await SecureStore.setItemAsync(
    VAULT_KEY,
    JSON.stringify(vault),
    secureStoreOptions()
  );
}

export async function getBiometricSession(): Promise<BiometricSessionVault | null> {
  const enabled = await hasBiometricLoginEnabled();
  if (!enabled) return null;

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

export async function disableBiometricLogin(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(VAULT_KEY);
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
