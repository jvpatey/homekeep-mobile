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
import TaskCard from "./TaskCard";
import { MaintenanceTask } from "../../types/maintenance";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth - 80; // 40px padding on each side

interface HeroCarouselProps {
  tasks: MaintenanceTask[];
  onCompleteTask: (instanceId: string) => void;
  onTaskPress?: (instanceId: string) => void;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({
  tasks,
  onCompleteTask,
  onTaskPress,
}) => {
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Animation for empty state
  const iconScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);

  React.useEffect(() => {
    if (tasks.length === 0) {
      // Subtle breathing animation for empty state
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 2000 }),
          withTiming(1, { duration: 2000 })
        ),
        -1,
        true
      );

      // Gentle rotation
      iconRotation.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 3000 }),
          withTiming(-5, { duration: 3000 })
        ),
        -1,
        true
      );
    }
  }, [tasks.length]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5, // This ensures the item is centered
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
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={["#F0F9FF", "#E0F2FE"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyGradient}
        >
          <View style={styles.emptyIconContainer}>
            <LinearGradient
              colors={["#0891B2", "#0EA5E9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconBackground}
            >
              <Animated.View style={[styles.emptyIcon, iconAnimatedStyle]}>
                <Ionicons name="checkmark-circle" size={32} color="white" />
              </Animated.View>
            </LinearGradient>
          </View>
          <Text style={[styles.emptyTitle, { color: "#0C4A6E" }]}>
            All Caught Up!
          </Text>
          <Text style={[styles.emptySubtitle, { color: "#0891B2" }]}>
            No tasks due right now
          </Text>
        </LinearGradient>
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
          renderItem={({ item: task }) => (
            <View style={styles.cardContainer}>
              <TaskCard
                id={task.id}
                instance_id={task.instance_id}
                title={task.title}
                category={task.category as any}
                priority={task.priority}
                estimated_duration_minutes={task.estimated_duration_minutes}
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
};

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
    height: 160,
    marginVertical: DesignSystem.spacing.md,
    marginHorizontal: DesignSystem.spacing.md,
  },
  emptyGradient: {
    flex: 1,
    borderRadius: DesignSystem.borders.radius.large,
    justifyContent: "center",
    alignItems: "center",
    padding: DesignSystem.spacing.md, // Reduced from lg to md for more compact appearance
    ...DesignSystem.shadows.medium,
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  emptyIconBackground: {
    flex: 1,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
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
    marginTop: DesignSystem.spacing.md,
    textAlign: "center",
    fontWeight: "700",
  },
  emptySubtitle: {
    ...DesignSystem.typography.body,
    marginTop: DesignSystem.spacing.xs,
    textAlign: "center",
    opacity: 0.9,
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

export default HeroCarousel;
