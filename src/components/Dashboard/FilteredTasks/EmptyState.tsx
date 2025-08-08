import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";

interface EmptyStateProps {
  filterType: string;
  title: string;
}

// EmptyState - Features empty state message for filtered tasks
export function EmptyState({ filterType, title }: EmptyStateProps) {
  const { colors } = useTheme();

  const getEmptyMessage = () => {
    if (filterType === "overdue") {
      return {
        title: "No overdue tasks",
        subtitle: "Great job! You're all caught up.",
      };
    } else {
      return {
        title: `No ${title.toLowerCase()} tasks`,
        subtitle: "All tasks in this category are completed.",
      };
    }
  };

  const message = getEmptyMessage();

  return (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="checkmark-circle-outline"
        size={64}
        color={colors.textSecondary}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {message.title}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {message.subtitle}
      </Text>
    </View>
  );
}

const styles = {
  emptyContainer: {
    alignItems: "center" as const,
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 8,
    textAlign: "center" as const,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center" as const,
    opacity: 0.8,
  },
};
