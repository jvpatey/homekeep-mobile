import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { HearthSurfaceCard } from "./HearthSurfaceCard";

interface TodayAlertCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  /** Defaults to the primary colour. */
  tint?: string;
  actionLabel?: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onAction?: () => void;
  actionBusy?: boolean;
  /** Whole-card tap; used when there is no explicit action button. */
  onPress?: () => void;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** One alert anatomy for Today: icon, title, one line, one action, dismiss. */
export function TodayAlertCard({
  icon,
  title,
  body,
  tint,
  actionLabel,
  actionIcon,
  onAction,
  actionBusy,
  onPress,
  onDismiss,
  style,
}: TodayAlertCardProps) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  const color = tint ?? colors.primary;

  const content = (
    <View style={styles.inner}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: color + "22" }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={styles.copy}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
            maxFontSizeMultiplier={1.4}
          >
            {title}
          </Text>
          {body ? (
            <Text
              style={[styles.body, { color: colors.textSecondary }]}
              numberOfLines={2}
              maxFontSizeMultiplier={1.4}
            >
              {body}
            </Text>
          ) : null}
        </View>
        {onDismiss ? (
          <Pressable
            onPress={() => {
              void triggerLight();
              onDismiss();
            }}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={`Dismiss ${title}`}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>
        ) : onPress ? (
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={() => {
            void triggerLight();
            onAction();
          }}
          disabled={actionBusy}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: color, opacity: actionBusy ? 0.7 : pressed ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          accessibilityState={{ busy: !!actionBusy }}
        >
          {actionBusy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              {actionIcon ? (
                <Ionicons name={actionIcon} size={16} color="#fff" />
              ) : null}
              <Text style={styles.actionText}>{actionLabel}</Text>
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <HearthSurfaceCard emphasis="tinted" tint={color} containerStyle={style}>
      {onPress ? (
        <Pressable
          onPress={() => {
            void triggerLight();
            onPress();
          }}
          style={({ pressed }) => pressed && { opacity: 0.7 }}
          accessibilityRole="button"
          accessibilityLabel={body ? `${title}. ${body}` : title}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
    </HearthSurfaceCard>
  );
}

const styles = StyleSheet.create({
  inner: {
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignSystem.spacing.md - 4,
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
    gap: 2,
    paddingTop: 1,
  },
  title: {
    ...DesignSystem.typography.subhead,
    fontWeight: "600",
  },
  body: {
    ...DesignSystem.typography.footnote,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
    borderRadius: DesignSystem.borders.radius.round,
  },
  actionText: {
    ...DesignSystem.typography.subhead,
    fontWeight: "600",
    color: "#fff",
  },
});
