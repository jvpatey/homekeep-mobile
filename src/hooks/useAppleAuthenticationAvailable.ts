import { useEffect, useState } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as AppleAuthentication from "expo-apple-authentication";

function isExpoGo() {
  return (
    Constants.appOwnership === "expo" ||
    Constants.executionEnvironment === "storeClient"
  );
}

/**
 * True only when the native Apple Authentication view can render.
 * Expo Go does not include that view manager and shows a red
 * "Unimplemented component" banner if we mount the button anyway.
 */
export function useAppleAuthenticationAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios" || isExpoGo()) {
      return;
    }

    let cancelled = false;
    AppleAuthentication.isAvailableAsync()
      .then((value) => {
        if (!cancelled) setAvailable(value);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return available;
}
