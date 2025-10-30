import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../hooks/useTasks";
import { useNavigation } from "@react-navigation/native";
import { AppStackParamList } from "../../navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { completionHistoryStyles } from "./styles";
import { DesignSystem } from "../../theme/designSystem";
import { useGradients } from "../../hooks";
import {
  GroupedRoutine,
  groupTasksByRoutine,
  formatDate,
  formatDateTime,
} from "./utils";

export function CompletionHistoryScreen() {
  const { colors, isDark } = useTheme();
  const { completedTasks, overdueTasks, completeTask, refreshTasks, loading } =
    useTasks();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { heroGradient, heroGradientLocations, radialGlow, ambientGradient } = useGradients();
  const [groupedRoutines, setGroupedRoutines] = useState<GroupedRoutine[]>([]);
  const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(
    new Set()
  );
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(
    new Set()
  );
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const prevLoadingRef = useRef<boolean | null>(null);

  // Animation values for header elements
  const backButtonOpacity = useSharedValue(0);
  const backButtonTranslateY = useSharedValue(10);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(15);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(15);

  const [animationKey, setAnimationKey] = useState(0);

  const triggerAnimations = useCallback(() => {
    // Reset values
    backButtonOpacity.value = 0;
    backButtonTranslateY.value = 10;
    titleOpacity.value = 0;
    titleTranslateY.value = 15;
    subtitleOpacity.value = 0;
    subtitleTranslateY.value = 15;

    // Animate with springs and staggered delays
    backButtonOpacity.value = withDelay(100, withSpring(1, { damping: 15, stiffness: 150 }));
    backButtonTranslateY.value = withDelay(100, withSpring(0, { damping: 15, stiffness: 150 }));
    titleOpacity.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 150 }));
    titleTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 150 }));
    subtitleOpacity.value = withDelay(300, withSpring(1, { damping: 15, stiffness: 150 }));
    subtitleTranslateY.value = withDelay(300, withSpring(0, { damping: 15, stiffness: 150 }));

    // Force list items to re-render and re-animate
    setAnimationKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    triggerAnimations();
  }, [triggerAnimations]);

  useFocusEffect(
    useCallback(() => {
      triggerAnimations();
    }, [triggerAnimations])
  );

  // Animation styles
  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backButtonOpacity.value,
    transform: [{ translateY: backButtonTranslateY.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  useEffect(() => {
    // Use the already-filtered overdue tasks from useTasks instead of re-filtering
    setGroupedRoutines(groupTasksByRoutine(completedTasks, overdueTasks));
  }, [completedTasks, overdueTasks]);

  useEffect(() => {
    // Track when loading transitions from true to false (load completed)
    if (prevLoadingRef.current === true && loading === false) {
      setHasLoadedOnce(true);
    }
    prevLoadingRef.current = loading;
  }, [loading]);

  const toggleRoutineExpansion = (routineId: string) => {
    const newExpanded = new Set(expandedRoutines);
    if (newExpanded.has(routineId)) {
      newExpanded.delete(routineId);
    } else {
      newExpanded.add(routineId);
    }
    setExpandedRoutines(newExpanded);
  };

  const handleCompleteOverdueTask = async (
    instanceId: string,
    taskTitle: string
  ) => {
    if (completingTasks.has(instanceId)) return; // Prevent multiple clicks

    setCompletingTasks((prev) => new Set(prev).add(instanceId));

    try {
      const result = await completeTask(instanceId);

      if (result.success) {
        // Refresh all task data to ensure consistency
        await refreshTasks();

        // Show success feedback
        Alert.alert(
          "Task Completed!",
          `"${taskTitle}" has been marked as completed.`,
          [{ text: "OK" }]
        );
      } else {
        // Show error feedback
        Alert.alert(
          "Completion Failed",
          result.error || "Failed to complete the task. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error completing overdue task:", error);
      Alert.alert(
        "Completion Failed",
        "An unexpected error occurred. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setCompletingTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(instanceId);
        return newSet;
      });
    }
  };

  const renderProgressIndicator = (routine: GroupedRoutine) => {
    return (
      <View style={completionHistoryStyles.progressContainer}>
        <View style={completionHistoryStyles.progressBar}>
          <View style={completionHistoryStyles.progressBarBackground}>
            <View
              style={[
                completionHistoryStyles.progressBarFill,
                {
                  width: `${Math.min(routine.totalInstances * 5, 100)}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        </View>
        <View style={completionHistoryStyles.progressStats}>
          <View style={completionHistoryStyles.progressStat}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text
              style={[
                completionHistoryStyles.progressText,
                { color: colors.textSecondary },
              ]}
            >
              {routine.completedInstances.length} completed
            </Text>
          </View>
          {routine.pastDueInstances.length > 0 && (
            <View style={completionHistoryStyles.progressStat}>
              <Ionicons name="close-circle" size={16} color="#EF4444" />
              <Text
                style={[
                  completionHistoryStyles.progressText,
                  { color: "#EF4444" },
                ]}
              >
                {routine.pastDueInstances.length} overdue
              </Text>
            </View>
          )}
          {routine.intervalDays > 0 && (
            <View style={completionHistoryStyles.progressStat}>
              <Ionicons name="refresh" size={16} color={colors.textSecondary} />
              <Text
                style={[
                  completionHistoryStyles.progressText,
                  { color: colors.textSecondary },
                ]}
              >
                Every {routine.intervalDays} days
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render function helper that will be used inside the component
  const renderProgressIndicatorForItem = (routine: GroupedRoutine) => {
    return renderProgressIndicator(routine);
  };

  // Create animated routine item component to properly use hooks
  const AnimatedRoutineItem = React.memo(
    ({
      item,
      index,
      isExpanded,
      onToggle,
      onCompleteOverdueTask,
      completingTasks,
      colors,
      isDark,
      renderProgress,
    }: {
      item: GroupedRoutine;
      index: number;
      isExpanded: boolean;
      onToggle: () => void;
      onCompleteOverdueTask: (instanceId: string, taskTitle: string) => void;
      completingTasks: Set<string>;
      colors: any;
      isDark: boolean;
      renderProgress: (routine: GroupedRoutine) => React.ReactNode;
    }) => {
      // Staggered animation for list items
      const itemOpacity = useSharedValue(0);
      const itemTranslateY = useSharedValue(20);

      useEffect(() => {
        const delay = 400 + index * 100; // Start after header animations, stagger by 100ms each
        itemOpacity.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 150 }));
        itemTranslateY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 150 }));
      }, [index]);

      const itemAnimatedStyle = useAnimatedStyle(() => ({
        opacity: itemOpacity.value,
        transform: [{ translateY: itemTranslateY.value }],
      }));

      return (
        <Animated.View
          style={[
            completionHistoryStyles.routineItem,
            {
              backgroundColor: isDark
                ? "rgba(35, 37, 38, 0.4)"
                : "rgba(255, 255, 255, 0.4)",
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(255, 255, 255, 0.6)",
            },
            itemAnimatedStyle,
          ]}
        >
          {(() => {
            // Inline the routine item JSX here
            return (
              <>
                {/* Routine Header */}
                <TouchableOpacity
                  style={completionHistoryStyles.routineHeader}
                  onPress={onToggle}
                  activeOpacity={0.7}
                >
                  <View style={completionHistoryStyles.routineHeaderLeft}>
                    <Text
                      style={[
                        completionHistoryStyles.routineTitle,
                        { color: colors.text },
                      ]}
                    >
                      {item.title}
                    </Text>
                    <View
                      style={[
                        completionHistoryStyles.categoryBadge,
                        { backgroundColor: colors.primary + "20" },
                      ]}
                    >
                      <Text
                        style={[
                          completionHistoryStyles.categoryText,
                          { color: colors.primary },
                        ]}
                      >
                        {item.category}
                      </Text>
                    </View>
                  </View>

                  <View style={completionHistoryStyles.routineHeaderRight}>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>

                {/* Progress Indicator */}
                {renderProgress(item)}

                {/* Last Completion */}
                <View style={completionHistoryStyles.lastCompletion}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[
                      completionHistoryStyles.lastCompletionText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Last completed:{" "}
                    {item.latestCompletion
                      ? formatDateTime(item.latestCompletion)
                      : "N/A"}
                  </Text>
                </View>

                {/* Expandable Instance Details */}
                {isExpanded && (
                  <View style={completionHistoryStyles.instanceDetails}>
                    <Text
                      style={[
                        completionHistoryStyles.instanceTitle,
                        { color: colors.text },
                      ]}
                    >
                      Task History
                    </Text>
                    {item.completedInstances.map((instance) => (
                      <View
                        key={instance.instance_id}
                        style={completionHistoryStyles.instanceItem}
                      >
                        <View style={completionHistoryStyles.instanceHeader}>
                          <Text
                            style={[
                              completionHistoryStyles.instanceDate,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Completed: {formatDateTime(instance.completed_at || "")}
                          </Text>
                          <View style={completionHistoryStyles.instancePriority}>
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color="#10B981"
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                    {item.pastDueInstances.map((instance) => {
                      const isCompleting = completingTasks.has(instance.instance_id);
                      return (
                        <View
                          key={instance.instance_id}
                          style={completionHistoryStyles.instanceItem}
                        >
                          <View style={completionHistoryStyles.instanceHeader}>
                            <Text
                              style={[
                                completionHistoryStyles.instanceDate,
                                { color: colors.textSecondary },
                              ]}
                            >
                              Past Due: {formatDate(instance.due_date)}
                            </Text>
                            <View style={completionHistoryStyles.instancePriority}>
                              <Ionicons name="close-circle" size={16} color="#EF4444" />
                            </View>
                          </View>

                          {/* Completion Button for Overdue Tasks */}
                          <TouchableOpacity
                            style={[
                              completionHistoryStyles.completeButton,
                              {
                                backgroundColor: isCompleting
                                  ? colors.surface
                                  : colors.primary + "10",
                                borderColor: colors.primary,
                                borderWidth: 2,
                                opacity: isCompleting ? 0.6 : 1,
                              },
                            ]}
                            onPress={() =>
                              onCompleteOverdueTask(
                                instance.instance_id,
                                instance.title
                              )
                            }
                            disabled={isCompleting}
                            activeOpacity={0.8}
                          >
                            {isCompleting ? (
                              <Ionicons
                                name="hourglass"
                                size={16}
                                color={colors.primary}
                              />
                            ) : (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color={colors.primary}
                              />
                            )}
                            <Text
                              style={[
                                completionHistoryStyles.completeButtonText,
                                { color: colors.primary },
                              ]}
                            >
                              {isCompleting ? "Completing..." : "Complete Now"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            );
          })()}
        </Animated.View>
      );
    }
  );

  const renderRoutineItem = ({ item, index }: { item: GroupedRoutine; index: number }) => {
    const isExpanded = expandedRoutines.has(item.routineId);

    return (
      <AnimatedRoutineItem
        item={item}
        index={index}
        isExpanded={isExpanded}
        onToggle={() => toggleRoutineExpansion(item.routineId)}
        onCompleteOverdueTask={handleCompleteOverdueTask}
        completingTasks={completingTasks}
        colors={colors}
        isDark={isDark}
        renderProgress={renderProgressIndicatorForItem}
      />
    );
  };

  const renderEmptyState = () => {
    if (loading || !hasLoadedOnce) {
      return null;
    }
    return (
      <View style={completionHistoryStyles.emptyState}>
        <Ionicons
          name="checkmark-circle-outline"
          size={64}
          color={colors.textSecondary}
        />
        <Text
          style={[
            completionHistoryStyles.emptyStateTitle,
            { color: colors.text },
          ]}
        >
          No completed tasks yet
        </Text>
        <Text
          style={[
            completionHistoryStyles.emptyStateSubtitle,
            { color: colors.textSecondary },
          ]}
        >
          Complete your first task to see it here!
        </Text>
      </View>
    );
  };

  return (    <View style={[completionHistoryStyles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} translucent />
      
      {/* Hero Section with Gradient */}
      <View style={completionHistoryStyles.heroContainer}>
          {/* Bottom fade mask */}
          <LinearGradient
            colors={["transparent", "transparent", colors.background]}
            locations={[0, 0.4, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={completionHistoryStyles.bottomFade}
            pointerEvents="none"
          />

          {/* Layered gradient background */}
          <LinearGradient
            colors={heroGradient}
            locations={heroGradientLocations}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={completionHistoryStyles.gradientBase}
          />

          {/* Glow effect */}
          <LinearGradient
            colors={[radialGlow.innerColor, radialGlow.midColor, radialGlow.outerColor, radialGlow.fadeColor]}
            locations={[0, 0.3, 0.6, 1]}
            start={{ x: 0.5, y: 0.3 }}
            end={{ x: 1, y: 1 }}
            style={completionHistoryStyles.gradientGlow}
          />

          {/* Content layer */}
          <View style={completionHistoryStyles.contentLayer}>
            {/* Back Button */}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: DesignSystem.spacing.md,
                  left: DesignSystem.spacing.md,
                  zIndex: 10,
                },
                backButtonAnimatedStyle,
              ]}
            >
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark
                    ? "rgba(35, 37, 38, 0.5)"
                    : "rgba(255, 255, 255, 0.5)",
                  borderRadius: 20,
                  paddingHorizontal: DesignSystem.spacing.lg,
                  paddingVertical: DesignSystem.spacing.sm,
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(255, 255, 255, 0.25)",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 15,
                    fontWeight: "600",
                    opacity: 0.7,
                  }}
                >
                  ← Back
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Header Content */}
            <View style={completionHistoryStyles.heroContent}>
              <Animated.Text
                style={[
                  completionHistoryStyles.heroTitle,
                  { color: colors.text },
                  titleAnimatedStyle,
                ]}
              >
                Completion History
              </Animated.Text>
              <Animated.Text
                style={[
                  completionHistoryStyles.heroSubtitle,
                  { color: colors.textSecondary },
                  subtitleAnimatedStyle,
                ]}
              >
                {completedTasks.length} tasks completed
              </Animated.Text>
            </View>
          </View>
        </View>

      <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1 }}>
        {/* Routines List */}
        <FlatList
          data={groupedRoutines}
          renderItem={renderRoutineItem}
          keyExtractor={(item) => `${item.routineId}-${animationKey}`}
          contentContainerStyle={completionHistoryStyles.routinesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          extraData={animationKey}
        />
      </SafeAreaView>
    </View>
  );
}

