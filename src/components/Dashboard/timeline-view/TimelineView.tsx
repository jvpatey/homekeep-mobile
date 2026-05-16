import React, { useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { useDevice } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import { MaintenanceTask } from "../../../types/maintenance";
import { Ionicons } from "@expo/vector-icons";
import { timelineStyles } from "./styles";
import { groupTasksByDate, formatDate } from "./utils";
import {
  formatTaskSectionMonth,
  formatTaskSectionYear,
} from "../../../utils/formatTaskDates";
import { ScheduleTaskRow } from "../ScheduleTaskRow";

// TimelineViewProps interface for the TimelineView component
interface TimelineViewProps {
  tasks: MaintenanceTask[];
  onCompleteTask: (instanceId: string) => void;
  onTaskPress?: (instanceId: string) => void;
  onSkipOccurrence?: (
    task: MaintenanceTask,
    closeSwipe: () => void
  ) => void | Promise<void>;
  visible?: boolean;
  onContentSizeChange?: (height: number) => void;
}

// TimelineView component for the Dashboard
export function TimelineView({
  tasks,
  onCompleteTask,
  onTaskPress,
  onSkipOccurrence,
  visible = true,
  onContentSizeChange,
}: TimelineViewProps) {
  const { colors, isDark } = useTheme();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  
  const fontMultiplier = getFontMultiplier();

  // Animation for timeline appearance and exit
  const opacity = useSharedValue(visible ? 1 : 0);
  const translateY = useSharedValue(visible ? 0 : -20);

  useEffect(() => {
    if (visible) {
      // Animate in
      opacity.value = withTiming(1, {
        duration: DesignSystem.motion.duration.base,
        easing: DesignSystem.motion.easing.standard,
      });
      translateY.value = withTiming(0, {
        duration: DesignSystem.motion.duration.base,
        easing: DesignSystem.motion.easing.standard,
      });
    } else {
      // Animate out
      opacity.value = withTiming(0, {
        duration: DesignSystem.motion.duration.fast,
        easing: DesignSystem.motion.easing.standard,
      });
      translateY.value = withTiming(-20, {
        duration: DesignSystem.motion.duration.fast,
        easing: DesignSystem.motion.easing.standard,
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // groupedTasks function to group the tasks by date
  const groupedTasks = groupTasksByDate(tasks);

  if (tasks.length === 0) {
    return (
      <Animated.View
        style={[
          timelineStyles.emptyContainer,
          { backgroundColor: colors.glass, borderColor: colors.glassBorder },
          animatedStyle,
        ]}
      >
        <View style={[
          timelineStyles.emptyIconContainer,
          isTablet && {
            width: 64 * fontMultiplier,
            height: 64 * fontMultiplier,
            borderRadius: 32 * fontMultiplier,
          },
        ]}>
          <View
            style={[
              timelineStyles.emptyIconBackground,
              {
                backgroundColor: colors.background,
                borderColor: colors.primary,
              },
              isTablet && {
                borderRadius: 30 * fontMultiplier,
                borderWidth: 2 * fontMultiplier,
              },
            ]}
          >
            <View style={[
              timelineStyles.emptyIcon,
              isTablet && {
                width: 60 * fontMultiplier,
                height: 60 * fontMultiplier,
                borderRadius: 30 * fontMultiplier,
              },
            ]}>
              <Ionicons name="calendar" size={isTablet ? 32 * fontMultiplier : 32} color={colors.primary} />
            </View>
          </View>
        </View>
        <Text style={[
          timelineStyles.emptyTitle,
          { color: colors.text },
          isTablet && {
            fontSize: timelineStyles.emptyTitle.fontSize * fontMultiplier,
            lineHeight: (timelineStyles.emptyTitle.fontSize * fontMultiplier) * 1.3,
          },
        ]}>
          No Upcoming Tasks
        </Text>
        <Text
          style={[
            timelineStyles.emptySubtitle,
            { color: colors.textSecondary },
            isTablet && {
              fontSize: (timelineStyles.emptySubtitle.fontSize || 16) * fontMultiplier,
              lineHeight: ((timelineStyles.emptySubtitle.fontSize || 16) * fontMultiplier) * 1.4,
            },
          ]}
        >
          You're all caught up!
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[timelineStyles.container, animatedStyle]}>
      <View style={[
        timelineStyles.header,
        isTablet && {
          paddingHorizontal: getResponsiveValue(
            DesignSystem.spacing.md,
            DesignSystem.spacing.lg,
            DesignSystem.spacing.xl,
          ),
        },
      ]}>
        <Text style={[
          timelineStyles.title,
          { color: colors.text },
          isTablet && {
            fontSize: timelineStyles.title.fontSize * fontMultiplier,
            lineHeight: (timelineStyles.title.fontSize * fontMultiplier) * 1.3,
          },
        ]}>
          Timeline
        </Text>
        <Text
          style={[
            timelineStyles.subtitle,
            { color: colors.textSecondary },
            isTablet && {
              fontSize: (timelineStyles.subtitle.fontSize || 16) * fontMultiplier,
              lineHeight: ((timelineStyles.subtitle.fontSize || 16) * fontMultiplier) * 1.4,
            },
          ]}
        >
          Upcoming tasks
        </Text>
      </View>

      <ScrollView
        style={timelineStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          timelineStyles.scrollContent,
          isTablet && {
            paddingBottom: getResponsiveValue(
              DesignSystem.spacing.xxxl + DesignSystem.spacing.xl,
              DesignSystem.spacing.xxxl + DesignSystem.spacing.xl + DesignSystem.spacing.md,
              DesignSystem.spacing.xxxl + DesignSystem.spacing.xl + DesignSystem.spacing.lg,
            ),
          },
        ]}
        scrollEnabled={false}
        onContentSizeChange={(width, height) => {
          onContentSizeChange?.(height);
        }}
      >
        {groupedTasks.map(({ date, tasks }, groupIndex) => {
          const sectionYear = formatTaskSectionYear(date);
          return (
          <View key={groupIndex} style={[
            timelineStyles.dateGroup,
            groupIndex === groupedTasks.length - 1 && isTablet && {
              marginBottom: getResponsiveValue(
                DesignSystem.spacing.xl,
                DesignSystem.spacing.xl + DesignSystem.spacing.md,
                DesignSystem.spacing.xl + DesignSystem.spacing.lg,
              ),
            },
          ]}>
            {/* Date Header */}
            <View style={[
              timelineStyles.dateHeader,
              isTablet && {
                paddingHorizontal: getResponsiveValue(
                  DesignSystem.spacing.md,
                  DesignSystem.spacing.lg,
                  DesignSystem.spacing.xl,
                ),
              },
            ]}>
              <View
                style={[
                  timelineStyles.dateIndicator,
                  sectionYear ? timelineStyles.dateIndicatorWithYear : null,
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
                    width: getResponsiveValue(56, 64, 72),
                    height: sectionYear
                      ? getResponsiveValue(62, 70, 78)
                      : getResponsiveValue(56, 64, 72),
                    borderRadius: getResponsiveValue(14, 16, 18),
                  },
                ]}
              >
                <Text
                  style={[
                    timelineStyles.dateNumber,
                    { color: colors.primary },
                    isTablet && {
                      fontSize: 18 * fontMultiplier,
                      lineHeight: 20 * fontMultiplier,
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
                      fontSize: 11 * fontMultiplier,
                      lineHeight: 13 * fontMultiplier,
                    },
                  ]}
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
                <Text style={[
                  timelineStyles.dateText,
                  { color: colors.text },
                  isTablet && {
                    fontSize: timelineStyles.dateText.fontSize * fontMultiplier,
                  },
                ]}>
                  {formatDate(date)}
                </Text>
                <Text
                  style={[
                    timelineStyles.taskCount,
                    { color: colors.textSecondary },
                    isTablet && {
                      fontSize: (timelineStyles.taskCount.fontSize || 14) * fontMultiplier,
                    },
                  ]}
                >
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            {/* Tasks for this date */}
            {tasks.map((task, taskIndex) => (
              <ScheduleTaskRow
                key={task.instance_id}
                task={task}
                showConnectorBelow={taskIndex !== tasks.length - 1}
                onCompleteTask={onCompleteTask}
                onTaskPress={onTaskPress}
                onSkipOccurrence={onSkipOccurrence}
              />
            ))}
          </View>
        );
        })}
      </ScrollView>
    </Animated.View>
  );
}
