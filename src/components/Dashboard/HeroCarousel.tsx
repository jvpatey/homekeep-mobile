import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";
import { TaskCard } from "./tasks";
import { MaintenanceTask } from "../../types/maintenance";
import { Ionicons } from "@expo/vector-icons";
import { ViewableItemsChangedEvent } from "../../types/navigation";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth - 80;

// Helper to add alpha to hex color
const addAlpha = (color: string, alpha: number): string => {
  const alphaHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return color + alphaHex;
};

// HeroCarouselProps interface for the HeroCarousel component
interface HeroCarouselProps {
  tasks: MaintenanceTask[];
  onCompleteTask: (instanceId: string) => void;
  onTaskPress?: (instanceId: string) => void;
  showTimelineView?: boolean;
  onToggleTimelineView?: () => void;
}

// HeroCarousel component for the Dashboard
export function HeroCarousel({
  tasks,
  onCompleteTask,
  onTaskPress,
  showTimelineView = false,
  onToggleTimelineView,
}: HeroCarouselProps) {
  const { colors, isDark } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Two-color gradient for selected state - subtle and transparent (50% opacity)
  const gradientColors = [
    addAlpha(colors.primary, 0.5),
    addAlpha(colors.secondary, 0.5),
  ];

  // Animation for empty state
  // Removed animations for cleaner experience

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: ViewableItemsChangedEvent) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const scrollToIndex = useCallback((index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, []);

  const scrollToNext = useCallback(() => {
    const nextIndex = Math.min(currentIndex + 1, tasks.length - 1);
    scrollToIndex(nextIndex);
  }, [currentIndex, tasks.length, scrollToIndex]);

  const scrollToPrevious = useCallback(() => {
    const prevIndex = Math.max(currentIndex - 1, 0);
    scrollToIndex(prevIndex);
  }, [currentIndex, scrollToIndex]);

  if (tasks.length === 0) {
    return (
      <View style={styles.container}>
        {/* Header with Timeline Toggle */}
        <View style={styles.header}>
          <Text
          style={[
            styles.title,
            {
              color: isDark
                ? colors.text
                : "rgba(15, 23, 42, 0.9)",
            },
          ]}
        >
          What's Next
        </Text>
          <View style={styles.headerRight}>
            {onToggleTimelineView && (
              <TouchableOpacity
                onPress={onToggleTimelineView}
                activeOpacity={0.7}
              >
                {showTimelineView ? (
                  <LinearGradient
                    colors={gradientColors}
                    locations={[0, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.toggleButton,
                      styles.toggleButtonSelected,
                      {
                        borderColor: isDark
                          ? "rgba(255, 255, 255, 0.2)"
                          : "rgba(255, 255, 255, 0.8)",
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Ionicons name="calendar" size={16} color="#FFFFFF" />
                    <Text style={[styles.toggleButtonText, { color: "#FFFFFF" }]}>
                      Timeline
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.toggleButton,
                      {
                        backgroundColor: isDark
                          ? "rgba(35, 37, 38, 0.4)"
                          : "rgba(255, 255, 255, 0.4)",
                        borderColor: isDark
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(255, 255, 255, 0.6)",
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name="calendar"
                      size={16}
                      color={
                        isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(15, 23, 42, 0.75)"
                      }
                    />
                    <Text
                      style={[
                        styles.toggleButtonText,
                        {
                          color: isDark
                            ? "rgba(255, 255, 255, 0.8)"
                            : "rgba(15, 23, 42, 0.8)",
                        },
                      ]}
                    >
                      Timeline
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Empty State */}
        <View
          style={[
            styles.emptyContainer,
            {
              backgroundColor: isDark
                ? "rgba(35, 37, 38, 0.4)"
                : "rgba(255, 255, 255, 0.4)",
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(255, 255, 255, 0.6)",
            },
          ]}
        >
          <View style={styles.emptyIconContainer}>
            <View
              style={[
                styles.emptyIconBackground,
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
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="checkmark-circle"
                  size={32}
                  color={
                    isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(15, 23, 42, 0.65)"
                  }
                />
              </View>
            </View>
          </View>
          <Text
            style={[
              styles.emptyTitle,
              {
                color: isDark
                  ? "rgba(255, 255, 255, 0.9)"
                  : "rgba(15, 23, 42, 0.85)",
              },
            ]}
          >
            All Caught Up!
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              {
                color: isDark
                  ? "rgba(255, 255, 255, 0.7)"
                  : "rgba(15, 23, 42, 0.65)",
              },
            ]}
          >
            No tasks due right now
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            {
              color: isDark
                ? colors.text
                : "rgba(15, 23, 42, 0.9)",
            },
          ]}
        >
          What's Next
        </Text>
        <View style={styles.headerRight}>
          {onToggleTimelineView && (
            <TouchableOpacity
              onPress={onToggleTimelineView}
              activeOpacity={0.7}
            >
              {showTimelineView ? (
                <LinearGradient
                  colors={gradientColors}
                  locations={[0, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.toggleButton,
                    styles.toggleButtonSelected,
                    {
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.2)"
                        : "rgba(255, 255, 255, 0.8)",
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Ionicons name="calendar" size={16} color="#FFFFFF" />
                  <Text style={[styles.toggleButtonText, { color: "#FFFFFF" }]}>
                    Timeline
                  </Text>
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.toggleButton,
                    {
                      backgroundColor: isDark
                        ? "rgba(35, 37, 38, 0.4)"
                        : "rgba(255, 255, 255, 0.4)",
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(255, 255, 255, 0.6)",
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="calendar"
                    size={16}
                    color={
                      isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(15, 23, 42, 0.75)"
                    }
                  />
                  <Text
                    style={[
                      styles.toggleButtonText,
                      {
                        color: isDark
                          ? "rgba(255, 255, 255, 0.8)"
                          : "rgba(15, 23, 42, 0.8)",
                      },
                    ]}
                  >
                    Timeline
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[
                styles.navButton,
                {
                  backgroundColor: isDark
                    ? "rgba(35, 37, 38, 0.4)"
                    : "rgba(255, 255, 255, 0.4)",
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(255, 255, 255, 0.6)",
                  borderWidth: 1,
                },
              ]}
              onPress={scrollToPrevious}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={
                  isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(15, 23, 42, 0.8)"
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.navButton,
                {
                  backgroundColor: isDark
                    ? "rgba(35, 37, 38, 0.4)"
                    : "rgba(255, 255, 255, 0.4)",
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(255, 255, 255, 0.6)",
                  borderWidth: 1,
                },
              ]}
              onPress={scrollToNext}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={
                  isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(15, 23, 42, 0.8)"
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={tasks}
          horizontal
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + DesignSystem.spacing.md * 2}
          snapToAlignment="center"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          scrollEnabled
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 50,
          }}
          renderItem={({ item: task }: { item: MaintenanceTask }) => (
            <View style={styles.cardContainer}>
              <TaskCard
                id={task.id}
                instance_id={task.instance_id}
                title={task.title}
                category={task.category}
                priority={task.priority}
                estimated_duration_minutes={task.estimated_duration_minutes}
                interval_days={task.interval_days}
                due_date={task.due_date}
                is_completed={task.is_completed}
                onComplete={onCompleteTask}
                onPress={onTaskPress}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        />
      </View>

      {/* Pagination Dots */}
      {tasks.length > 1 && (
        <View style={styles.paginationContainer}>
          {tasks.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.2)"
                    : "rgba(0, 0, 0, 0.2)",
                },
                index === currentIndex && [
                  styles.paginationDotActive,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.6)"
                      : "rgba(0, 0, 0, 0.6)",
                  },
                ],
              ]}
            />
          ))}
        </View>
      )}

      {/* Task Counter */}
      <View style={styles.counterContainer}>
        <Text
          style={[
            styles.counterText,
            {
              color: isDark
                ? "rgba(255, 255, 255, 0.7)"
                : "rgba(15, 23, 42, 0.65)",
            },
          ]}
        >
          {currentIndex + 1} of {tasks.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
  },
  title: {
    ...DesignSystem.typography.h2,
  },
  headerRight: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
    alignItems: "center",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  toggleButtonSelected: {
    shadowColor: "#2EC4B6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  navigationButtons: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  carouselContainer: {
    alignItems: "center",
  },
  scrollView: {
    height: 240,
  },
  scrollContent: {
    paddingLeft: (screenWidth - CARD_WIDTH) / 2 - DesignSystem.spacing.md,
    paddingRight: (screenWidth - CARD_WIDTH) / 2 - DesignSystem.spacing.md,
  },
  cardContainer: {
    alignItems: "center",
  },
  emptyContainer: {
    height: 180,
    marginHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.xlarge,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.xl,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  emptyIconBackground: {
    flex: 1,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    ...DesignSystem.typography.h3,
    marginBottom: DesignSystem.spacing.sm,
    textAlign: "center",
    fontWeight: "700",
  },
  emptySubtitle: {
    ...DesignSystem.typography.body,
    textAlign: "center",
    opacity: 0.8,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: DesignSystem.spacing.sm,
    gap: DesignSystem.spacing.xs,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paginationDotActive: {
    width: 24,
  },
  counterContainer: {
    alignItems: "center",
    marginTop: DesignSystem.spacing.xs,
  },
  counterText: {
    ...DesignSystem.typography.caption,
  },
});
