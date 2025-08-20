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
import { colors } from "../../theme/colors";
import { DesignSystem } from "../../theme/designSystem";
import TaskCard from "./TaskCard";
import { Task } from "../../types/task";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth - 80; // 40px padding on each side

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
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
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
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={tasks}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH}
          snapToAlignment="center"
          decelerationRate="fast"
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 50,
          }}
          renderItem={({ item: task }) => (
            <View style={styles.cardContainer}>
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
