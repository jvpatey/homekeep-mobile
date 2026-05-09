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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NewHomeownerStarterAnswers } from "../../data/maintenancePlans";
import { useMaintenancePlanAccent } from "./MaintenancePlanAccentContext";

interface NewHomeownerStarterQuestionnaireProps {
  onComplete: (answers: NewHomeownerStarterAnswers) => void;
  onBack: () => void;
  initialAnswers?: NewHomeownerStarterAnswers | null;
}

export function NewHomeownerStarterQuestionnaire({
  onComplete,
  onBack,
  initialAnswers,
}: NewHomeownerStarterQuestionnaireProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const accent = useMaintenancePlanAccent();
  const [hasHeatPump, setHasHeatPump] = useState<boolean | null>(null);
  const [hasAirExchanger, setHasAirExchanger] = useState<boolean | null>(null);
  const [hasWaterSoftener, setHasWaterSoftener] = useState<boolean | null>(
    null
  );
  const [hasRefrigeratorWaterFilter, setHasRefrigeratorWaterFilter] =
    useState<boolean | null>(null);
  const [hasVentHoodFilters, setHasVentHoodFilters] = useState<boolean | null>(
    null
  );
  const [hasSeptic, setHasSeptic] = useState<boolean | null>(null);

  useEffect(() => {
    if (!initialAnswers) {
      setHasHeatPump(null);
      setHasAirExchanger(null);
      setHasWaterSoftener(null);
      setHasRefrigeratorWaterFilter(null);
      setHasVentHoodFilters(null);
      setHasSeptic(null);
      return;
    }
    setHasHeatPump(initialAnswers.hasHeatPump);
    setHasAirExchanger(initialAnswers.hasAirExchanger);
    setHasWaterSoftener(initialAnswers.hasWaterSoftener);
    setHasRefrigeratorWaterFilter(initialAnswers.hasRefrigeratorWaterFilter);
    setHasVentHoodFilters(initialAnswers.hasVentHoodFilters);
    setHasSeptic(initialAnswers.hasSeptic);
  }, [initialAnswers]);

  const canContinue =
    hasHeatPump !== null &&
    hasAirExchanger !== null &&
    hasWaterSoftener !== null &&
    hasRefrigeratorWaterFilter !== null &&
    hasVentHoodFilters !== null &&
    hasSeptic !== null;

  const handleContinue = () => {
    if (
      hasHeatPump === null ||
      hasAirExchanger === null ||
      hasWaterSoftener === null ||
      hasRefrigeratorWaterFilter === null ||
      hasVentHoodFilters === null ||
      hasSeptic === null
    ) {
      return;
    }
    onComplete({
      hasHeatPump,
      hasAirExchanger,
      hasWaterSoftener,
      hasRefrigeratorWaterFilter,
      hasVentHoodFilters,
      hasSeptic,
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
          borderColor: selected ? accent : colors.border,
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
        <Ionicons name="checkmark-circle" size={22} color={accent} />
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
          A few quick answers so we only add equipment-specific routines—heat
          pump, ventilator, softener, fridge filter, vent hood, septic—when they
          apply.
        </Text>

        <GlassCard
          material="regular"
          radius={DesignSystem.borders.radius.glass}
          containerStyle={styles.cardGap}
          style={styles.cardInner}
        >
          <SectionLabel>Do you have a heat pump?</SectionLabel>
          <Text
            style={[styles.sectionHint, { color: colors.textSecondary }]}
          >
            Includes ducted heat pumps and mini-splits used for heating or
            cooling. Choose No if you only use a furnace, boiler, or baseboards.
          </Text>
          <ChoiceRow
            label="Yes"
            selected={hasHeatPump === true}
            onPress={() => setHasHeatPump(true)}
            accessibilityLabel="Yes, I have a heat pump"
          />
          <ChoiceRow
            label="No"
            selected={hasHeatPump === false}
            onPress={() => setHasHeatPump(false)}
            accessibilityLabel="No heat pump"
          />
        </GlassCard>

        <GlassCard
          material="regular"
          radius={DesignSystem.borders.radius.glass}
          containerStyle={styles.cardGap}
          style={styles.cardInner}
        >
          <SectionLabel>
            Do you have an HRV, ERV, or whole-home air exchanger?
          </SectionLabel>
          <Text
            style={[styles.sectionHint, { color: colors.textSecondary }]}
          >
            Some newer homes have balanced ventilation (labeled HRV or ERV).
            Skip if you only use bathroom fans or open windows for fresh air.
          </Text>
          <ChoiceRow
            label="Yes"
            selected={hasAirExchanger === true}
            onPress={() => setHasAirExchanger(true)}
            accessibilityLabel="Yes, I have HRV or ERV"
          />
          <ChoiceRow
            label="No"
            selected={hasAirExchanger === false}
            onPress={() => setHasAirExchanger(false)}
            accessibilityLabel="No whole-home air exchanger"
          />
        </GlassCard>

        <GlassCard
          material="regular"
          radius={DesignSystem.borders.radius.glass}
          containerStyle={styles.cardGap}
          style={styles.cardInner}
        >
          <SectionLabel>Do you have a water softener?</SectionLabel>
          <Text
            style={[styles.sectionHint, { color: colors.textSecondary }]}
          >
            Usually a brine tank near the mechanical room or garage. Choose No
            if you are on municipal water only or use another treatment.
          </Text>
          <ChoiceRow
            label="Yes"
            selected={hasWaterSoftener === true}
            onPress={() => setHasWaterSoftener(true)}
            accessibilityLabel="Yes, I have a water softener"
          />
          <ChoiceRow
            label="No"
            selected={hasWaterSoftener === false}
            onPress={() => setHasWaterSoftener(false)}
            accessibilityLabel="No water softener"
          />
        </GlassCard>

        <GlassCard
          material="regular"
          radius={DesignSystem.borders.radius.glass}
          containerStyle={styles.cardGap}
          style={styles.cardInner}
        >
          <SectionLabel>
            Does your refrigerator have a replaceable water filter?
          </SectionLabel>
          <Text
            style={[styles.sectionHint, { color: colors.textSecondary }]}
          >
            Common if you have a water or ice dispenser through the door. Choose
            No if your fridge has no filter or you never use the dispenser.
          </Text>
          <ChoiceRow
            label="Yes"
            selected={hasRefrigeratorWaterFilter === true}
            onPress={() => setHasRefrigeratorWaterFilter(true)}
            accessibilityLabel="Yes, refrigerator has water filter"
          />
          <ChoiceRow
            label="No"
            selected={hasRefrigeratorWaterFilter === false}
            onPress={() => setHasRefrigeratorWaterFilter(false)}
            accessibilityLabel="No refrigerator water filter"
          />
        </GlassCard>

        <GlassCard
          material="regular"
          radius={DesignSystem.borders.radius.glass}
          containerStyle={styles.cardGap}
          style={styles.cardInner}
        >
          <SectionLabel>
            Does your kitchen have a vent hood or microwave hood with grease
            filters?
          </SectionLabel>
          <Text
            style={[styles.sectionHint, { color: colors.textSecondary }]}
          >
            Most hoods and over-the-range microwaves have removable metal mesh
            filters. Choose No only if you truly have no hood or downdraft with
            filters to clean.
          </Text>
          <ChoiceRow
            label="Yes"
            selected={hasVentHoodFilters === true}
            onPress={() => setHasVentHoodFilters(true)}
            accessibilityLabel="Yes, kitchen vent hood with grease filters"
          />
          <ChoiceRow
            label="No"
            selected={hasVentHoodFilters === false}
            onPress={() => setHasVentHoodFilters(false)}
            accessibilityLabel="No vent hood grease filters"
          />
        </GlassCard>

        <GlassCard
          material="regular"
          radius={DesignSystem.borders.radius.glass}
          containerStyle={styles.cardGap}
          style={styles.cardInner}
        >
          <SectionLabel>Do you have a septic system?</SectionLabel>
          <Text
            style={[styles.sectionHint, { color: colors.textSecondary }]}
          >
            Private tank and drain field—not city sewer. Choose No if your bill
            lists sewer charges or you know you are hooked up to municipal lines.
          </Text>
          <ChoiceRow
            label="Yes"
            selected={hasSeptic === true}
            onPress={() => setHasSeptic(true)}
            accessibilityLabel="Yes, I have septic"
          />
          <ChoiceRow
            label="No"
            selected={hasSeptic === false}
            onPress={() => setHasSeptic(false)}
            accessibilityLabel="No septic, connected to sewer"
          />
        </GlassCard>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            paddingBottom: DesignSystem.spacing.md + insets.bottom,
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
              backgroundColor: canContinue ? accent : colors.border,
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
