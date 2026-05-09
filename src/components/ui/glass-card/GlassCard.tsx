import React from "react";
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "../../../context/ThemeContext";
import { DesignSystem } from "../../../theme/designSystem";

type Material = keyof typeof DesignSystem.materials;

interface GlassCardProps {
  children: React.ReactNode;
  material?: Material;
  /** Applied to the inner glass surface (where children render). */
  style?: StyleProp<ViewStyle>;
  /** Applied to the outer wrapper (shadow/layout). */
  containerStyle?: StyleProp<ViewStyle>;
  radius?: number;
  borderless?: boolean;
}

/**
 * 2026 Liquid Glass surface. Wraps `expo-blur`'s BlurView with a hairline
 * border and layered ambient + key shadows. On Android, BlurView's quality
 * is inconsistent, so we fall back to a translucent solid fill.
 */
export function GlassCard({
  children,
  material = "regular",
  style,
  containerStyle: containerStyleProp,
  radius = DesignSystem.borders.radius.glass,
  borderless = false,
}: GlassCardProps) {
  const { colors, isDark } = useTheme();
  const { intensity } = DesignSystem.materials[material];

  const containerStyle: StyleProp<ViewStyle> = [
    styles.shadow,
    {
      borderRadius: radius,
      shadowColor: "#000",
    },
    containerStyleProp,
  ];

  const surfaceStyle: StyleProp<ViewStyle> = [
    styles.surface,
    {
      borderRadius: radius,
      borderWidth: borderless ? 0 : DesignSystem.borders.hairline,
      borderColor: colors.glassStroke,
      backgroundColor: colors.glassTint,
    },
    style,
  ];

  if (Platform.OS === "ios") {
    return (
      <View style={containerStyle}>
        <BlurView
          intensity={intensity}
          tint={isDark ? "dark" : "light"}
          style={surfaceStyle}
        >
          {children}
        </BlurView>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <View
        style={[
          surfaceStyle,
          {
            backgroundColor: isDark
              ? "rgba(35, 37, 38, 0.85)"
              : "rgba(255, 255, 255, 0.85)",
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    // Layered soft shadow approximating iOS 26 ambient + key.
    // Single shadow per platform; we pick the larger key shadow for impact.
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  surface: {
    overflow: "hidden",
  },
});
