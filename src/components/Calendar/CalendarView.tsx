import React, { useMemo, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Modal } from "react-native";
// Replacing library calendar with custom MonthCalendar for robust theming
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { TaskService } from "../../services/taskService";
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

interface CalendarViewProps {
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function CalendarView({
  searchQuery = "",
  onClearSearch,
}: CalendarViewProps) {
  const { colors, isDark } = useTheme();
  const { tasks, upcomingTasks, overdueTasks, completedTasks } = useTasks();
  const [monthInstances, setMonthInstances] = useState<Task[]>([]);

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

  // Recurrence helpers to project occurrences within the current month
  const advanceByRecurrence = useCallback((recurrence: string, from: Date) => {
    const d = new Date(from);
    switch (recurrence) {
      case "weekly":
        d.setDate(d.getDate() + 7);
        return d;
      case "monthly":
        d.setMonth(d.getMonth() + 1);
        return d;
      case "quarterly":
        d.setMonth(d.getMonth() + 3);
        return d;
      case "yearly":
        d.setFullYear(d.getFullYear() + 1);
        return d;
      default:
        d.setDate(d.getDate() + 7);
        return d;
    }
  }, []);

  const monthRange = useMemo(() => {
    const start = new Date(
      visibleMonth.year,
      visibleMonth.month - 1,
      1,
      0,
      0,
      0,
      0
    );
    const end = new Date(
      visibleMonth.year,
      visibleMonth.month,
      0,
      23,
      59,
      59,
      999
    );
    return { start, end };
  }, [visibleMonth]);

  const reloadMonthInstances = useCallback(async () => {
    const { data } = await TaskService.getInstancesInRange(
      monthRange.start.toISOString(),
      monthRange.end.toISOString(),
      true
    );
    setMonthInstances(data || []);
  }, [monthRange.start.getTime(), monthRange.end.getTime()]);

  React.useEffect(() => {
    reloadMonthInstances();
  }, [reloadMonthInstances, upcomingTasks, overdueTasks, completedTasks]);

  const tasksInVisibleMonth = useMemo(() => {
    // De-duplicate within month by (task_id, due_date)
    const seen = new Set<string>();
    const deduped: Task[] = [];
    for (const t of monthInstances) {
      const key = `${t.id}|${new Date(t.next_due_date).toISOString()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(t);
      }
    }
    return deduped;
  }, [monthInstances]);

  const tasksForSelectedDate = useMemo(() => {
    const key = formatDateKey(selectedDate);
    return monthInstances.filter(
      (t) => formatDateKey(new Date(t.next_due_date)) === key
    );
  }, [monthInstances, selectedDate]);

  const allInstances = useMemo(() => {
    const list = [...upcomingTasks, ...overdueTasks, ...completedTasks];
    const seen = new Set<string>();
    const deduped: Task[] = [];
    for (const t of list) {
      const key = `${t.instance_id || t.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(t);
      }
    }
    return deduped.sort(
      (a, b) =>
        new Date(a.next_due_date).getTime() -
        new Date(b.next_due_date).getTime()
    );
  }, [upcomingTasks, overdueTasks, completedTasks]);

  const filteredBySearch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as Task[];
    return allInstances
      .filter((t) => {
        const inTitle = t.title.toLowerCase().includes(q);
        const inDesc = (t.description || "").toLowerCase().includes(q);
        const inCategory = t.category.toLowerCase().includes(q);
        return inTitle || inDesc || inCategory;
      })
      .sort(
        (a, b) =>
          new Date(a.next_due_date).getTime() -
          new Date(b.next_due_date).getTime()
      );
  }, [allInstances, searchQuery]);

  const onSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleTaskPress = (taskKey: string) => {
    setSelectedTaskId(taskKey);
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
        onPress={() => handleTaskPress(item.instance_id || item.id)}
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
      {searchQuery.trim().length === 0 && (
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
          disablePast
        />
      )}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, flex: 1 }}>
        {searchQuery.trim().length > 0 ? (
          <>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text style={{ color: colors.textSecondary }}>
                {filteredBySearch.length} result
                {filteredBySearch.length === 1 ? "" : "s"}
              </Text>
              {filteredBySearch.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    const first = filteredBySearch[0];
                    const d = new Date(first.next_due_date);
                    setVisibleMonth({
                      year: d.getFullYear(),
                      month: d.getMonth() + 1,
                    });
                    setSelectedDate(d);
                    onClearSearch?.();
                  }}
                  activeOpacity={0.7}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 10,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "600" }}>
                    Show calendar
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filteredBySearch}
              keyExtractor={(t) => t.instance_id || t.id}
              renderItem={renderTaskItem}
              contentContainerStyle={{ paddingBottom: 24 }}
            />
          </>
        ) : tasksForSelectedDate.length === 0 ? (
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
            keyExtractor={(t) => t.instance_id || t.id}
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
              // Ensure calendar month view refreshes immediately after edits
              reloadMonthInstances();
            }}
          />
        </Modal>
      )}
    </View>
  );
}
