import React, { ReactNode } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { Button, HearthSurfaceCard } from "../../components/ui";
import { DesignSystem } from "../../theme/designSystem";
import { useScreenInsets } from "../../hooks";

export function QuestionnaireShell({
  children,
  progressLabel,
  canContinue,
  onContinue,
  onCancel,
  continueLabel = "Continue",
}: {
  children: ReactNode;
  progressLabel?: string;
  canContinue: boolean;
  onContinue: () => void;
  onCancel: () => void;
  continueLabel?: string;
}) {
  const { colors } = useTheme();
  const { footerPaddingBottom } = useScreenInsets();

  return (
    <View style={chrome.wrapper}>
      <ScrollView
        style={chrome.scroll}
        contentContainerStyle={chrome.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {progressLabel ? (
          <Text style={[chrome.progress, { color: colors.textSecondary }]}>
            {progressLabel}
          </Text>
        ) : null}
        {children}
      </ScrollView>
      <View
        style={[
          chrome.footer,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            paddingBottom: footerPaddingBottom,
          },
        ]}
      >
        <Button
          label={continueLabel}
          onPress={onContinue}
          disabled={!canContinue}
          accessibilityLabel="Continue to checklist"
        />
        <Button label="Cancel" onPress={onCancel} variant="ghost" />
      </View>
    </View>
  );
}

export function QuestionCard({ children }: { children: ReactNode }) {
  return (
    <HearthSurfaceCard
      containerStyle={chrome.cardGap}
      style={chrome.cardInner}
    >
      {children}
    </HearthSurfaceCard>
  );
}

export function QuestionLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[chrome.sectionLabel, { color: colors.textSecondary }]}>
      {children}
    </Text>
  );
}

export function QuestionHint({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[chrome.sectionHint, { color: colors.textSecondary }]}>
      {children}
    </Text>
  );
}

export function ChoiceRow({
  label,
  selected,
  onPress,
  accessibilityLabel,
  multiple = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  /** When true, the row toggles independently of siblings. */
  multiple?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        chrome.choiceRow,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary + "12" : "transparent",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole={multiple ? "checkbox" : "radio"}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={multiple ? { checked: selected } : { selected }}
    >
      <Text style={[chrome.choiceLabel, { color: colors.text }]}>{label}</Text>
      {selected ? (
        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
      ) : (
        <View style={[chrome.radioOuter, { borderColor: colors.border }]} />
      )}
    </TouchableOpacity>
  );
}

const chrome = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.xxxl,
  },
  progress: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: DesignSystem.spacing.sm,
  },
  cardGap: {
    marginBottom: DesignSystem.spacing.md,
  },
  cardInner: {
    padding: DesignSystem.spacing.md,
  },
  sectionLabel: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
    marginBottom: DesignSystem.spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionHint: {
    ...DesignSystem.typography.caption,
    marginBottom: DesignSystem.spacing.sm,
    lineHeight: 18,
  },
  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: DesignSystem.spacing.sm,
    minHeight: DesignSystem.components.minTouchTarget,
  },
  choiceLabel: {
    ...DesignSystem.typography.body,
    flex: 1,
    paddingRight: DesignSystem.spacing.sm,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  footer: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: DesignSystem.spacing.xs,
  },
});
