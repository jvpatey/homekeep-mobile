import React, { ReactNode } from "react";
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";

interface TabScreenHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * In-content header for tab root screens, sized and placed like the Home
 * dashboard header so all three tabs start at the same height.
 */
export function TabScreenHeader({
  title,
  subtitle,
  actions,
  style,
}: TabScreenHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          // iOS: the scroll view's automatic content inset clears the status bar.
          paddingTop:
            (Platform.OS === "ios" ? 0 : insets.top) + DesignSystem.spacing.sm,
        },
        style,
      ]}
    >
      <View style={styles.titleRow}>
        <Text
          style={[styles.title, { color: colors.text }]}
          accessibilityRole="header"
          maxFontSizeMultiplier={1.25}
          numberOfLines={1}
        >
          {title}
        </Text>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
      {subtitle ? (
        <Text
          style={[styles.subtitle, { color: colors.textSecondary }]}
          maxFontSizeMultiplier={1.4}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

interface TabHeaderActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  accessibilityHint?: string;
  onPress: () => void;
}

/** Tinted circular button matching the dashboard's add button. */
export function TabHeaderAction({
  icon,
  accessibilityLabel,
  accessibilityHint,
  onPress,
}: TabHeaderActionProps) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();

  return (
    <Pressable
      onPress={() => {
        triggerLight();
        onPress();
      }}
      hitSlop={6}
      style={({ pressed }) => [styles.actionHit, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <View
        style={[
          styles.actionCircle,
          { backgroundColor: colors.primary + "18" },
        ]}
      >
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: DesignSystem.components.minTouchTarget,
    gap: DesignSystem.spacing.md,
  },
  title: {
    ...DesignSystem.typography.title1,
    flexShrink: 1,
  },
  subtitle: {
    ...DesignSystem.typography.footnote,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  actionHit: {
    minWidth: DesignSystem.components.minTouchTarget,
    minHeight: DesignSystem.components.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
