import React from "react";
import {
  SectionList,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useDevice } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { MaintenanceTask } from "../../types/maintenance";
import { DashboardScheduleSection } from "./dashboardSections";
import { ScheduleTaskRow } from "./ScheduleTaskRow";
import { timelineStyles } from "./timeline-view/styles";

interface DashboardScheduleListProps {
  sections: DashboardScheduleSection[];
  ListHeaderComponent: React.ComponentType<unknown> | React.ReactElement | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  onCompleteTask: (instanceId: string) => void;
  onTaskPress?: (instanceId: string) => void;
  onAddTask?: () => void;
  /** Bottom padding so content clears the FAB */
  contentPaddingBottom: number;
}

export function DashboardScheduleList({
  sections,
  ListHeaderComponent,
  onRefresh,
  refreshing = false,
  onCompleteTask,
  onTaskPress,
  onAddTask,
  contentPaddingBottom,
}: DashboardScheduleListProps) {
  const { colors, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const fontMultiplier = getFontMultiplier();

  const renderSectionHeader = ({
    section,
  }: {
    section: DashboardScheduleSection;
  }) => {
    if (section.headerVariant === "due_soon") {
      return (
        <View
          style={[
            scheduleStyles.stickyHeaderBase,
            {
              backgroundColor: colors.background,
              paddingHorizontal: DesignSystem.spacing.md,
              paddingTop: DesignSystem.spacing.md,
              paddingBottom: DesignSystem.spacing.sm,
            },
            isTablet && {
              paddingHorizontal: getResponsiveValue(
                DesignSystem.spacing.md,
                DesignSystem.spacing.lg,
                DesignSystem.spacing.xl
              ),
            },
          ]}
        >
          <Text
            style={[
              DesignSystem.typography.h3,
              {
                color: isDark
                  ? "rgba(255, 255, 255, 0.92)"
                  : "rgba(15, 23, 42, 0.92)",
                letterSpacing: -0.2,
              },
              isTablet && {
                fontSize:
                  (DesignSystem.typography.h3.fontSize || 22) *
                  fontMultiplier,
              },
            ]}
          >
            {section.title}
          </Text>
          {section.subtitle ? (
            <Text
              style={[
                DesignSystem.typography.small,
                {
                  color: isDark
                    ? "rgba(255, 255, 255, 0.65)"
                    : "rgba(15, 23, 42, 0.65)",
                  marginTop: DesignSystem.spacing.xs,
                },
              ]}
            >
              {section.subtitle}
            </Text>
          ) : null}
        </View>
      );
    }

    const date = section.date!;
    const sectionIndex = sections.findIndex((s) => s.key === section.key);
    const prevSection =
      sectionIndex > 0 ? sections[sectionIndex - 1] : undefined;
    const timelineFollowsDueSoonDivider =
      prevSection?.headerVariant === "due_soon";

    return (
      <View
        style={[
          scheduleStyles.stickyHeaderBase,
          {
            backgroundColor: colors.background,
            paddingTop: timelineFollowsDueSoonDivider
              ? 0
              : DesignSystem.spacing.md,
          },
        ]}
      >
        <View
          style={[
            timelineStyles.dateHeader,
            isTablet && {
              paddingHorizontal: getResponsiveValue(
                DesignSystem.spacing.md,
                DesignSystem.spacing.lg,
                DesignSystem.spacing.xl
              ),
            },
          ]}
        >
          <View
            style={[
              timelineStyles.dateIndicator,
              {
                backgroundColor: isDark
                  ? "rgba(35, 37, 38, 0.4)"
                  : "rgba(255, 255, 255, 0.4)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(255, 255, 255, 0.6)",
                borderWidth: 1,
              },
              isTablet && {
                width: getResponsiveValue(50, 60, 70),
                height: getResponsiveValue(50, 60, 70),
                borderRadius: getResponsiveValue(25, 30, 35),
              },
            ]}
          >
            <Text
              style={[
                timelineStyles.dateNumber,
                { color: colors.primary },
                isTablet && {
                  fontSize:
                    timelineStyles.dateNumber.fontSize * fontMultiplier,
                },
              ]}
            >
              {date.getDate()}
            </Text>
            <Text
              style={[
                timelineStyles.dateMonth,
                { color: colors.primary },
                isTablet && {
                  fontSize:
                    (timelineStyles.dateMonth.fontSize || 12) *
                    fontMultiplier,
                },
              ]}
            >
              {date.toLocaleDateString("en-US", { month: "short" })}
            </Text>
          </View>
          <View style={timelineStyles.dateInfo}>
            <Text
              style={[
                timelineStyles.dateText,
                { color: colors.text },
                isTablet && {
                  fontSize:
                    timelineStyles.dateText.fontSize * fontMultiplier,
                },
              ]}
            >
              {section.title}
            </Text>
            <Text
              style={[
                timelineStyles.taskCount,
                { color: colors.textSecondary },
                isTablet && {
                  fontSize:
                    (timelineStyles.taskCount.fontSize || 14) *
                    fontMultiplier,
                },
              ]}
            >
              {section.taskCount} task{section.taskCount !== 1 ? "s" : ""}
            </Text>
            {section.subtitle ? (
              <Text
                style={[
                  DesignSystem.typography.small,
                  {
                    color: isDark
                      ? "rgba(255, 255, 255, 0.55)"
                      : "rgba(15, 23, 42, 0.55)",
                    marginTop: DesignSystem.spacing.xs,
                  },
                ]}
              >
                {section.subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  const renderSectionFooter = ({
    section,
  }: {
    section: DashboardScheduleSection;
  }) => {
    const idx = sections.findIndex((s) => s.key === section.key);
    const showDueSoonToTimelineDivider =
      section.headerVariant === "due_soon" &&
      idx >= 0 &&
      idx < sections.length - 1;

    if (!showDueSoonToTimelineDivider) return null;

    return (
      <View
        style={[
          scheduleStyles.sectionDividerWrap,
          { backgroundColor: colors.background },
          isTablet && {
            paddingHorizontal: getResponsiveValue(
              DesignSystem.spacing.md,
              DesignSystem.spacing.lg,
              DesignSystem.spacing.xl
            ),
          },
        ]}
      >
        <View
          style={[
            scheduleStyles.sectionDividerLine,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.09)"
                : "rgba(15, 23, 42, 0.08)",
            },
          ]}
        />
      </View>
    );
  };

  // SectionList often gives ListEmptyComponent no horizontal measure; borders then collapse to a vertical hairline.
  const renderEmpty = () => (
    <View
      style={[
        scheduleStyles.emptyOuter,
        {
          width: windowWidth,
          maxWidth: windowWidth,
          alignSelf: "center",
        },
      ]}
    >
      <TouchableOpacity
        onPress={onAddTask}
        activeOpacity={onAddTask ? 0.85 : 1}
        disabled={!onAddTask}
        accessibilityRole={onAddTask ? "button" : undefined}
        accessibilityLabel={
          onAddTask ? "Nothing scheduled. Add a task." : "Nothing scheduled."
        }
        style={[
          scheduleStyles.emptyWrap,
          {
            backgroundColor: isDark
              ? "rgba(35, 37, 38, 0.4)"
              : "rgba(255, 255, 255, 0.4)",
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(255, 255, 255, 0.6)",
          },
          isTablet && {
            marginHorizontal: getResponsiveValue(
              DesignSystem.spacing.md,
              DesignSystem.spacing.lg,
              DesignSystem.spacing.xl
            ),
          },
        ]}
      >
      <View style={scheduleStyles.emptyIconOuter}>
        <View
          style={[
            scheduleStyles.emptyIconInner,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.05)",
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(255, 255, 255, 0.6)",
            },
          ]}
        >
          <Ionicons
            name={onAddTask ? "add-circle" : "calendar-outline"}
            size={32}
            color={
              isDark
                ? "rgba(255, 255, 255, 0.7)"
                : "rgba(15, 23, 42, 0.7)"
            }
          />
        </View>
      </View>
      <Text
        style={[
          scheduleStyles.emptyTitle,
          {
            color: isDark
              ? "rgba(255, 255, 255, 0.9)"
              : "rgba(15, 23, 42, 0.85)",
          },
        ]}
      >
        Nothing scheduled yet
      </Text>
      <Text
        style={[
          scheduleStyles.emptySubtitle,
          {
            color: isDark
              ? "rgba(255, 255, 255, 0.7)"
              : "rgba(15, 23, 42, 0.65)",
          },
        ]}
      >
        {onAddTask
          ? "Tap to add a task and build your home schedule"
          : "Your upcoming tasks will appear here"}
      </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SectionList<MaintenanceTask, DashboardScheduleSection>
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
      renderSectionFooter={renderSectionFooter}
      renderItem={({ item, index, section }) => (
        <ScheduleTaskRow
          task={item}
          showConnectorBelow={index < section.data.length - 1}
          variant={
            section.headerVariant === "due_soon" ? "dueSoon" : "default"
          }
          onCompleteTask={onCompleteTask}
          onTaskPress={onTaskPress}
        />
      )}
    />
  );
}

const scheduleStyles = StyleSheet.create({
  list: {
    flex: 1,
  },
  stickyHeaderBase: {},
  sectionDividerWrap: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.md,
  },
  sectionDividerLine: {
    height: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
  },
  emptyOuter: {
    paddingHorizontal: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.lg,
  },
  emptyWrap: {
    alignSelf: "stretch",
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: 1,
    paddingVertical: DesignSystem.spacing.xxl,
    paddingHorizontal: DesignSystem.spacing.lg,
    alignItems: "center",
  },
  emptyListContent: {
    justifyContent: "flex-start",
  },
  emptyIconOuter: {
    marginBottom: DesignSystem.spacing.md,
  },
  emptyIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    ...DesignSystem.typography.h3,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.sm,
  },
  emptySubtitle: {
    ...DesignSystem.typography.body,
    textAlign: "center",
  },
});
