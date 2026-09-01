import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import {
  SectionList,
  RefreshControl,
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useDevice } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { MaintenanceTask } from "../../types/maintenance";
import { DashboardScheduleSection } from "./dashboardSections";
import { ScheduleTaskRow } from "./ScheduleTaskRow";
import { timelineStyles } from "./timeline-view/styles";
import {
  formatTaskSectionMonth,
  formatTaskSectionYear,
} from "../../utils/formatTaskDates";
import { Button, TextLink } from "../ui";

export interface DashboardScheduleListRef {
  scrollToSection: (key: string) => void;
}

interface DashboardScheduleListProps {
  sections: DashboardScheduleSection[];
  ListHeaderComponent: React.ComponentType<unknown> | React.ReactElement | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  onCompleteTask: (instanceId: string) => void | Promise<boolean>;
  completingInstanceIds?: Set<string>;
  onTaskPress?: (instanceId: string) => void;
  onSkipOccurrence?: (
    task: MaintenanceTask,
    closeSwipe: () => void
  ) => void | Promise<void>;
  onAddTask?: () => void;
  onBrowseMaintenancePlans?: () => void;
  onSetupHome?: () => void;
  homeSetupIncomplete?: boolean;
  contentPaddingBottom: number;
}

export const DashboardScheduleList = forwardRef<
  DashboardScheduleListRef,
  DashboardScheduleListProps
>(function DashboardScheduleList(
  {
    sections,
    ListHeaderComponent,
    onRefresh,
    refreshing = false,
    onCompleteTask,
    completingInstanceIds,
    onTaskPress,
    onSkipOccurrence,
    onAddTask,
    onBrowseMaintenancePlans,
    onSetupHome,
    homeSetupIncomplete,
    contentPaddingBottom,
  },
  ref
) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const fontMultiplier = getFontMultiplier();
  const listRef = useRef<SectionList<MaintenanceTask, DashboardScheduleSection>>(null);

  useImperativeHandle(ref, () => ({
    scrollToSection: (key: string) => {
      let targetKey = key;
      if (key === "__today__") {
        const todaySection = sections.find((s) => s.title === "Today");
        if (!todaySection) return;
        targetKey = todaySection.key;
      }
      const sectionIndex = sections.findIndex((s) => s.key === targetKey);
      if (sectionIndex < 0) return;
      listRef.current?.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: true,
        viewOffset: 0,
      });
    },
  }));

  const renderOverdueHeader = (section: DashboardScheduleSection) => (
    <View
      style={[
        scheduleStyles.stickyHeaderBase,
        {
          backgroundColor: colors.background,
          paddingHorizontal: DesignSystem.spacing.lg,
          paddingTop: DesignSystem.spacing.md,
          paddingBottom: DesignSystem.spacing.sm,
        },
      ]}
    >
      <Text style={[scheduleStyles.sectionTitle, { color: colors.error }]}>
        {section.title}
      </Text>
      {section.subtitle ? (
        <Text
          style={[scheduleStyles.sectionSubtitle, { color: colors.textSecondary }]}
        >
          {section.subtitle}
        </Text>
      ) : null}
    </View>
  );

  const renderSectionHeader = ({
    section,
  }: {
    section: DashboardScheduleSection;
  }) => {
    if (section.headerVariant === "overdue") {
      return renderOverdueHeader(section);
    }

    const date = section.date!;
    const sectionYear = formatTaskSectionYear(date);

    return (
      <View
        style={[
          scheduleStyles.stickyHeaderBase,
          {
            backgroundColor: colors.background,
            paddingTop: DesignSystem.spacing.md,
          },
        ]}
      >
        <View
          style={[
            timelineStyles.dateHeader,
            { paddingHorizontal: DesignSystem.spacing.lg },
            isTablet && {
              paddingHorizontal: getResponsiveValue(
                DesignSystem.spacing.lg,
                DesignSystem.spacing.xl,
                DesignSystem.spacing.xl
              ),
            },
          ]}
        >
          <View
            style={[
              timelineStyles.dateIndicator,
              sectionYear ? timelineStyles.dateIndicatorWithYear : null,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
              },
              DesignSystem.shadows.softAmbient,
            ]}
          >
            <Text
              style={[timelineStyles.dateNumber, { color: colors.primary }]}
            >
              {date.getDate()}
            </Text>
            <Text
              style={[timelineStyles.dateMonth, { color: colors.primary }]}
            >
              {formatTaskSectionMonth(date)}
            </Text>
            {sectionYear ? (
              <Text
                style={[
                  timelineStyles.dateBadgeYear,
                  { color: colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {sectionYear}
              </Text>
            ) : null}
          </View>
          <View style={timelineStyles.dateInfo}>
            <Text
              style={[
                scheduleStyles.sectionTitle,
                { color: colors.text },
                isTablet && {
                  fontSize:
                    (DesignSystem.typography.title2.fontSize || 24) *
                    fontMultiplier,
                },
              ]}
            >
              {section.title}
            </Text>
            <Text
              style={[
                scheduleStyles.sectionSubtitle,
                { color: colors.textSecondary },
              ]}
            >
              {section.taskCount} task{section.taskCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View
      style={[
        scheduleStyles.emptyOuter,
        {
          width: windowWidth,
          maxWidth: windowWidth,
          paddingHorizontal: DesignSystem.spacing.lg,
        },
      ]}
    >
      <Text style={[scheduleStyles.emptyTitle, { color: colors.text }]}>
        {homeSetupIncomplete ? "Set up your home" : "Nothing scheduled yet"}
      </Text>
      <Text
        style={[scheduleStyles.emptySubtitle, { color: colors.textSecondary }]}
      >
        {homeSetupIncomplete
          ? "Tell us about this house and we'll build a maintenance schedule that matches it."
          : "Add a task or browse a maintenance plan to get started."}
      </Text>

      {homeSetupIncomplete && onSetupHome ? (
        <View style={scheduleStyles.emptyButton}>
          <Button
            label="Set up your home"
            onPress={onSetupHome}
            variant="primary"
          />
        </View>
      ) : onAddTask ? (
        <View style={scheduleStyles.emptyButton}>
          <Button label="Add a task" onPress={onAddTask} variant="primary" />
        </View>
      ) : null}

      {onBrowseMaintenancePlans ? (
        <TextLink
          prefix=""
          linkText="Browse maintenance plans"
          onPress={onBrowseMaintenancePlans}
        />
      ) : null}
    </View>
  );

  return (
    <SectionList<MaintenanceTask, DashboardScheduleSection>
      ref={listRef}
      style={scheduleStyles.list}
      sections={sections}
      keyExtractor={(item) => item.instance_id}
      stickySectionHeadersEnabled
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={[
        {
          paddingBottom: contentPaddingBottom,
          flexGrow: 1,
        },
        sections.length === 0 && scheduleStyles.emptyListContent,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      renderSectionHeader={renderSectionHeader}
      renderItem={({ item, index, section }) => (
        <ScheduleTaskRow
          task={item}
          showConnectorBelow={index < section.data.length - 1}
          variant={
            section.headerVariant === "overdue" ? "overdue" : "default"
          }
          onCompleteTask={onCompleteTask}
          isCompleting={completingInstanceIds?.has(item.instance_id) ?? false}
          onTaskPress={onTaskPress}
          onSkipOccurrence={onSkipOccurrence}
        />
      )}
      onScrollToIndexFailed={() => {}}
    />
  );
});

const scheduleStyles = StyleSheet.create({
  list: {
    flex: 1,
  },
  stickyHeaderBase: {},
  sectionTitle: {
    ...DesignSystem.typography.title2,
  },
  sectionSubtitle: {
    ...DesignSystem.typography.footnote,
    marginTop: DesignSystem.spacing.xs,
  },
  emptyOuter: {
    marginTop: DesignSystem.spacing.xl,
    alignItems: "stretch",
  },
  emptyListContent: {
    justifyContent: "flex-start",
  },
  emptyTitle: {
    ...DesignSystem.typography.title2,
    marginBottom: DesignSystem.spacing.sm,
  },
  emptySubtitle: {
    ...DesignSystem.typography.callout,
    marginBottom: DesignSystem.spacing.lg,
  },
  emptyButton: {
    marginBottom: DesignSystem.spacing.sm,
  },
});
