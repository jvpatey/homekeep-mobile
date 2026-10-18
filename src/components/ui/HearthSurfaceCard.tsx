import React, { ReactNode } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";

export type SurfaceEmphasis = "default" | "hero" | "tinted";

interface HearthSurfaceCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  /** `hero` adds a soft primary wash; `tinted` washes the card in `tint`. */
  emphasis?: SurfaceEmphasis;
  /** Tint colour for `emphasis="tinted"`. Defaults to the primary colour. */
  tint?: string;
}

/** Warm surface card — the one card surface for Hearth screens. */
export function HearthSurfaceCard({
  children,
  style,
  containerStyle,
  emphasis = "default",
  tint,
}: HearthSurfaceCardProps) {
  const { colors, isDark } = useTheme();
  const wash = tint ?? colors.primary;
  const shadowBase = [styles.shadow, { backgroundColor: colors.surface }];

  // Shadows sit on unclipped wrappers; iOS drops shadows on overflow-hidden views.
  return (
    <View style={containerStyle}>
      <View style={[shadowBase, DesignSystem.shadows.softAmbient]}>
        <View style={[shadowBase, DesignSystem.shadows.softKey]}>
          <View
            style={[
              styles.surface,
              {
                backgroundColor: colors.surface,
                borderColor:
                  emphasis === "tinted"
                    ? wash + (isDark ? "55" : "40")
                    : colors.border,
              },
              style,
            ]}
          >
            {emphasis === "hero" ? (
              <LinearGradient
                colors={[wash + (isDark ? "2E" : "1A"), "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
            ) : null}
            {emphasis === "tinted" ? (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: wash + (isDark ? "1F" : "12") },
                ]}
                pointerEvents="none"
              />
            ) : null}
            {children}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: DesignSystem.borders.radius.xlarge,
  },
  surface: {
    borderRadius: DesignSystem.borders.radius.xlarge,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});
