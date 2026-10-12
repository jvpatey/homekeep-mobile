import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useCurrency } from "../../hooks/useCurrency";
import { MaintenanceRoutine } from "../../types/maintenance";
import { SpendYear, compareBudget } from "../../utils/spendLedger";
import {
  expectedAnnualUpkeep,
  upkeepInCurrency,
} from "../../utils/upkeepEstimate";
import { DesignSystem } from "../../theme/designSystem";

/**
 * Recorded upkeep spend for a year against what the current recurring
 * schedule typically costs (DIY-to-pro range, pro-rated for this year).
 */
export function BudgetVsActualCard({
  year,
  routines,
}: {
  year: SpendYear;
  routines: MaintenanceRoutine[];
}) {
  const { colors } = useTheme();
  const { currency, format } = useCurrency();

  const expected = useMemo(
    () => upkeepInCurrency(expectedAnnualUpkeep(routines), currency),
    [routines, currency]
  );
  const comparison = expected ? compareBudget(year, expected) : null;
  if (!expected || !comparison || expected.pro <= 0) return null;

  const money = (value: number) => format(value, { whole: true });
  const isCurrentYear = comparison.yearFraction < 1;
  const scaleMax =
    Math.max(comparison.expectedHigh, comparison.upkeepSpent, 1) * 1.15;
  const bandLeft = comparison.expectedLow / scaleMax;
  const bandWidth = Math.max(
    (comparison.expectedHigh - comparison.expectedLow) / scaleMax,
    0.02
  );
  const marker = Math.min(comparison.upkeepSpent / scaleMax, 1);
  const range = `${money(comparison.expectedLow)}–${money(comparison.expectedHigh)}`;
  const period = isCurrentYear ? "so far this year" : `in ${year.year}`;
  const typical = isCurrentYear ? "typical by now" : "typical for a year";

  const statusText =
    comparison.status === "under"
      ? `${money(comparison.upkeepSpent)} on upkeep ${period}, below the ${range} ${typical}. Doing it yourself, or a few costs not logged yet.`
      : comparison.status === "over"
        ? `${money(comparison.upkeepSpent)} on upkeep ${period}, above the ${range} ${typical}.`
        : `${money(comparison.upkeepSpent)} on upkeep ${period}, right in the ${range} ${typical}.`;
  const statusColor =
    comparison.status === "over"
      ? (colors.warning ?? colors.primary)
      : comparison.status === "within"
        ? (colors.success ?? colors.primary)
        : colors.primary;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        DesignSystem.shadows.softAmbient,
      ]}
      accessible
      accessibilityLabel={`Budget versus actual. ${statusText}`}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Budget vs. actual
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Your schedule typically costs {money(expected.diy)}–{money(expected.pro)}{" "}
        a year, DIY to hired.
      </Text>

      <View style={[styles.track, { backgroundColor: colors.fieldFill }]}>
        <View
          style={[
            styles.band,
            {
              left: `${bandLeft * 100}%`,
              width: `${bandWidth * 100}%`,
              backgroundColor: colors.primary + "40",
            },
          ]}
        />
        <View
          style={[
            styles.marker,
            {
              left: `${marker * 100}%`,
              backgroundColor: statusColor,
              borderColor: colors.surface,
            },
          ]}
        />
      </View>

      <Text style={[styles.status, { color: colors.text }]}>{statusText}</Text>
      <Text style={[styles.caption, { color: colors.textSecondary }]}>
        {comparison.repairSpent > 0
          ? `Repairs (${money(comparison.repairSpent)}) aren't counted. `
          : ""}
        Estimate from {expected.covered} of {expected.total} recurring tasks.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.xs,
  },
  title: {
    ...DesignSystem.typography.bodySemiBold,
  },
  subtitle: {
    ...DesignSystem.typography.footnote,
  },
  track: {
    height: 12,
    borderRadius: 6,
    marginVertical: DesignSystem.spacing.sm,
    justifyContent: "center",
  },
  band: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: 6,
  },
  marker: {
    position: "absolute",
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: 8,
    borderWidth: 2,
  },
  status: {
    ...DesignSystem.typography.small,
    lineHeight: 20,
  },
  caption: {
    ...DesignSystem.typography.caption,
    marginTop: 2,
  },
});
