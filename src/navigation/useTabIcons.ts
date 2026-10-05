import { useEffect, useState } from "react";
import { ImageSourcePropType, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeBottomTabIcon } from "@react-navigation/bottom-tabs/unstable";

type SFSymbol = Extract<NativeBottomTabIcon, { type: "sfSymbol" }>["name"];

type TabKey = "home" | "record" | "plan";

const SF_SYMBOLS: Record<TabKey, { normal: SFSymbol; focused: SFSymbol }> = {
  home: { normal: "house", focused: "house.fill" },
  record: { normal: "tray.full", focused: "tray.full.fill" },
  plan: { normal: "calendar", focused: "calendar" },
};

const IONICONS: Record<TabKey, keyof typeof Ionicons.glyphMap> = {
  home: "home",
  record: "file-tray-full",
  plan: "calendar",
};

let androidCache: Partial<Record<TabKey, ImageSourcePropType>> | null = null;

/**
 * SF Symbols on iOS; rasterised Ionicons on Android (native tabs need images).
 */
export function useTabIcons(): (
  key: TabKey
) => ((props: { focused: boolean }) => NativeBottomTabIcon) | undefined {
  const [android, setAndroid] = useState(androidCache);

  useEffect(() => {
    if (Platform.OS === "ios" || androidCache) return;
    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        (Object.keys(IONICONS) as TabKey[]).map(async (key) => {
          const source = await Ionicons.getImageSource(IONICONS[key], 24, "#000000");
          return [key, source] as const;
        })
      );
      const next: Partial<Record<TabKey, ImageSourcePropType>> = {};
      for (const [key, source] of entries) {
        if (source) next[key] = source as ImageSourcePropType;
      }
      androidCache = next;
      if (!cancelled) setAndroid(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (key) => {
    if (Platform.OS === "ios") {
      return ({ focused }) => ({
        type: "sfSymbol",
        name: focused ? SF_SYMBOLS[key].focused : SF_SYMBOLS[key].normal,
      });
    }
    const source = android?.[key];
    if (!source) return undefined;
    return () => ({ type: "image", source });
  };
}
