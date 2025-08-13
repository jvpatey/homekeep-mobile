import React, { useMemo, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Modal } from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { PaperProvider } from "react-native-paper";
import { useTheme } from "../context/ThemeContext";
import { useTasks } from "../context/TasksContext";
import { useDynamicSpacing } from "../hooks";
import { Task } from "../types/task";
import { TaskDetailModal } from "../components/Dashboard/TaskDetailModal/TaskDetailModal";
import { EditTaskModal } from "../components/Dashboard/CreateTaskModal/EditTaskModal";
import { DashboardHeader } from "../components/Dashboard/DashboardHeader";

function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function CalendarScreen() {
  const { colors } = useTheme();
  const { tasks } = useTasks();
  const { dynamicTopSpacing, dynamicBottomSpacing } = useDynamicSpacing();

  const [selectedDate, setSelectedDate] = useState<string>(
    formatISODate(new Date())
  );
  const [visibleMonth, setVisibleMonth] = useState<{
    year: number;
    month: number;
  }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const tasksInVisibleMonth = useMemo(() => {
    const { year, month } = visibleMonth;
    return tasks.filter((t) => {
      const dt = new Date(t.next_due_date);
      return dt.getFullYear() === year && dt.getMonth() + 1 === month;
    });
  }, [tasks, visibleMonth]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    for (const task of tasksInVisibleMonth) {
      const dt = new Date(task.next_due_date);
      const key = formatISODate(dt);
      const color = task.is_completed ? colors.textSecondary : colors.primary;
      if (!marks[key]) {
        marks[key] = { marked: true, dots: [{ color }], customStyles: {} };
      } else {
        const dots = marks[key].dots || [];
        if (dots.length < 3) dots.push({ color });
        marks[key].dots = dots;
      }
    }
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: colors.accent,
    };
    return marks;
  }, [tasksInVisibleMonth, selectedDate, colors]);

  const tasksForSelectedDate = useMemo(() => {
    return tasks.filter(
      (t) => formatISODate(new Date(t.next_due_date)) === selectedDate
    );
  }, [tasks, selectedDate]);

  const onDayPress = useCallback((day: { dateString: string }) => {
    setSelectedDate(day.dateString);
  }, []);

  const onMonthChange = useCallback(
    (month: { year: number; month: number }) => {
      setVisibleMonth({ year: month.year, month: month.month });
    },
    []
  );

  const handleTaskPress = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskDetailVisible(true);
  };

  const handleCloseTaskDetail = () => {
    setTaskDetailVisible(false);
    setSelectedTaskId(null);
  };

  const handleEditTask = (task: Task) => {
    setTaskDetailVisible(false);
    setSelectedTaskId(null);
    setEditingTask(task);
    setEditModalVisible(true);
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const categoryColorMap: { [key: string]: string } = {
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
    const badgeColor = categoryColorMap[item.category] || colors.primary;
    return (
      <TouchableOpacity
        onPress={() => handleTaskPress(item.id)}
        activeOpacity={0.7}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 12,
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 10,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: badgeColor,
            marginRight: 10,
          }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>
            {item.title}
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 2 }}>
            {item.category === "hvac" || item.category === "HVAC"
              ? "HVAC"
              : item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            {item.is_recurring && item.recurrence_type
              ? ` • ${item.recurrence_type}`
              : ""}
          </Text>
        </View>
        {item.is_completed ? (
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        ) : (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textSecondary}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <PaperProvider>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: dynamicTopSpacing,
          paddingBottom: dynamicBottomSpacing,
        }}
      >
        <DashboardHeader mode="calendar" />
        <Calendar
          onDayPress={onDayPress}
          onMonthChange={onMonthChange}
          markedDates={markedDates}
          markingType="multi-dot"
          theme={{
            backgroundColor: colors.background,
            calendarBackground: colors.surface,
            textSectionTitleColor: colors.textSecondary,
            selectedDayBackgroundColor: colors.accent,
            selectedDayTextColor: "#ffffff",
            todayTextColor: colors.secondary,
            dayTextColor: colors.text,
            textDisabledColor: colors.textSecondary,
            monthTextColor: colors.text,
            arrowColor: colors.text,
          }}
          style={{
            marginHorizontal: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        />
        <View style={{ paddingHorizontal: 16, paddingTop: 16, flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Ionicons name="calendar" size={18} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, marginLeft: 6 }}>
              {selectedDate}
            </Text>
          </View>
          {tasksForSelectedDate.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 24 }}>
              <Ionicons
                name="clipboard-outline"
                size={36}
                color={colors.textSecondary}
              />
              <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
                No tasks on this day
              </Text>
            </View>
          ) : (
            <FlatList
              data={tasksForSelectedDate}
              keyExtractor={(t) => t.id}
              renderItem={renderTaskItem}
              contentContainerStyle={{ paddingBottom: 24 }}
            />
          )}
        </View>

        <TaskDetailModal
          taskId={selectedTaskId}
          visible={taskDetailVisible}
          onClose={handleCloseTaskDetail}
          onEdit={handleEditTask}
        />

        {editingTask && (
          <Modal
            visible={editModalVisible}
            onRequestClose={() => {
              setEditModalVisible(false);
              setEditingTask(null);
            }}
            animationType="slide"
            presentationStyle="pageSheet"
          >
            <EditTaskModal
              task={editingTask}
              onClose={() => {
                setEditModalVisible(false);
                setEditingTask(null);
              }}
              onTaskUpdated={() => {
                setEditModalVisible(false);
                setEditingTask(null);
              }}
            />
          </Modal>
        )}
      </View>
    </PaperProvider>
  );
}
