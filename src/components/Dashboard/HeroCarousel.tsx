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
import { useDevice } from "../../hooks";
import { TaskCard } from "./tasks";
import { MaintenanceTask } from "../../types/maintenance";
import { Ionicons } from "@expo/vector-icons";
import { ViewableItemsChangedEvent } from "../../types/navigation";

const { width: screenWidth } = Dimensions.get("window");

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
  onAddTask?: () => void;
}

// HeroCarousel component for the Dashboard
export function HeroCarousel({
  tasks,
  onCompleteTask,
  onTaskPress,
  onAddTask,
}: HeroCarouselProps) {
  const { colors, isDark } = useTheme();
  const { isTablet, getResponsiveValue, getFontMultiplier, width, height } = useDevice();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Responsive card width for iPad - match header padding for consistency
  // Header has: lg (24px) on standard iPad, xl (32px) on iPad Pro
  // Cards need: header padding * 2 (both sides) + card margin * 2
  const headerPadding = isTablet
    ? getResponsiveValue(
        DesignSystem.spacing.md,
        DesignSystem.spacing.lg,   // 24px on standard iPad
        DesignSystem.spacing.xl,    // 32px on iPad Pro
      )
    : DesignSystem.spacing.md;
  
  const cardMargin = DesignSystem.spacing.md; // 16px card margin from styles
  const cardWidth = screenWidth - (headerPadding * 2) - (cardMargin * 2);

  // Two-color gradient for selected state - subtle and transparent (50% opacity)
  const gradientColors = [
    addAlpha(colors.primary, 0.42),
    addAlpha(colors.secondary, 0.32),
  ] as [string, string];

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text
              style={[
                styles.title,
                {
                  color: isDark
                    ? colors.text
                    : "rgba(15, 23, 42, 0.9)",
                },
                isTablet && {
                  fontSize: (styles.title.fontSize || 20) * getFontMultiplier(),
                  lineHeight:
                    ((styles.title.fontSize || 20) * getFontMultiplier()) *
                    1.2,
                },
              ]}
            >
              Up Next
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  color: isDark
                    ? "rgba(255, 255, 255, 0.65)"
                    : "rgba(15, 23, 42, 0.65)",
                },
                isTablet && {
                  fontSize:
                    (styles.subtitle.fontSize || 14) * getFontMultiplier(),
                  lineHeight:
                    ((styles.subtitle.fontSize || 14) * getFontMultiplier()) *
                    1.3,
                },
              ]}
            >
              Tasks due soon
            </Text>
          </View>
        </View>

        {/* Empty State */}
        <TouchableOpacity
          onPress={onAddTask}
          activeOpacity={onAddTask ? 0.85 : 1}
          disabled={!onAddTask}
          accessibilityRole={onAddTask ? "button" : undefined}
          accessibilityLabel={
            onAddTask ? "All caught up. Add a task." : "All caught up."
          }
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
                  name={onAddTask ? "add-circle" : "checkmark-circle"}
                  size={32}
                  color={
                    isDark
                      ? "rgba(255, 255, 255, 0.7)"
                      : "rgba(15, 23, 42, 0.7)"
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
            {onAddTask ? "Tap to add a task" : "No tasks due right now"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[
        styles.header,
        isTablet && {
          paddingHorizontal: getResponsiveValue(
            DesignSystem.spacing.md,
            DesignSystem.spacing.lg,  // Comfortable padding on iPad (24px)
            DesignSystem.spacing.xl,  // Comfortable padding on iPad Pro (32px)
          ),
        },
      ]}>
        <View style={styles.headerLeft}>
          <Text
            style={[
              styles.title,
              {
                color: isDark
                  ? colors.text
                  : "rgba(15, 23, 42, 0.9)",
              },
              isTablet && {
                fontSize: (styles.title.fontSize || 20) * getFontMultiplier(),
                lineHeight:
                  ((styles.title.fontSize || 20) * getFontMultiplier()) * 1.2,
              },
            ]}
          >
            Up Next
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: isDark
                  ? "rgba(255, 255, 255, 0.65)"
                  : "rgba(15, 23, 42, 0.65)",
              },
              isTablet && {
                fontSize: (styles.subtitle.fontSize || 14) * getFontMultiplier(),
                lineHeight:
                  ((styles.subtitle.fontSize || 14) * getFontMultiplier()) *
                  1.3,
              },
            ]}
          >
            Tasks due soon
          </Text>
        </View>
        <View style={styles.headerRight}>
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
                isTablet && {
                  width: getResponsiveValue(40, 48, 52),
                  height: getResponsiveValue(40, 48, 52),
                  borderRadius: getResponsiveValue(20, 24, 26),
                },
              ]}
              onPress={scrollToPrevious}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
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
                isTablet && {
                  width: getResponsiveValue(40, 48, 52),
                  height: getResponsiveValue(40, 48, 52),
                  borderRadius: getResponsiveValue(20, 24, 26),
                },
              ]}
              onPress={scrollToNext}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-forward"
                size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
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
          snapToInterval={cardWidth + DesignSystem.spacing.md * 2}
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
                source_plan_id={task.source_plan_id}
                onComplete={onCompleteTask}
                onPress={onTaskPress}
                cardWidth={cardWidth}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingLeft: (screenWidth - cardWidth) / 2 - DesignSystem.spacing.md,
              paddingRight: (screenWidth - cardWidth) / 2 - DesignSystem.spacing.md,
            },
          ]}
          style={[
            styles.scrollView,
            isTablet && {
              height: getResponsiveValue(240, 280, 300), // Taller on iPad to accommodate taller cards
            },
          ]}
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
    marginTop: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
  },
  headerLeft: {
    flex: 1,
    paddingRight: DesignSystem.spacing.md,
  },
  title: {
    ...DesignSystem.typography.h3,
  },
  subtitle: {
    ...DesignSystem.typography.small,
    marginTop: DesignSystem.spacing.xs,
  },
  headerRight: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
    alignItems: "center",
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
    ...DesignSystem.shadows.softAmbient,
  },
  carouselContainer: {
    alignItems: "center",
  },
  scrollView: {
    height: 240, // Base height, will be overridden dynamically
  },
  scrollContent: {
    // Padding is now calculated dynamically based on cardWidth
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
    ...DesignSystem.shadows.softKey,
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
    ...DesignSystem.shadows.softAmbient,
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
