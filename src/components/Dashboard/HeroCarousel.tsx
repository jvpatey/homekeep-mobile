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

// HeroCarouselProps interface for the HeroCarousel component
interface HeroCarouselProps {
  tasks: MaintenanceTask[];
  onCompleteTask: (instanceId: string) => void;
  onTaskPress?: (instanceId: string) => void;
}

// HeroCarousel component for the Dashboard
export function HeroCarousel({
  tasks,
  onCompleteTask,
  onTaskPress,
}: HeroCarouselProps) {
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.emptyIconContainer}>
          <View
            style={[
              styles.emptyIconBackground,
              {
                backgroundColor: colors.background,
                borderColor: colors.primary,
              },
            ]}
          >
            <View style={styles.emptyIcon}>
              <Ionicons
                name="checkmark-circle"
                size={32}
                color={colors.primary}
              />
            </View>
          </View>
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          All Caught Up!
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          No tasks due right now
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>What's Next</Text>
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.surface }]}
            onPress={scrollToPrevious}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.surface }]}
            onPress={scrollToNext}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={tasks}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
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
                { backgroundColor: colors.border },
                index === currentIndex && [
                  styles.paginationDotActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
            />
          ))}
        </View>
      )}

      {/* Task Counter */}
      <View style={styles.counterContainer}>
        <Text style={[styles.counterText, { color: colors.textSecondary }]}>
          {currentIndex + 1} of {tasks.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: DesignSystem.spacing.lg,
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
    ...DesignSystem.shadows.small,
  },
  carouselContainer: {
    alignItems: "center",
  },
  scrollView: {
    height: 240,
  },
  scrollContent: {
    paddingLeft: (screenWidth - CARD_WIDTH) / 2,
    paddingRight: (screenWidth - CARD_WIDTH) / 2,
  },
  cardContainer: {
    alignItems: "center",
  },
  emptyContainer: {
    height: 180,
    marginVertical: DesignSystem.spacing.lg,
    marginHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.xl,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    marginTop: DesignSystem.spacing.md,
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
    marginTop: DesignSystem.spacing.sm,
  },
  counterText: {
    ...DesignSystem.typography.caption,
  },
});
