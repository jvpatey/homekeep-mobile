import React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { DesignSystem } from "../../theme/designSystem";
import { HOMEKEEP_PLUS_NAME } from "../../lib/purchases";
import { useHaptics } from "../../hooks";

export function PlusStatusBanner() {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const {
    isPlus,
    status,
    daysRemaining,
    presentPaywall,
    loading,
  } = useSubscription();
  const { triggerLight } = useHaptics();

  const setupDone = Boolean(profile?.home_setup_set_at);
  const trialEnding =
    isPlus &&
    (status === "trialing" || status === "promo") &&
    daysRemaining != null &&
    daysRemaining <= 7;
  const lapsed = setupDone && !isPlus && !loading;

  if (!trialEnding && !lapsed) return null;

  const title = trialEnding
    ? daysRemaining === 1
      ? "1 day left on us"
      : `${daysRemaining} days left on us`
    : `${HOMEKEEP_PLUS_NAME} is paused`;
  const subtitle = trialEnding
    ? `Subscribe to keep this home on schedule.`
    : "Viewing only — subscribe to complete tasks, reminders, and sharing.";

  return (
    <Pressable
      onPress={() => {
        void triggerLight();
        void presentPaywall();
      }}
      style={[
        styles.banner,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}15` }]}>
        <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: DesignSystem.spacing.sm,
    ...DesignSystem.shadows.softKey,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...DesignSystem.typography.smallSemiBold,
  },
  subtitle: {
    ...DesignSystem.typography.caption,
    marginTop: 2,
  },
});
