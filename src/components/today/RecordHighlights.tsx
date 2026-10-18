import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarYears,
} from "date-fns";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { useRecordData } from "../../hooks/useRecordData";
import { useEquipmentIndex } from "../../hooks/useEquipmentIndex";
import { useCurrency } from "../../hooks/useCurrency";
import { usePlusFeature } from "../../lib/plusFeatures";
import { useAppNavigation } from "../../navigation/useAppNavigation";
import { countFilledEmergencySpots } from "../../types/homeEmergency";
import { computeSpendLedger, spendForYear } from "../../utils/spendLedger";
import { DesignSystem } from "../../theme/designSystem";
import { SectionHeader, StatTile } from "../ui";

/** "Today", "3d ago", "2w ago", "4mo ago": fits a 132pt tile at display size. */
function shortAgo(date: Date, now = new Date()): string {
  const days = differenceInCalendarDays(now, date);
  if (days <= 0) return "Today";
  if (days < 14) return `${days}d ago`;
  if (days < 60) return `${Math.floor(days / 7)}w ago`;
  const months = differenceInCalendarMonths(now, date);
  if (months < 12) return `${months}mo ago`;
  return `${differenceInCalendarYears(now, date)}y ago`;
}

/** A glance at the home record from Today; each tile opens its My Home page. */
export function RecordHighlights() {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const { completions, loaded } = useRecordData();
  const equipment = useEquipmentIndex({ refreshOnFocus: false });
  const { format: formatMoney } = useCurrency();
  const history = usePlusFeature("history");
  const { openRecord, goToTab } = useAppNavigation();

  const lastJob = useMemo(() => {
    let latest: { title: string; at: Date } | null = null;
    for (const task of completions) {
      if (!task.completed_at) continue;
      const at = new Date(task.completed_at);
      if (Number.isNaN(at.getTime())) continue;
      if (!latest || at > latest.at) latest = { title: task.title, at };
    }
    return latest;
  }, [completions]);

  const yearSpend = useMemo(() => {
    const ledger = computeSpendLedger(completions);
    return spendForYear(ledger, new Date().getFullYear())?.total ?? 0;
  }, [completions]);

  const emergency = countFilledEmergencySpots(
    profile?.home_emergency,
    profile?.home_systems
  );

  const openLocked = async (run: () => void) => {
    if (history.locked && !(await history.unlock())) return;
    run();
  };

  return (
    <View style={styles.wrap}>
      <SectionHeader
        title="My Home"
        actionLabel="Open"
        onAction={() => goToTab("RecordTab")}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={styles.scroller}
      >
        <StatTile
          icon="checkmark-done-outline"
          tint={colors.secondary}
          value={!loaded ? "—" : lastJob ? shortAgo(lastJob.at) : "None yet"}
          label={lastJob && !history.locked ? lastJob.title : "Last job"}
          locked={history.locked}
          onPress={() => void openLocked(() => openRecord("CompletionHistory"))}
        />
        <StatTile
          icon="wallet-outline"
          tint={colors.primary}
          value={loaded ? formatMoney(yearSpend, { whole: true }) : "—"}
          label={`Spent in ${new Date().getFullYear()}`}
          locked={history.locked}
          onPress={() => void openLocked(() => openRecord("SpendLedger"))}
        />
        <StatTile
          icon="medkit-outline"
          tint={colors.error}
          value={
            emergency.total > 0 ? `${emergency.filled}/${emergency.total}` : "—"
          }
          label="Emergency info"
          onPress={() => openRecord("EmergencyInfo")}
        />
        <StatTile
          icon="hardware-chip-outline"
          tint={colors.warning}
          value={String(equipment.items.length)}
          label={equipment.items.length === 1 ? "Appliance" : "Appliances"}
          onPress={() => openRecord("EquipmentList")}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: DesignSystem.spacing.sm + 2,
  },
  scroller: {
    marginHorizontal: -DesignSystem.spacing.lg,
    overflow: "visible",
  },
  row: {
    gap: DesignSystem.spacing.sm + 2,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: 4,
  },
});
