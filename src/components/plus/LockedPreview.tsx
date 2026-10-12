import React, { ReactNode } from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { HOMEKEEP_PLUS_NAME } from "../../lib/purchases";
import { PlusFeatureKey, usePlusFeature } from "../../lib/plusFeatures";
import { DesignSystem } from "../../theme/designSystem";
import { Button } from "../ui/Button";

/**
 * Shows real content under a blur with an unlock card, so free users see
 * what they'd get. Renders children untouched for HomeKeep + members.
 */
export function LockedPreview({
  feature,
  children,
  style,
}: {
  feature: PlusFeatureKey;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, isDark } = useTheme();
  const { triggerLight } = useHaptics();
  const { locked, unlock, feature: meta } = usePlusFeature(feature);

  if (!locked) return <>{children}</>;

  return (
    <View style={[styles.wrap, style]}>
      <View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {children}
      </View>
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={22}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark
                ? "rgba(28, 26, 24, 0.9)"
                : "rgba(250, 247, 242, 0.9)",
            },
          ]}
        />
      )}
      <View style={styles.cardSlot} pointerEvents="box-none">
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            DesignSystem.shadows.softKey,
          ]}
        >
          <View
            style={[styles.icon, { backgroundColor: colors.primary + "18" }]}
          >
            <Ionicons name="lock-closed" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {meta.headline}
          </Text>
          <Text style={[styles.blurb, { color: colors.textSecondary }]}>
            {meta.blurb}
          </Text>
          <View style={styles.action}>
            <Button
              label={`Unlock with ${HOMEKEEP_PLUS_NAME}`}
              onPress={() => {
                triggerLight();
                void unlock();
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 320,
    overflow: "hidden",
    borderRadius: DesignSystem.borders.radius.large,
  },
  cardSlot: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    paddingTop: DesignSystem.spacing.xl,
    paddingHorizontal: DesignSystem.spacing.md,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borders.radius.xlarge,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.sm + 2,
  },
  title: {
    ...DesignSystem.typography.title2,
    fontSize: 20,
    lineHeight: 26,
    textAlign: "center",
  },
  blurb: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
    textAlign: "center",
    marginTop: DesignSystem.spacing.xs + 2,
  },
  action: {
    alignSelf: "stretch",
    marginTop: DesignSystem.spacing.md,
  },
});
