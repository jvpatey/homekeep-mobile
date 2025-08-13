import React, { useMemo, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Modal } from "react-native";
// Replacing library calendar with custom MonthCalendar for robust theming
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { Task } from "../../types/task";
import { TaskDetailModal } from "../Dashboard/TaskDetailModal/TaskDetailModal";
import { EditTaskModal } from "../Dashboard/CreateTaskModal/EditTaskModal";
import { MonthCalendar } from "./MonthCalendar";
import { styles as dashboardStyles } from "../Dashboard/styles";

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function CalendarView() {
  const { colors, isDark } = useTheme();
  const { tasks } = useTasks();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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

  const tasksForSelectedDate = useMemo(() => {
    const key = formatDateKey(selectedDate);
    return tasks.filter(
      (t) => formatDateKey(new Date(t.next_due_date)) === key
    );
  }, [tasks, selectedDate]);

  const onSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

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
    <View style={{ flex: 1 }}>
      <View style={[dashboardStyles.summaryContainer, { marginBottom: 8 }]}>
        <Text style={[dashboardStyles.sectionTitle, { color: colors.text }]}>
          Upcoming Tasks
        </Text>
      </View>
      <MonthCalendar
        month={new Date(visibleMonth.year, visibleMonth.month - 1, 1)}
        selectedDate={selectedDate}
        tasks={tasksInVisibleMonth}
        onSelectDate={onSelectDate}
        onPrevMonth={() =>
          setVisibleMonth((m) => ({
            year: new Date(m.year, m.month - 2, 1).getFullYear(),
            month: new Date(m.year, m.month - 2, 1).getMonth() + 1,
          }))
        }
        onNextMonth={() =>
          setVisibleMonth((m) => ({
            year: new Date(m.year, m.month, 1).getFullYear(),
            month: new Date(m.year, m.month, 1).getMonth() + 1,
          }))
        }
        onToday={() => {
          const now = new Date();
          setVisibleMonth({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          });
          setSelectedDate(now);
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
          <Text
            style={{ color: colors.textSecondary, marginLeft: 6, fontSize: 14 }}
          >
            {selectedDate.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
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
  );
}
