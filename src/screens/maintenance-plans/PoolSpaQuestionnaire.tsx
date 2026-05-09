import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/ui";
import { DesignSystem } from "../../theme/designSystem";
import type { PoolSpaAnswers } from "../../data/maintenancePlans";

interface PoolSpaQuestionnaireProps {
  onComplete: (answers: PoolSpaAnswers) => void;
  onBack: () => void;
  initialAnswers?: PoolSpaAnswers | null;
}

export function PoolSpaQuestionnaire({
  onComplete,
  onBack,
  initialAnswers,
}: PoolSpaQuestionnaireProps) {
  const { colors, isDark } = useTheme();
  const [hasPool, setHasPool] = useState<boolean | null>(null);
  const [hasSpa, setHasSpa] = useState<boolean | null>(null);
  const [poolUsesSaltChlorination, setPoolUsesSaltChlorination] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    if (!initialAnswers) {
      setHasPool(null);
      setHasSpa(null);
      setPoolUsesSaltChlorination(null);
      return;
    }
    setHasPool(initialAnswers.hasPool);
    setHasSpa(initialAnswers.hasSpa);
    setPoolUsesSaltChlorination(initialAnswers.poolUsesSaltChlorination);
  }, [initialAnswers]);

  useEffect(() => {
    if (hasPool === false) {
      setPoolUsesSaltChlorination(null);
    }
  }, [hasPool]);

  const hasAtLeastOne =
    hasPool === true || hasSpa === true;
  const saltAnsweredIfNeeded =
    hasPool !== true ||
    (poolUsesSaltChlorination === true ||
      poolUsesSaltChlorination === false);

  const canContinue =
    hasPool !== null &&
    hasSpa !== null &&
    hasAtLeastOne &&
    saltAnsweredIfNeeded;

  const handleContinue = () => {
    if (!canContinue || hasPool === null || hasSpa === null) return;
    const salt =
      hasPool && poolUsesSaltChlorination !== null
        ? poolUsesSaltChlorination
        : false;
    onComplete({
      hasPool,
      hasSpa,
      poolUsesSaltChlorination: salt,
    });
  };

  const SectionLabel = ({ children }: { children: string }) => (
    <Text
      style={[
        styles.sectionLabel,
        { color: colors.textSecondary },
      ]}
    >
      {children}
    </Text>
  );

  const ChoiceRow = ({
    label,
    selected,
    onPress,
    accessibilityLabel,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
    accessibilityLabel: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.choiceRow,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected
            ? isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.03)"
            : "transparent",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
    >
      <Text style={[styles.choiceLabel, { color: colors.text }]}>{label}</Text>
      {selected ? (
        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
      ) : (
        <View
          style={[
            styles.radioOuter,
            { borderColor: colors.border },
          ]}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Tell us what you maintain so we include pool care, spa care, and salt
          cell cleaning only when they apply.
        </Text>

        <GlassCard
          material="regular"
          radius={DesignSystem.borders.radius.glass}
          containerStyle={styles.cardGap}
          style={styles.cardInner}
        >
          <SectionLabel>Do you have a swimming pool?</SectionLabel>
          <ChoiceRow
            label="Yes"
            selected={hasPool === true}
            onPress={() => setHasPool(true)}
            accessibilityLabel="Yes, I have a pool"
          />
          <ChoiceRow
            label="No"
            selected={hasPool === false}
            onPress={() => setHasPool(false)}
            accessibilityLabel="No swimming pool"
          />
        </GlassCard>

        <GlassCard
          material="regular"
          radius={DesignSystem.borders.radius.glass}
          containerStyle={styles.cardGap}
          style={styles.cardInner}
        >
          <SectionLabel>Do you have a hot tub or spa?</SectionLabel>
          <ChoiceRow
            label="Yes"
            selected={hasSpa === true}
            onPress={() => setHasSpa(true)}
            accessibilityLabel="Yes, I have a hot tub or spa"
          />
          <ChoiceRow
            label="No"
            selected={hasSpa === false}
            onPress={() => setHasSpa(false)}
            accessibilityLabel="No hot tub or spa"
          />
        </GlassCard>

        {hasPool === true ? (
          <GlassCard
            material="regular"
            radius={DesignSystem.borders.radius.glass}
            containerStyle={styles.cardGap}
            style={styles.cardInner}
          >
            <SectionLabel>Does your pool use salt chlorination?</SectionLabel>
            <Text
              style={[styles.sectionHint, { color: colors.textSecondary }]}
            >
              Saltwater systems generate chlorine from a salt cell. Choose No if
              you use tablets, liquid chlorine, or a non-salt sanitizer only.
            </Text>
            <ChoiceRow
              label="Yes"
              selected={poolUsesSaltChlorination === true}
              onPress={() => setPoolUsesSaltChlorination(true)}
              accessibilityLabel="Yes, salt chlorination"
            />
            <ChoiceRow
              label="No"
              selected={poolUsesSaltChlorination === false}
              onPress={() => setPoolUsesSaltChlorination(false)}
              accessibilityLabel="No salt chlorination"
            />
          </GlassCard>
        ) : null}

        {hasPool === false && hasSpa === false ? (
          <Text
            style={[styles.warningHint, { color: colors.textSecondary }]}
          >
            Choose at least a pool or a spa to continue.
          </Text>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: colors.border }]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            {
              backgroundColor: canContinue ? colors.primary : colors.border,
            },
          ]}
          onPress={handleContinue}
          disabled={!canContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue to checklist"
        >
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.xxxl,
  },
  intro: {
    ...DesignSystem.typography.body,
    marginBottom: DesignSystem.spacing.lg,
    lineHeight: 22,
  },
  warningHint: {
    ...DesignSystem.typography.small,
    marginTop: DesignSystem.spacing.sm,
    lineHeight: 18,
    fontStyle: "italic",
  },
  cardGap: {
    marginBottom: DesignSystem.spacing.md,
  },
  cardInner: {
    padding: DesignSystem.spacing.md,
  },
  sectionLabel: {
    ...DesignSystem.typography.smallSemiBold,
    marginBottom: DesignSystem.spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionHint: {
    ...DesignSystem.typography.small,
    marginBottom: DesignSystem.spacing.sm,
    lineHeight: 18,
  },
  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: DesignSystem.spacing.sm,
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
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  secondaryBtnText: {
    ...DesignSystem.typography.bodySemiBold,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    alignItems: "center",
  },
  primaryBtnText: {
    ...DesignSystem.typography.bodySemiBold,
    color: "#FFFFFF",
  },
});
