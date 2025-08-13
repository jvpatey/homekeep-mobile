import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { Task } from "../../types/task";
import { TaskItem } from "./TaskItem";

interface StackedTaskItemProps {
  groupKey: string;
  items: Task[];
  expanded?: boolean;
  onToggle?: (key: string) => void;
  onPressTask: (taskId: string) => void;
  onDeleteTask: (taskId: string, title: string) => void;
  onComplete?: (taskId: string) => void;
  onUncomplete?: (taskId: string) => void;
  getCategoryColor: (category: string) => string;
  formatDueDate: (dateString: string) => string;
}

export function StackedTaskItem({
  groupKey,
  items,
  expanded: expandedProp = false,
  onToggle,
  onPressTask,
  onDeleteTask,
  onComplete,
  onUncomplete,
  getCategoryColor,
  formatDueDate,
}: StackedTaskItemProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(expandedProp);
  const first = items
    .slice()
    .sort(
      (a, b) =>
        new Date(a.next_due_date).getTime() -
        new Date(b.next_due_date).getTime()
    )[0];
  const count = items.length;

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    onToggle?.(groupKey);
  };

  if (!first) return null;

  // Collapsed: show a single summary tile with a count badge and next dates preview
  if (!expanded) {
    const previewDates = items
      .slice()
      .sort(
        (a, b) =>
          new Date(a.next_due_date).getTime() -
          new Date(b.next_due_date).getTime()
      )
      .slice(0, 3)
      .map((t) => formatDueDate(t.next_due_date));

    return (
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.8}
        style={{
          paddingVertical: 16,
          paddingHorizontal: 20,
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "600" }}>
            {first.title}
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
            {first.category === "hvac" ? "HVAC" : first.category}
            {first.is_recurring && first.recurrence_type
              ? ` • ${first.recurrence_type}`
              : ""}
            {previewDates.length > 0 ? ` • ${previewDates.join(", ")}` : ""}
          </Text>
        </View>
        <View
          style={{
            minWidth: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>{count}</Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    );
  }

  // Expanded: render all children using TaskItem
  return (
    <View style={{ marginBottom: 8 }}>
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.8}
        style={{
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 12,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>
          {first.title} • {count}
        </Text>
        <Ionicons name={"chevron-up"} size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      {items
        .slice()
        .sort(
          (a, b) =>
            new Date(a.next_due_date).getTime() -
            new Date(b.next_due_date).getTime()
        )
        .map((task, idx) => (
          <TaskItem
            key={task.id}
            task={task}
            onPress={onPressTask}
            onDelete={onDeleteTask}
            onComplete={onComplete}
            onUncomplete={onUncomplete}
            getCategoryColor={getCategoryColor}
            formatDueDate={formatDueDate}
            showDeleteButton={true}
          />
        ))}
    </View>
  );
}
