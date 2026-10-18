import { Alert } from "react-native";
import type { Session } from "@supabase/supabase-js";
import {
  enableBiometricLogin,
  getBiometricLabel,
  hasBiometricLoginEnabled,
  isBiometricAvailable,
} from "../services/biometricAuth";

/** Prompt once after a successful sign-in to enable Face ID / biometric login. */
export async function offerBiometricLogin(session: Session | null | undefined) {
  if (!session?.refresh_token) return;

  try {
    const [available, enabled] = await Promise.all([
      isBiometricAvailable(),
      hasBiometricLoginEnabled(),
    ]);
    if (!available || enabled) return;

    const label = await getBiometricLabel();
    Alert.alert(
      `Enable ${label}?`,
      `Next time, sign in quickly with ${label} instead of typing your password or using Apple or Google again.`,
      [
        { text: "Not now", style: "cancel" },
        {
          text: `Enable ${label}`,
          onPress: () => {
            void (async () => {
              const result = await enableBiometricLogin(session);
              if (!result.success && result.error) {
                Alert.alert(`Could not enable ${label}`, result.error);
              }
            })();
          },
        },
      ]
    );
  } catch {
    // Non-fatal: never block sign-in on opt-in prompt failures
  }
}
