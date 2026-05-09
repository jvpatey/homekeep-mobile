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
import type { ColdWeatherPrepAnswers } from "../../data/maintenancePlans";

interface ColdWeatherPrepQuestionnaireProps {
  onComplete: (answers: ColdWeatherPrepAnswers) => void;
  onBack: () => void;
  initialAnswers?: ColdWeatherPrepAnswers | null;
}

export function ColdWeatherPrepQuestionnaire({
  onComplete,
  onBack,
  initialAnswers,
}: ColdWeatherPrepQuestionnaireProps) {
  const { colors, isDark } = useTheme();
  const [hasLawn, setHasLawn] = useState<boolean | null>(null);
  const [propertyType, setPropertyType] = useState<
    "house" | "condo_townhome" | null
  >(null);
  const [heatSource, setHeatSource] = useState<
    ColdWeatherPrepAnswers["heatSource"] | null
  >(null);

  useEffect(() => {
    if (!initialAnswers) {
      setHasLawn(null);
      setPropertyType(null);
      setHeatSource(null);
      return;
    }
    setHasLawn(initialAnswers.hasLawn);
    setPropertyType(initialAnswers.propertyType);
    setHeatSource(initialAnswers.heatSource);
  }, [initialAnswers]);

  const canContinue =
    hasLawn !== null && propertyType !== null && heatSource !== null;

  const handleContinue = () => {
    if (
      hasLawn === null ||
      propertyType === null ||
      heatSource === null
    ) {
      return;
    }
    onComplete({
      hasLawn,
      propertyType,
      heatSource,
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
          {`Tell us about your home so your fall and winter checklist matches what you maintain — yard work, roof and gutters, outdoor plumbing, and heating type.`}
        </Text>

        <GlassCard
          material="regular"
          radius={DesignSystem.borders.radius.glass}
          containerStyle={styles.cardGap}
          style={styles.cardInner}
        >
          <SectionLabel>Do you have a lawn?</SectionLabel>
          <ChoiceRow
            label="Yes"
            selected={hasLawn === true}
            onPress={() => setHasLawn(true)}
            accessibilityLabel="Yes, I have a lawn"
          />
          <ChoiceRow
            label="No"
            selected={hasLawn === false}
            onPress={() => setHasLawn(false)}
            accessibilityLabel="No lawn"
          />
        </GlassCard>

        <GlassCard
          material="regular"
          radius={DesignSystem.borders.radius.glass}
          containerStyle={styles.cardGap}
          style={styles.cardInner}
        >
          <SectionLabel>What best describes your home?</SectionLabel>
          <ChoiceRow
            label="House (I maintain my own exterior)"
            selected={propertyType === "house"}
            onPress={() => setPropertyType("house")}
            accessibilityLabel="House, I maintain exterior"
          />
          <ChoiceRow
            label="Condo or townhome"
            selected={propertyType === "condo_townhome"}
            onPress={() => setPropertyType("condo_townhome")}
            accessibilityLabel="Condo or townhome"
          />
        </GlassCard>

        <GlassCard
          material="regular"
          radius={DesignSystem.borders.radius.glass}
          containerStyle={styles.cardGap}
          style={styles.cardInner}
        >
          <SectionLabel>How do you heat your home?</SectionLabel>
          <Text
            style={[styles.sectionHint, { color: colors.textSecondary }]}
          >
            We suggest furnace tune-ups for gas, filter + pro cadence for heat
            pumps, and skip fuel-specific tasks if you do not use them.
          </Text>
          <ChoiceRow
            label="Gas furnace"
            selected={heatSource === "gas_furnace"}
            onPress={() => setHeatSource("gas_furnace")}
            accessibilityLabel="Gas furnace"
          />
          <ChoiceRow
            label="Heat pump"
            selected={heatSource === "heat_pump"}
            onPress={() => setHeatSource("heat_pump")}
            accessibilityLabel="Heat pump"
          />
          <ChoiceRow
            label="Electric (radiant / baseboard)"
            selected={heatSource === "electric"}
            onPress={() => setHeatSource("electric")}
            accessibilityLabel="Electric heat"
          />
          <ChoiceRow
            label="Other"
            selected={heatSource === "other"}
            onPress={() => setHeatSource("other")}
            accessibilityLabel="Other heating"
          />
        </GlassCard>
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
