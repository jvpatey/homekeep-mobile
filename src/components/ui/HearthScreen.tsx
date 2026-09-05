import React, { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import {
  Edge,
  SafeAreaView,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../../context/ThemeContext";

interface HearthScreenProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Safe area edges to respect. Default: top, left, right (bottom handled per-screen). */
  edges?: Edge[];
}

/**
 * Full-screen shell with iOS safe areas and themed StatusBar.
 * Use edges={["top","left","right"]} for stack screens; omit bottom and pad scroll content instead.
 */
export function HearthScreen({
  children,
  style,
  edges = ["top", "left", "right"],
}: HearthScreenProps) {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
      edges={edges}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
    </SafeAreaView>
  );
}
