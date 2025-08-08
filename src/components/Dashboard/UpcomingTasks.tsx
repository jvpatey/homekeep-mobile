import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useSimpleAnimation, useHaptics } from "../../hooks";
import { useTasks } from "../../context/TasksContext";
import { AppStackParamList } from "../../navigation/types";
import { TaskDetailModal } from "./TaskDetailModal";
import { PriorityBadge } from "./PriorityBadge";
import { SwipeableTaskItem } from "./FilteredTasks/SwipeableTaskItem";
import { Task } from "../../types/task";
import { styles } from "./styles";

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

// UpcomingTasks Features proper touch targets, category indicators, and navigation

export function UpcomingTasks() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { triggerLight, triggerMedium } = useHaptics();
  const tasksHook = useTasks();
  const { upcomingTasks, loading, deleteTask } = tasksHook;
  const listAnimatedStyle = useSimpleAnimation(600, 600, 20);

  // Task detail modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("all");

  const getCategoryColor = (category: string): string => {
    const categoryColors: { [key: string]: string } = {
      // Handle both lowercase (stored in DB) and uppercase (display) versions
      hvac: "#FF6B6B",
      HVAC: "#FF6B6B",
      exterior: "#4ECDC4",
      Exterior: "#4ECDC4",
      safety: "#FFA726",
      Safety: "#FFA726",
      plumbing: "#9B59B6",
      Plumbing: "#9B59B6",
      electrical: "#3498DB",
      Electrical: "#3498DB",
      appliances: "#2ECC71",
      Appliances: "#2ECC71",
    };
    return categoryColors[category] || colors.primary;
  };

  const formatDueDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const handleTaskPress = (taskId: string) => {
    triggerLight();
    const task = upcomingTasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setTaskDetailVisible(true);
    }
  };

  const handleCloseTaskDetail = () => {
    setTaskDetailVisible(false);
    setSelectedTask(null);
  };

  const handleEditTask = (task: Task) => {
    // TODO: Implement edit functionality
    console.log("Edit task:", task.id);
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    triggerMedium();
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${taskTitle}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => triggerLight(),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            triggerMedium();
            const { success, error } = await deleteTask(taskId);
            if (!success) {
              Alert.alert("Error", error || "Failed to delete task");
            }
          },
        },
      ]
    );
  };

  // Filter tasks based on active tab
  const getFilteredTasks = () => {
    let filtered = [...upcomingTasks];

    if (activeTab !== "all") {
      filtered = filtered.filter(
        (task) => task.priority.toLowerCase() === activeTab
      );
    }

    // Sort by due date (earliest first)
    return filtered.sort(
      (a, b) =>
        new Date(a.next_due_date).getTime() -
        new Date(b.next_due_date).getTime()
    );
  };

  const filteredTasks = getFilteredTasks();

  // Tab configuration
  const tabs = [
    { id: "all", label: "All", count: upcomingTasks.length },
    {
      id: "high",
      label: "High",
      count: upcomingTasks.filter((t) => t.priority.toLowerCase() === "high")
        .length,
    },
    {
      id: "medium",
      label: "Medium",
      count: upcomingTasks.filter((t) => t.priority.toLowerCase() === "medium")
        .length,
    },
    {
      id: "low",
      label: "Low",
      count: upcomingTasks.filter((t) => t.priority.toLowerCase() === "low")
        .length,
    },
  ];

  const renderTaskItem = ({ item: task }: { item: Task }) => (
    <SwipeableTaskItem
      task={task}
      onPress={handleTaskPress}
      onDelete={handleDeleteTask}
      getCategoryColor={getCategoryColor}
      formatDueDate={formatDueDate}
    />
  );

  const TabBar = () => (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && { backgroundColor: colors.primary },
          ]}
          onPress={() => {
            triggerLight();
            setActiveTab(tab.id);
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === tab.id ? "white" : colors.textSecondary },
            ]}
          >
            {tab.label}
          </Text>
          {tab.count > 0 && (
            <View
              style={[
                styles.tabBadge,
                {
                  backgroundColor:
                    activeTab === tab.id
                      ? "rgba(255, 255, 255, 0.2)"
                      : colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  { color: activeTab === tab.id ? "white" : "white" },
                ]}
              >
                {tab.count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const ListHeader = () => (
    <View>
      <View style={styles.listHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Upcoming Tasks
        </Text>
      </View>
      <TabBar />
    </View>
  );

  const EmptyState = () => {
    const getEmptyMessage = () => {
      if (activeTab === "all") {
        return {
          title: "No upcoming tasks",
          subtitle: "Tap the + button to create your first task",
        };
      } else {
        const priorityLabel =
          activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
        return {
          title: `No ${priorityLabel} priority tasks`,
          subtitle: `All your ${activeTab} priority tasks are completed`,
        };
      }
    };

    const message = getEmptyMessage();

    return (
      <View
        style={{
          alignItems: "center",
          paddingVertical: 40,
          paddingHorizontal: 20,
        }}
      >
        <Ionicons
          name="clipboard-outline"
          size={48}
          color={colors.textSecondary}
          style={{
            marginBottom: 16,
            opacity: 0.6,
          }}
        />
        <Text
          style={[
            {
              fontSize: 18,
              fontWeight: "600",
              marginBottom: 8,
              textAlign: "center",
            },
            { color: colors.textSecondary },
          ]}
        >
          {message.title}
        </Text>
        <Text
          style={[
            {
              fontSize: 16,
              fontWeight: "400",
              textAlign: "center",
              opacity: 0.8,
            },
            { color: colors.textSecondary },
          ]}
        >
          {message.subtitle}
        </Text>
      </View>
    );
  };

  return (
    <>
      <Animated.View style={[styles.upcomingContainer, listAnimatedStyle]}>
        <FlatList
          data={filteredTasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyState}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 4, // Extra padding for shadows
            paddingBottom: 8, // Bottom padding for shadows
          }}
        />
      </Animated.View>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        visible={taskDetailVisible}
        onClose={handleCloseTaskDetail}
        onEdit={handleEditTask}
      />
    </>
  );
}
