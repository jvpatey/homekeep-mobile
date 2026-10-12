import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useQuickActions } from "../../context/QuickActionsContext";
import { useRecordData } from "../../hooks/useRecordData";
import { useCurrency } from "../../hooks/useCurrency";
import { useSignedPhotoUrls } from "../../hooks/useSignedPhotoUrls";
import { useHaptics } from "../../hooks";
import { useOverlayInsets } from "../../hooks/useOverlayInsets";
import {
  EmptyState,
  HeaderIconButton,
  HearthSurfaceCard,
  IconChip,
  Pill,
  SectionHeader,
  StatTile,
} from "../../components/ui";
import { getLuminance } from "../../theme/contrast";
import { RecordThumb } from "../../components/record/RecordThumb";
import { LockedPreview } from "../../components/plus/LockedPreview";
import { RecordEntrySheet } from "../../components/record/RecordEntrySheet";
import { useRecordEntryActions } from "../../components/record/useRecordEntryActions";
import { BudgetVsActualCard } from "../../components/record/BudgetVsActualCard";
import { MaintenanceService } from "../../services/maintenanceService";
import {
  HOME_MAINTENANCE_CATEGORIES,
  MaintenanceCategory,
  MaintenanceRoutine,
  MaintenanceTask,
} from "../../types/maintenance";
import {
  SpendEntry,
  SpendYear,
  computeSpendLedger,
  spendForYear,
} from "../../utils/spendLedger";
import { RecordStackParamList } from "../../navigation/types";
import { DesignSystem } from "../../theme/designSystem";

type YearKey = number | "all";

function categoryInfo(category: MaintenanceCategory) {
  const meta =
    HOME_MAINTENANCE_CATEGORIES[
      category as keyof typeof HOME_MAINTENANCE_CATEGORIES
    ];
  return {
    label: meta?.displayName ?? category,
    color: meta?.color ?? "#C7CEEA",
    icon: (meta?.icon ?? "construct-outline") as keyof typeof Ionicons.glyphMap,
  };
}

function emptyYear(year: number): SpendYear {
  return {
    year,
    total: 0,
    count: 0,
    diyTotal: 0,
    hiredTotal: 0,
    otherTotal: 0,
    repairTotal: 0,
    byCategory: [],
    entries: [],
  };
}

function groupByMonth(entries: SpendEntry[]) {
  const groups: {
    key: string;
    title: string;
    total: number;
    entries: SpendEntry[];
  }[] = [];
  for (const entry of entries) {
    const key = format(entry.date, "yyyy-MM");
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = {
        key,
        title: format(entry.date, "MMMM yyyy"),
        total: 0,
        entries: [],
      };
      groups.push(group);
    }
    group.total += entry.amount;
    group.entries.push(entry);
  }
  return groups;
}

export function SpendLedgerScreen() {
  const { colors } = useTheme();
  const overlay = useOverlayInsets();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RecordStackParamList, "SpendLedger">
    >();
  const route = useRoute<RouteProp<RecordStackParamList, "SpendLedger">>();
  const { openLogRepair } = useQuickActions();
  const { triggerLight } = useHaptics();
  const { format: formatMoney } = useCurrency();
  const { completions, loaded, refresh } = useRecordData();
  const actionFor = useRecordEntryActions();

  const currentYear = new Date().getFullYear();
  const [yearKey, setYearKey] = useState<YearKey>(
    route.params?.year ?? currentYear
  );
  const [category, setCategory] = useState<MaintenanceCategory | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<MaintenanceTask | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [routines, setRoutines] = useState<MaintenanceRoutine[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderIconButton
          icon="add"
          onPress={() => openLogRepair()}
          accessibilityLabel="Log a repair"
        />
      ),
    });
  }, [navigation, openLogRepair]);

  const ledger = useMemo(() => computeSpendLedger(completions), [completions]);
  const yearData =
    yearKey === "all"
      ? ledger.allTime
      : (spendForYear(ledger, yearKey) ?? emptyYear(yearKey));
  const previous = yearKey === "all" ? null : spendForYear(ledger, yearKey - 1);

  const entries = useMemo(
    () =>
      category
        ? yearData.entries.filter((entry) => entry.category === category)
        : yearData.entries,
    [category, yearData]
  );
  const months = useMemo(() => groupByMonth(entries), [entries]);
  const photoUrls = useSignedPhotoUrls(
    useMemo(() => entries.map((e) => e.photoPath), [entries])
  );

  const yearOptions: YearKey[] = useMemo(() => {
    const years: YearKey[] = ledger.years.map((y) => y.year);
    return ledger.years.length > 1 ? [...years, "all"] : years;
  }, [ledger.years]);

  const loadRoutines = useCallback(async () => {
    const { data } = await MaintenanceService.getMaintenanceRoutines({
      is_active: true,
    });
    if (data) setRoutines(data);
  }, []);

  useEffect(() => {
    void loadRoutines();
  }, [loadRoutines]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), loadRoutines()]);
    setRefreshing(false);
  };

  const chooseYear = (key: YearKey) => {
    if (key === yearKey) return;
    triggerLight();
    setYearKey(key);
    setCategory(null);
  };

  const toggleCategory = (next: MaintenanceCategory) => {
    triggerLight();
    setCategory((prev) => (prev === next ? null : next));
  };

  const openEntry = (entry: SpendEntry) => {
    triggerLight();
    setSelected(entry.task);
    setSheetVisible(true);
  };

  const periodLabel = yearKey === "all" ? "all time" : String(yearKey);
  const heroTotalLabel = formatMoney(yearData.total, {
    whole: yearData.total >= 1000,
  });
  const delta =
    previous && previous.total > 0 && yearKey !== "all"
      ? yearData.total - previous.total
      : null;
  const deltaPct =
    delta !== null && previous
      ? Math.round((delta / previous.total) * 100)
      : null;
  const laborKnown = yearData.diyTotal + yearData.hiredTotal;
  const diyCount = yearData.entries.filter((e) => e.laborType === "diy").length;
  const hiredCount = yearData.entries.filter(
    (e) => e.laborType === "hired"
  ).length;
  const repairCount = yearData.entries.filter((e) => e.isRepair).length;

  if (!loaded) {
    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: colors.background,
            paddingTop: overlay.top,
            paddingBottom: overlay.bottom,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {!ledger.hasAnyCost ? (
          <EmptyState
            inCard
            icon="wallet-outline"
            title="Start your spend ledger"
            body="Log a repair you paid for, or add a cost when you mark a task complete. HomeKeep totals it by year and category."
            primaryAction={{
              label: "Log a repair",
              onPress: () => openLogRepair(),
            }}
            style={styles.emptyCard}
          />
        ) : (
          <>
            {yearOptions.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.yearRow}
                style={styles.yearScroller}
              >
                {yearOptions.map((key) => (
                  <Pill
                    key={String(key)}
                    label={key === "all" ? "All time" : String(key)}
                    size="medium"
                    selected={key === yearKey}
                    onPress={() => chooseYear(key)}
                  />
                ))}
              </ScrollView>
            ) : null}

            <LockedPreview feature="ledger">
              <>
                <HearthSurfaceCard
                  emphasis="hero"
                  style={styles.hero}
                  containerStyle={styles.section}
                >
                  <Text
                    style={[styles.heroLabel, { color: colors.textSecondary }]}
                  >
                    {yearKey === "all"
                      ? "Spent all time"
                      : `Spent in ${yearKey}`}
                  </Text>
                  <Text
                    style={[
                      styles.heroTotal,
                      { color: colors.text },
                      heroTotalLabel.length >= 12
                        ? styles.heroTotalSmall
                        : heroTotalLabel.length >= 9 && styles.heroTotalMedium,
                    ]}
                    numberOfLines={1}
                    accessibilityLabel={`${formatMoney(yearData.total)} spent in ${periodLabel}`}
                  >
                    {heroTotalLabel}
                  </Text>
                  {delta !== null && deltaPct !== null && previous ? (
                    <Pill
                      icon={delta >= 0 ? "arrow-up" : "arrow-down"}
                      label={`${Math.abs(deltaPct)}% vs ${previous.year}`}
                      accessibilityLabel={`${delta >= 0 ? "Up" : "Down"} ${Math.abs(deltaPct)} percent from ${previous.year}`}
                      style={styles.deltaPill}
                    />
                  ) : null}
                  <View style={styles.heroStats}>
                    <StatTile
                      icon="receipt-outline"
                      tint={colors.primary}
                      value={String(yearData.count)}
                      label={
                        yearData.count === 1 ? "job with costs" : "jobs with costs"
                      }
                      style={styles.heroStat}
                    />
                    <StatTile
                      icon="hammer-outline"
                      tint={colors.secondary}
                      value={String(repairCount)}
                      label={repairCount === 1 ? "repair" : "repairs"}
                      style={styles.heroStat}
                    />
                  </View>
                </HearthSurfaceCard>

                {yearKey !== "all" ? (
                  <BudgetVsActualCard year={yearData} routines={routines} />
                ) : null}

                {yearData.count === 0 ? (
                  <Text
                    style={[styles.noYear, { color: colors.textSecondary }]}
                  >
                    No costs recorded in {periodLabel} yet.
                  </Text>
                ) : (
                  <>
                    <View style={styles.section}>
                      <SectionHeader title="By category" />
                      <HearthSurfaceCard>
                        <View
                          style={[
                            styles.bar,
                            { backgroundColor: colors.fieldFill },
                          ]}
                          accessibilityElementsHidden
                          importantForAccessibility="no-hide-descendants"
                        >
                          {yearData.byCategory.map((row) => (
                            <View
                              key={row.category}
                              style={{
                                flex: Math.max(row.share, 0.015),
                                backgroundColor: categoryInfo(row.category).color,
                                opacity:
                                  category && category !== row.category
                                    ? 0.25
                                    : 1,
                              }}
                            />
                          ))}
                        </View>
                        {yearData.byCategory.map((row, index) => {
                          const info = categoryInfo(row.category);
                          const active = category === row.category;
                          return (
                            <Pressable
                              key={row.category}
                              onPress={() => toggleCategory(row.category)}
                              style={({ pressed }) => [
                                styles.catRow,
                                index > 0 && {
                                  borderTopWidth: StyleSheet.hairlineWidth,
                                  borderTopColor: colors.border,
                                },
                                (pressed || active) && {
                                  backgroundColor: colors.fieldFill,
                                },
                              ]}
                              accessibilityRole="button"
                              accessibilityState={{ selected: active }}
                              accessibilityLabel={`${info.label}, ${formatMoney(row.total)}, ${Math.round(row.share * 100)} percent, ${row.count} jobs`}
                              accessibilityHint={
                                active
                                  ? "Shows all categories"
                                  : "Filters the list below"
                              }
                            >
                              <View
                                style={[
                                  styles.catDot,
                                  { backgroundColor: info.color },
                                ]}
                              />
                              <View style={styles.catText}>
                                <Text
                                  style={[
                                    styles.catLabel,
                                    { color: colors.text },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {info.label}
                                </Text>
                                <Text
                                  style={[
                                    styles.catMeta,
                                    { color: colors.textSecondary },
                                  ]}
                                >
                                  {row.count} job{row.count === 1 ? "" : "s"} ·{" "}
                                  {Math.round(row.share * 100)}%
                                </Text>
                              </View>
                              <Text
                                style={[
                                  styles.catAmount,
                                  { color: colors.text },
                                ]}
                              >
                                {formatMoney(row.total)}
                              </Text>
                              {active ? (
                                <Ionicons
                                  name="close-circle"
                                  size={18}
                                  color={colors.textSecondary}
                                />
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </HearthSurfaceCard>
                    </View>

                    {laborKnown > 0 ? (
                      <View style={styles.section}>
                        <SectionHeader title="Who did the work" />
                        <HearthSurfaceCard>
                          <View
                            style={[
                              styles.bar,
                              { backgroundColor: colors.fieldFill },
                            ]}
                          >
                            <View
                              style={{
                                flex: Math.max(yearData.diyTotal, 0.0001),
                                backgroundColor: colors.success,
                              }}
                            />
                            <View
                              style={{
                                flex: Math.max(yearData.hiredTotal, 0.0001),
                                backgroundColor: colors.primary,
                              }}
                            />
                          </View>
                          <View style={styles.splitRow}>
                            <SplitTile
                              color={colors.success}
                              label="Did it myself"
                              amount={formatMoney(yearData.diyTotal)}
                              count={diyCount}
                            />
                            <SplitTile
                              color={colors.primary}
                              label="Hired a pro"
                              amount={formatMoney(yearData.hiredTotal)}
                              count={hiredCount}
                            />
                          </View>
                          {yearData.otherTotal > 0 ? (
                            <Text
                              style={[
                                styles.splitFootnote,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {formatMoney(yearData.otherTotal)} without a
                              who-did-it choice.
                            </Text>
                          ) : null}
                        </HearthSurfaceCard>
                      </View>
                    ) : null}

                    <SectionHeader
                      title={
                        category
                          ? `${categoryInfo(category).label} jobs`
                          : "Jobs"
                      }
                      actionLabel={category ? "Show all" : undefined}
                      onAction={() => setCategory(null)}
                    />

                    {months.map((month) => (
                      <View key={month.key} style={styles.month}>
                        <View style={styles.monthHeader}>
                          <Text
                            style={[
                              styles.monthTitle,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {month.title}
                          </Text>
                          <Text
                            style={[
                              styles.monthTotal,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {formatMoney(month.total)}
                          </Text>
                        </View>
                        <HearthSurfaceCard>
                          {month.entries.map((entry, index) => (
                            <EntryRow
                              key={entry.instanceId}
                              entry={entry}
                              photoUri={
                                entry.photoPath
                                  ? photoUrls[entry.photoPath]
                                  : null
                              }
                              amount={formatMoney(entry.amount)}
                              showDivider={index > 0}
                              onPress={() => openEntry(entry)}
                            />
                          ))}
                        </HearthSurfaceCard>
                      </View>
                    ))}
                  </>
                )}
              </>
            </LockedPreview>
          </>
        )}
      </ScrollView>

      <RecordEntrySheet
        task={selected}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onDismissed={() => setSelected(null)}
        action={selected ? actionFor(selected) : null}
      />
    </>
  );
}

function SplitTile({
  color,
  label,
  amount,
  count,
}: {
  color: string;
  label: string;
  amount: string;
  count: number;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={styles.splitTile}
      accessible
      accessibilityLabel={`${label}: ${amount}, ${count} jobs`}
    >
      <View style={styles.splitLabelRow}>
        <View style={[styles.catDot, { backgroundColor: color }]} />
        <Text style={[styles.splitLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles.splitAmount,
          { color: colors.text },
          amount.length >= 10
            ? styles.splitAmountSmall
            : amount.length >= 8 && styles.splitAmountMedium,
        ]}
        numberOfLines={1}
      >
        {amount}
      </Text>
      <Text style={[styles.catMeta, { color: colors.textSecondary }]}>
        {count} job{count === 1 ? "" : "s"}
      </Text>
    </View>
  );
}

function EntryRow({
  entry,
  photoUri,
  amount,
  showDivider,
  onPress,
}: {
  entry: SpendEntry;
  photoUri: string | null | undefined;
  amount: string;
  showDivider: boolean;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const info = categoryInfo(entry.category);
  const who =
    entry.contactName ??
    (entry.laborType === "hired"
      ? "Hired"
      : entry.laborType === "diy"
        ? "DIY"
        : null);
  const subtitle = [format(entry.date, "MMM d"), who]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.entryRow,
        showDivider && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        pressed && { backgroundColor: colors.fieldFill },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${entry.title}, ${amount}, ${subtitle}${entry.isRepair ? ", repair" : ""}`}
    >
      {entry.photoPath ? (
        <RecordThumb uri={photoUri} size={40} />
      ) : (
        <IconChip
          icon={entry.isRepair ? "hammer-outline" : info.icon}
          tint={info.color}
          size={40}
          shape="rounded"
          glyphColor={
            !isDark && getLuminance(info.color) > 0.6 ? colors.text : undefined
          }
        />
      )}
      <View style={styles.entryText}>
        <Text
          style={[styles.entryTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {entry.title}
        </Text>
        <View style={styles.entrySubRow}>
          {entry.isRepair ? (
            <Pill label="Repair" tone="primary" />
          ) : null}
          <Text
            style={[styles.entrySubtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
      </View>
      <Text style={[styles.entryAmount, { color: colors.text }]}>{amount}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.xxl,
  },
  yearScroller: {
    marginHorizontal: -DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.md,
  },
  yearRow: {
    paddingHorizontal: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.sm,
  },
  section: {
    marginBottom: DesignSystem.spacing.lg,
  },
  hero: {
    padding: DesignSystem.spacing.lg - 4,
  },
  heroLabel: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
  },
  heroTotal: {
    fontFamily: DesignSystem.fonts.display,
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: -1.2,
    marginTop: DesignSystem.spacing.xs,
    fontVariant: ["tabular-nums"],
  },
  // Amounts are sized by length rather than adjustsFontSizeToFit, which iOS
  // can collapse to a sliver when the value changes after first layout.
  heroTotalMedium: {
    fontSize: 36,
    lineHeight: 44,
  },
  heroTotalSmall: {
    fontSize: 30,
    lineHeight: 38,
  },
  deltaPill: {
    marginTop: DesignSystem.spacing.xs,
  },
  heroStats: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm + 4,
    marginTop: DesignSystem.spacing.md,
  },
  heroStat: {
    flex: 1,
    width: undefined,
    minHeight: 0,
  },
  noYear: {
    ...DesignSystem.typography.footnote,
    textAlign: "center",
    marginTop: DesignSystem.spacing.md,
  },
  bar: {
    flexDirection: "row",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    gap: 2,
    marginHorizontal: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 2,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catText: {
    flex: 1,
    minWidth: 0,
  },
  catLabel: {
    ...DesignSystem.typography.body,
  },
  catMeta: {
    ...DesignSystem.typography.caption,
    fontVariant: ["tabular-nums"],
  },
  catAmount: {
    ...DesignSystem.typography.bodySemiBold,
    fontVariant: ["tabular-nums"],
  },
  splitRow: {
    flexDirection: "row",
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md,
  },
  splitTile: {
    flex: 1,
  },
  splitLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  splitLabel: {
    ...DesignSystem.typography.caption,
  },
  splitAmount: {
    fontFamily: DesignSystem.fonts.displaySemiBold,
    fontSize: 22,
    lineHeight: 28,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  splitAmountMedium: {
    fontSize: 18,
  },
  splitAmountSmall: {
    fontSize: 15,
  },
  splitFootnote: {
    ...DesignSystem.typography.caption,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.md,
    marginTop: -DesignSystem.spacing.xs,
  },
  month: {
    marginBottom: DesignSystem.spacing.md,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: DesignSystem.spacing.xs,
    paddingBottom: DesignSystem.spacing.sm,
  },
  monthTitle: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
  },
  monthTotal: {
    ...DesignSystem.typography.footnote,
    fontVariant: ["tabular-nums"],
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 2,
  },
  entryText: {
    flex: 1,
    minWidth: 0,
  },
  entryTitle: {
    ...DesignSystem.typography.body,
  },
  entrySubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  entrySubtitle: {
    ...DesignSystem.typography.footnote,
    flexShrink: 1,
  },
  entryAmount: {
    ...DesignSystem.typography.bodySemiBold,
    fontVariant: ["tabular-nums"],
  },
  emptyCard: {
    marginTop: DesignSystem.spacing.lg,
  },
});
