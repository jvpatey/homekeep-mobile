import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../context/ThemeContext";
import { useHaptics } from "../../../hooks";
import { AppStackParamList } from "../../../navigation/types";

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

interface FilteredTasksHeaderProps {
  title: string;
  taskCount: number;
  onMarkAllComplete?: () => void;
}

// FilteredTasksHeader - Features header with title, task count, and mark all complete button
export function FilteredTasksHeader({
  title,
  taskCount,
  onMarkAllComplete,
}: FilteredTasksHeaderProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { triggerLight } = useHaptics();

  return (
    <View style={[styles.header, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          triggerLight();
          navigation.goBack();
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.headerContent}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {taskCount} {taskCount === 1 ? "task" : "tasks"}
        </Text>
      </View>

      {taskCount > 0 && onMarkAllComplete && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onMarkAllComplete}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-done" size={20} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = {
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  actionButton: {
    padding: 8,
  },
};
