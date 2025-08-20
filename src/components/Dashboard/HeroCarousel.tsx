import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";
import { DesignSystem } from "../../theme/designSystem";
import TaskCard from "./TaskCard";
import { Task } from "../../types/task";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth - DesignSystem.spacing.md * 2;
const CARD_SPACING = DesignSystem.spacing.md;
const VISIBLE_CARDS = 1.2; // Show 1 full card + 20% of next

interface HeroCarouselProps {
  tasks: Task[];
  onCompleteTask: (taskId: string) => void;
  onTaskPress?: (taskId: string) => void;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({
  tasks,
  onCompleteTask,
  onTaskPress,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = useCallback((event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (CARD_WIDTH + CARD_SPACING));
    setCurrentIndex(index);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    if (scrollViewRef.current) {
      const offset = index * (CARD_WIDTH + CARD_SPACING);
      scrollViewRef.current.scrollTo({ x: offset, animated: true });
    }
  }, []);

  const scrollToNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % tasks.length;
    scrollToIndex(nextIndex);
  }, [currentIndex, tasks.length, scrollToIndex]);

  const scrollToPrevious = useCallback(() => {
    const prevIndex = currentIndex === 0 ? tasks.length - 1 : currentIndex - 1;
    scrollToIndex(prevIndex);
  }, [currentIndex, tasks.length, scrollToIndex]);

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={["#F0F0F0", "#E0E0E0"]}
          style={styles.emptyGradient}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={48}
            color={colors.light.textSecondary}
          />
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptySubtitle}>No tasks due right now</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>What's Next</Text>
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={scrollToPrevious}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={colors.light.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={scrollToNext}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.light.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        snapToAlignment="center"
        decelerationRate="fast"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Duplicate first few items at the end for infinite scroll */}
        {[...tasks.slice(-2), ...tasks, ...tasks.slice(0, 2)].map(
          (task, index) => {
            const inputRange = [
              (index - 2) * (CARD_WIDTH + CARD_SPACING),
              (index - 1) * (CARD_WIDTH + CARD_SPACING),
              index * (CARD_WIDTH + CARD_SPACING),
              (index + 1) * (CARD_WIDTH + CARD_SPACING),
            ];

            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.8, 0.9, 1, 0.9],
              extrapolate: "clamp",
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 0.7, 1, 0.7],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={`${task.id}-${index}`}
                style={[
                  styles.cardContainer,
                  {
                    transform: [{ scale }],
                    opacity,
                  },
                ]}
              >
                <TaskCard
                  id={task.id}
                  title={task.title}
                  category={task.category as any}
                  priority={task.priority}
                  estimatedDuration={task.estimated_duration}
                  dueDate={task.next_due_date}
                  isCompleted={task.is_completed}
                  onComplete={onCompleteTask}
                  onPress={onTaskPress}
                />
              </Animated.View>
            );
          }
        )}
      </ScrollView>

      {/* Pagination Dots */}
      {tasks.length > 1 && (
        <View style={styles.paginationContainer}>
          {tasks.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}

      {/* Task Counter */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
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
    color: colors.light.text,
  },
  navigationButtons: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light.surface,
    justifyContent: "center",
    alignItems: "center",
    ...DesignSystem.shadows.small,
  },
  scrollView: {
    height: 220, // TaskCard height + some padding
  },
  scrollContent: {
    paddingHorizontal: DesignSystem.spacing.md,
  },
  cardContainer: {
    marginRight: DesignSystem.spacing.md,
  },
  emptyContainer: {
    height: 200,
    marginVertical: DesignSystem.spacing.lg,
    marginHorizontal: DesignSystem.spacing.md,
  },
  emptyGradient: {
    flex: 1,
    borderRadius: DesignSystem.borders.radius.large,
    justifyContent: "center",
    alignItems: "center",
    ...DesignSystem.shadows.medium,
  },
  emptyTitle: {
    ...DesignSystem.typography.h3,
    color: colors.light.text,
    marginTop: DesignSystem.spacing.md,
  },
  emptySubtitle: {
    ...DesignSystem.typography.body,
    color: colors.light.textSecondary,
    marginTop: DesignSystem.spacing.xs,
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
    backgroundColor: colors.light.border,
  },
  paginationDotActive: {
    backgroundColor: colors.light.primary,
    width: 24,
  },
  counterContainer: {
    alignItems: "center",
    marginTop: DesignSystem.spacing.sm,
  },
  counterText: {
    ...DesignSystem.typography.caption,
    color: colors.light.textSecondary,
  },
});

export default HeroCarousel;
