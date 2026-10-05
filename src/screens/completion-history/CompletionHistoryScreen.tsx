import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RecordStackParamList } from "../../navigation/types";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import {
  useUserPreferences,
  resolveGradientPreset,
} from "../../context/UserPreferencesContext";
import { useQuickActions } from "../../context/QuickActionsContext";
import {
  completerDisplayName,
  completerInitial,
} from "../../utils/completerLabel";
import { TasksLoadErrorBanner } from "../../components/Dashboard/TasksLoadErrorBanner";
import { useHaptics } from "../../hooks";
import { usePlusFeature } from "../../lib/plusFeatures";
import { LockedPreview } from "../../components/plus/LockedPreview";
import { useRecordData } from "../../hooks/useRecordData";
import { useCurrency } from "../../hooks/useCurrency";
import { useSignedPhotoUrls } from "../../hooks/useSignedPhotoUrls";
import {
  HeaderIconButton,
  HearthSurfaceCard,
  SegmentedControl,
  SegmentOption,
  TintedGlassAvatar,
} from "../../components/ui";
import { RecordThumb } from "../../components/record/RecordThumb";
import { PhotoViewerModal } from "../../components/record/PhotoViewerModal";
import { RecordEntrySheet } from "../../components/record/RecordEntrySheet";
import { useRecordEntryActions } from "../../components/record/useRecordEntryActions";
import { completionHistoryStyles } from "./styles";
import { DesignSystem } from "../../theme/designSystem";
import { HOME_MAINTENANCE_CATEGORIES } from "../../types/maintenance";
import type { MaintenanceTask } from "../../types/maintenance";
import {
  HistoryLookback,
  filterCompletionsByLookback,
  filterCompletionsByQuery,
  formatCompletionTime,
  groupCompletionsByDay,
  getCompletionHistoryStatus,
  completionHistoryStatusMeta,
  COMPLETION_HISTORY_LEGEND,
  formatDate,
} from "./utils";

type LookbackKey = "30" | "90" | "all";

const LOOKBACK_OPTIONS: SegmentOption<LookbackKey>[] = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "all", label: "All time" },
];

const LOOKBACK_VALUE: Record<LookbackKey, HistoryLookback> = {
  "30": 30,
  "90": 90,
  all: "all",
};

function categoryLabel(category: MaintenanceTask["category"]): string {
  return (
    HOME_MAINTENANCE_CATEGORIES[
      category as keyof typeof HOME_MAINTENANCE_CATEGORIES
    ]?.displayName ?? category
  );
}

/** Free accounts see this many recent jobs; the rest sit under a locked preview. */
const FREE_HISTORY_ROWS = 3;

export function CompletionHistoryScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { profile, avatarUrl } = useProfile();
  const { selectedGradient } = useUserPreferences();
  const { openLogRepair } = useQuickActions();
  const { triggerLight } = useHaptics();
  const { format: formatMoney } = useCurrency();
  const navigation =
    useNavigation<NativeStackNavigationProp<RecordStackParamList>>();
  const { completions, loaded, error, refresh } = useRecordData();
  const actionFor = useRecordEntryActions();
  const { locked } = usePlusFeature("history");

  const [lookback, setLookback] = useState<LookbackKey>("all");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<MaintenanceTask | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [viewer, setViewer] = useState<MaintenanceTask | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <HeaderIconButton
            icon="document-text-outline"
            onPress={() => navigation.navigate("HomeSummaryPreview")}
            accessibilityLabel="Home history PDF"
          />
          <HeaderIconButton
            icon="add"
            onPress={() => openLogRepair()}
            accessibilityLabel="Log a repair"
          />
        </View>
      ),
      headerSearchBarOptions: {
        placeholder: "Search jobs, notes, pros",
        hideWhenScrolling: true,
        tintColor: colors.primary,
        onChangeText: (event) => setQuery(event.nativeEvent.text),
        onCancelButtonPress: () => setQuery(""),
      },
    });
  }, [colors.primary, navigation, openLogRepair]);

  const filteredTasks = useMemo(
    () =>
      filterCompletionsByQuery(
        filterCompletionsByLookback(completions, LOOKBACK_VALUE[lookback]),
        query
      ),
    [completions, lookback, query]
  );

  const visibleTasks = useMemo(
    () => (locked ? filteredTasks.slice(0, FREE_HISTORY_ROWS) : filteredTasks),
    [filteredTasks, locked]
  );
  const sections = useMemo(
    () => groupCompletionsByDay(visibleTasks),
    [visibleTasks]
  );
  const lockedSections = useMemo(
    () =>
      locked
        ? groupCompletionsByDay(
            filteredTasks.slice(FREE_HISTORY_ROWS, FREE_HISTORY_ROWS + 6)
          )
        : [],
    [filteredTasks, locked]
  );

  const photoUrls = useSignedPhotoUrls(
    useMemo(
      () => visibleTasks.map((task) => task.photo_storage_path),
      [visibleTasks]
    )
  );

  const rangeSpend = useMemo(
    () =>
      filteredTasks.reduce(
        (sum, task) =>
          sum +
          (typeof task.cost_amount === "number" && task.cost_amount > 0
            ? task.cost_amount
            : 0),
        0
      ),
    [filteredTasks]
  );

  const hasRepairs = useMemo(
    () => filteredTasks.some((t) => getCompletionHistoryStatus(t) === "repair"),
    [filteredTasks]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const openEntry = (task: MaintenanceTask) => {
    triggerLight();
    setSelected(task);
    setSheetVisible(true);
  };

  const renderRow = (task: MaintenanceTask, isLast: boolean) => {
    const timeLabel = formatCompletionTime(task.completed_at || task.due_date);
    const statusMeta = completionHistoryStatusMeta(
      getCompletionHistoryStatus(task)
    );
    const statusColor = colors[statusMeta.colorKey];
    const who = completerDisplayName({
      completedBy: task.completed_by,
      completedByName: task.completed_by_name,
      currentUserId: user?.id,
    });
    const isSelf = Boolean(user?.id && task.completed_by === user.id);
    const selfName =
      (typeof user?.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null) ||
      profile?.full_name ||
      user?.email ||
      "You";
    const avatarGradient = isSelf
      ? selectedGradient
      : resolveGradientPreset(task.completed_by_avatar_style);
    const avatarInitial = completerInitial(
      isSelf ? selfName : task.completed_by_name || who
    );
    const meta = `${statusMeta.label} · ${categoryLabel(task.category)} · ${timeLabel}`;
    const notes = task.notes?.trim();
    const cost =
      typeof task.cost_amount === "number" && task.cost_amount > 0
        ? formatMoney(task.cost_amount)
        : null;
    const labor =
      task.labor_type === "diy"
        ? "DIY"
        : task.labor_type === "hired"
          ? "Hired"
          : null;
    const pro = task.contact?.name ?? null;
    const photoPath = task.photo_storage_path;

    return (
      <Pressable
        key={task.instance_id}
        onPress={() => openEntry(task)}
        style={({ pressed }) => [
          completionHistoryStyles.row,
          !isLast && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          },
          pressed && { backgroundColor: colors.fieldFill },
        ]}
        accessibilityRole="button"
        accessibilityHint="Opens details"
        accessibilityLabel={[task.title, meta, cost, labor, pro, who]
          .filter(Boolean)
          .join(". ")}
      >
        <View
          style={[
            completionHistoryStyles.rowIcon,
            { backgroundColor: statusColor + "22" },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons name={statusMeta.icon} size={18} color={statusColor} />
        </View>
        <View style={completionHistoryStyles.rowMain}>
          <Text
            style={[completionHistoryStyles.rowTitle, { color: colors.text }]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          <Text
            style={[
              completionHistoryStyles.rowMeta,
              { color: colors.textSecondary },
            ]}
          >
            {meta}
          </Text>
          {cost || labor || pro ? (
            <View style={completionHistoryStyles.chipLine}>
              {cost ? <Chip icon="wallet-outline" label={cost} strong /> : null}
              {labor ? (
                <Chip
                  icon={
                    task.labor_type === "hired"
                      ? "briefcase-outline"
                      : "hand-left-outline"
                  }
                  label={labor}
                />
              ) : null}
              {pro ? <Chip icon="person-outline" label={pro} /> : null}
            </View>
          ) : null}
          {who ? (
            <View style={completionHistoryStyles.rowBy}>
              <TintedGlassAvatar
                size={20}
                gradient={avatarGradient}
                initial={avatarInitial}
                imageUri={
                  isSelf
                    ? (avatarUrl ?? task.completed_by_avatar_url)
                    : task.completed_by_avatar_url
                }
                pressable={false}
                accessibilityLabel={who}
              />
              <Text
                style={[
                  completionHistoryStyles.rowByName,
                  { color: colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {who}
              </Text>
            </View>
          ) : null}
          {notes ? (
            <Text
              style={[
                completionHistoryStyles.rowNotes,
                { color: colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {notes}
            </Text>
          ) : null}
        </View>
        {photoPath ? (
          <RecordThumb
            uri={photoUrls[photoPath]}
            onPress={() => {
              triggerLight();
              setViewer(task);
            }}
            accessibilityLabel={`Photo of ${task.title}`}
          />
        ) : null}
      </Pressable>
    );
  };

  const renderSection = ({
    item: section,
    index,
  }: {
    item: ReturnType<typeof groupCompletionsByDay>[number];
    index: number;
  }) => (
    <View>
      <Text
        style={[
          completionHistoryStyles.sectionHeader,
          {
            color: colors.textSecondary,
            marginTop: index === 0 ? 0 : undefined,
          },
        ]}
        accessibilityRole="header"
      >
        {section.title}
      </Text>
      <HearthSurfaceCard
        containerStyle={completionHistoryStyles.cardContainer}
        style={completionHistoryStyles.cardSurface}
      >
        {section.data.map((task, rowIndex) =>
          renderRow(task, rowIndex === section.data.length - 1)
        )}
      </HearthSurfaceCard>
    </View>
  );

  const countLabel = `${filteredTasks.length} job${filteredTasks.length === 1 ? "" : "s"}`;

  const listHeader = (
    <View style={completionHistoryStyles.listHeader}>
      <SegmentedControl
        options={LOOKBACK_OPTIONS}
        value={lookback}
        onChange={setLookback}
        accessibilityLabel="Date range"
        style={completionHistoryStyles.segmented}
      />
      {loaded && filteredTasks.length > 0 ? (
        <Text
          style={[
            completionHistoryStyles.subtitle,
            { color: colors.textSecondary },
          ]}
        >
          {rangeSpend > 0 && !locked
            ? `${countLabel} · ${formatMoney(rangeSpend)} spent`
            : countLabel}
        </Text>
      ) : null}
      {filteredTasks.length > 0 ? (
        <View style={completionHistoryStyles.legendRow}>
          {COMPLETION_HISTORY_LEGEND.filter(
            (item) => item.status !== "repair" || hasRepairs
          ).map((item) => (
            <View key={item.status} style={completionHistoryStyles.legendItem}>
              <Ionicons
                name={item.icon}
                size={14}
                color={colors[item.colorKey]}
              />
              <Text
                style={[
                  completionHistoryStyles.legendText,
                  { color: colors.textSecondary },
                ]}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );

  const renderEmpty = () => {
    if (!loaded) {
      return (
        <View style={completionHistoryStyles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              completionHistoryStyles.loadingText,
              { color: colors.textSecondary },
            ]}
          >
            Loading history…
          </Text>
        </View>
      );
    }

    const searching = query.trim().length > 0;
    return (
      <View style={completionHistoryStyles.emptyState}>
        <View
          style={[
            completionHistoryStyles.emptyIconCircle,
            { backgroundColor: colors.primary + "14" },
          ]}
        >
          <Ionicons
            name={searching ? "search-outline" : "checkmark-circle-outline"}
            size={32}
            color={colors.primary}
          />
        </View>
        <Text
          style={[completionHistoryStyles.emptyTitle, { color: colors.text }]}
        >
          {searching
            ? "No matches"
            : lookback === "all"
              ? "No jobs recorded yet"
              : "Nothing in this range"}
        </Text>
        <Text
          style={[
            completionHistoryStyles.emptySubtext,
            { color: colors.textSecondary },
          ]}
        >
          {searching
            ? `Nothing matches “${query.trim()}”.`
            : lookback === "all"
              ? "Finished tasks and repairs show up here, with costs, notes, and photos."
              : "Try a wider date range."}
        </Text>
        {!searching && lookback === "all" ? (
          <Pressable
            onPress={() => openLogRepair()}
            style={[
              completionHistoryStyles.emptyAction,
              { backgroundColor: colors.primary + "14" },
            ]}
            accessibilityRole="button"
          >
            <Ionicons name="hammer-outline" size={16} color={colors.primary} />
            <Text
              style={[
                completionHistoryStyles.emptyActionText,
                { color: colors.primary },
              ]}
            >
              Log a repair
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  return (
    <View
      style={[
        completionHistoryStyles.list,
        { backgroundColor: colors.background },
      ]}
    >
      <FlatList
        style={completionHistoryStyles.list}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        data={sections}
        keyExtractor={(item) => item.key}
        renderItem={renderSection}
        ListHeaderComponent={
          <>
            {error ? (
              <TasksLoadErrorBanner message={error} onRetry={refresh} />
            ) : null}
            {listHeader}
          </>
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          lockedSections.length > 0 ? (
            <LockedPreview feature="history" style={styles.lockedPreview}>
              {lockedSections.map((section, index) => (
                <React.Fragment key={section.key}>
                  {renderSection({ item: section, index: index + 1 })}
                </React.Fragment>
              ))}
            </LockedPreview>
          ) : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          completionHistoryStyles.listContent,
          { paddingBottom: DesignSystem.spacing.xxl },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      <RecordEntrySheet
        task={selected}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onDismissed={() => setSelected(null)}
        action={selected ? actionFor(selected) : null}
      />

      <PhotoViewerModal
        visible={viewer !== null}
        uri={
          viewer?.photo_storage_path
            ? (photoUrls[viewer.photo_storage_path] ?? null)
            : null
        }
        title={viewer?.title}
        subtitle={
          viewer
            ? formatDate(viewer.completed_at || viewer.due_date)
            : undefined
        }
        onClose={() => setViewer(null)}
      />
    </View>
  );
}

function Chip({
  icon,
  label,
  strong,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  strong?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        completionHistoryStyles.chip,
        { backgroundColor: strong ? colors.primary + "14" : colors.fieldFill },
      ]}
    >
      <Ionicons
        name={icon}
        size={12}
        color={strong ? colors.primary : colors.textSecondary}
      />
      <Text
        style={[
          completionHistoryStyles.chipText,
          { color: strong ? colors.primary : colors.textSecondary },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lockedPreview: {
    marginTop: DesignSystem.spacing.md,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
});
