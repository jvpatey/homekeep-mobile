import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";
import { MaintenanceRoutine } from "../../types/maintenance";
import { AllReminderRow } from "./AllReminderRow";
import { AllRemindersSectionHeader } from "./AllRemindersSectionHeader";
import {
  ReminderSection,
  ReminderSectionKey,
  defaultCollapsedKeys,
  groupRoutinesIntoSections,
} from "./groupRoutines";

interface AllRemindersListProps {
  routines: MaintenanceRoutine[];
  deletingIds: Set<string>;
  resumingIds: Set<string>;
  onResume: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  contentPaddingBottom?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Compact top summary for sheet/modal layouts. */
  showSummary?: boolean;
}

export function AllRemindersList({
  routines,
  deletingIds,
  resumingIds,
  onResume,
  onDelete,
  contentPaddingBottom = DesignSystem.spacing.xxl,
  refreshing = false,
  onRefresh,
  showSummary = true,
}: AllRemindersListProps) {
  const { colors } = useTheme();
  const sections = useMemo(
    () => groupRoutinesIntoSections(routines),
    [routines]
  );

  const [collapsed, setCollapsed] = useState<Set<ReminderSectionKey>>(
    () => new Set()
  );
  const knownKeysRef = React.useRef<Set<ReminderSectionKey>>(new Set());

  // All sections start collapsed; newly appearing sections start collapsed too.
  useEffect(() => {
    const keys = sections.map((s) => s.key);
    if (keys.length === 0) return;

    setCollapsed((prev) => {
      const known = knownKeysRef.current;
      const next = new Set<ReminderSectionKey>();

      if (known.size === 0) {
        knownKeysRef.current = new Set(keys);
        return defaultCollapsedKeys(sections);
      }

      for (const key of keys) {
        if (!known.has(key) || prev.has(key)) {
          next.add(key);
        }
      }

      knownKeysRef.current = new Set(keys);
      return next;
    });
  }, [sections]);

  const visibleSections = useMemo(
    () =>
      sections.map((section) => ({
        ...section,
        data: collapsed.has(section.key) ? [] : section.data,
      })),
    [sections, collapsed]
  );

  const toggleSection = useCallback((key: ReminderSectionKey) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const activeCount = routines.filter((r) => r.is_active).length;
  const pausedCount = routines.length - activeCount;

  const renderHeader = () => {
    if (!showSummary || routines.length === 0) return null;
    return (
      <View style={styles.summaryWrap}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>
          Your reminders
        </Text>
        <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>
          {activeCount} active
          {pausedCount > 0 ? ` · ${pausedCount} paused` : ""}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <View
        style={[styles.emptyIcon, { backgroundColor: `${colors.primary}15` }]}
      >
        <Ionicons name="list-outline" size={28} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No reminders yet
      </Text>
      <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
        Add a task from the dashboard or apply a plan from the task library.
      </Text>
    </View>
  );

  return (
    <SectionList<MaintenanceRoutine, ReminderSection>
      sections={visibleSections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.listContent,
        routines.length === 0 && styles.listContentEmpty,
        { paddingBottom: contentPaddingBottom },
      ]}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
      renderSectionHeader={({ section }) => {
        const full = sections.find((s) => s.key === section.key) ?? section;
        return (
          <AllRemindersSectionHeader
            section={full}
            collapsed={collapsed.has(section.key)}
            onToggle={() => toggleSection(section.key)}
          />
        );
      }}
      renderItem={({ item, section }) => (
        <AllReminderRow
          item={item}
          accent={section.accent}
          isDeleting={deletingIds.has(item.id)}
          isResuming={resumingIds.has(item.id)}
          onResume={onResume}
          onDelete={onDelete}
        />
      )}
      SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingTop: DesignSystem.spacing.sm,
  },
  listContentEmpty: {
    justifyContent: "center",
  },
  summaryWrap: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
    gap: 4,
  },
  summaryTitle: {
    ...DesignSystem.typography.title2,
  },
  summaryMeta: {
    ...DesignSystem.typography.footnote,
  },
  sectionGap: {
    height: DesignSystem.spacing.sm,
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.xxxl,
    gap: DesignSystem.spacing.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.sm,
  },
  emptyTitle: {
    ...DesignSystem.typography.h3,
    textAlign: "center",
  },
  emptyBody: {
    ...DesignSystem.typography.footnote,
    textAlign: "center",
    lineHeight: 20,
  },
});
