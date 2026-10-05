import { useMemo } from "react";
import { Platform } from "react-native";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
import { FontFamily } from "../theme/fonts";

/** iOS large-title headers on the warm canvas, shared by every tab stack. */
export function useTabStackScreenOptions(): NativeStackNavigationOptions {
  const { colors } = useTheme();
  return useMemo(
    () => ({
      headerLargeTitleEnabled: Platform.OS === "ios",
      headerLargeTitleShadowVisible: false,
      headerShadowVisible: false,
      headerStyle: { backgroundColor: colors.background },
      headerLargeStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
      headerTitleStyle: { color: colors.text, fontWeight: "600" },
      headerLargeTitleStyle: {
        color: colors.text,
        fontFamily: FontFamily.display,
      },
      headerBackButtonDisplayMode: "minimal",
      contentStyle: { backgroundColor: colors.background },
    }),
    [colors]
  );
}
