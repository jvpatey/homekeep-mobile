import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { Task } from "../../types/task";

interface MonthCalendarProps {
  month: Date;
  selectedDate: Date;
  tasks: Task[];
  onSelectDate: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  disablePast?: boolean;
}

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function MonthCalendar({
  month,
  selectedDate,
  tasks,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  disablePast = false,
}: MonthCalendarProps) {
  const { colors, isDark } = useTheme();

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const currentMonthStart = startOfMonth(new Date());
  const prevDisabled =
    disablePast && monthStart.getTime() <= currentMonthStart.getTime();

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    days.push(d);
  }

  // Build markers map
  const markers: Record<string, string[]> = {};
  for (const t of tasks) {
    const key = dateKey(new Date(t.next_due_date));
    const arr = markers[key] || [];
    const colorMap: Record<string, string> = {
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
    const color = t.is_completed
      ? colors.textSecondary
      : colorMap[t.category] || colors.accent;
    if (arr.length < 3) arr.push(color);
    markers[key] = arr;
  }

  const header = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <TouchableOpacity
        onPress={prevDisabled ? undefined : onPrevMonth}
        disabled={prevDisabled}
        style={{ padding: 8, borderRadius: 8, opacity: prevDisabled ? 0.4 : 1 }}
        accessibilityLabel="Previous month"
        accessibilityState={{ disabled: prevDisabled }}
      >
        <Ionicons
          name="chevron-back"
          size={18}
          color={prevDisabled ? colors.textSecondary : colors.text}
        />
      </TouchableOpacity>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
        {format(month, "MMMM yyyy")}
      </Text>
      <TouchableOpacity
        onPress={onNextMonth}
        style={{ padding: 8, borderRadius: 8 }}
        accessibilityLabel="Next month"
      >
        <Ionicons name="chevron-forward" size={18} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  const todayChip = (
    <View
      style={{
        alignItems: "center",
        paddingHorizontal: 12,
        paddingBottom: 6,
      }}
    >
      <TouchableOpacity
        onPress={onToday}
        accessibilityLabel="Jump to today"
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 999,
          backgroundColor: isDark ? "#2A2A2A" : "#F0F2F4",
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Ionicons name="home" size={14} color={colors.text} />
        <Text style={{ color: colors.text, marginLeft: 6, fontSize: 12 }}>
          Today
        </Text>
      </TouchableOpacity>
    </View>
  );

  const weekdayRow = (
    <View
      style={{ flexDirection: "row", paddingHorizontal: 12, paddingBottom: 6 }}
    >
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
        <View key={w} style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{w}</Text>
        </View>
      ))}
    </View>
  );

  // Build weeks to avoid flexWrap hitbox shifts
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const grid = (
    <View style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
      {weeks.map((week, row) => (
        <View key={`w-${row}`} style={{ flexDirection: "row" }}>
          {week.map((d) => {
            const inMonth = isSameMonth(d, monthStart);
            const isSelected = isSameDay(d, selectedDate);
            const today = isToday(d);
            const key = dateKey(d);
            const dots = markers[key] || [];
            const baseTextColor = inMonth ? colors.text : colors.textSecondary;
            const past = disablePast && isBefore(d, startOfDay(new Date()));

            return (
              <TouchableOpacity
                key={key}
                onPress={() => {
                  if (!past) onSelectDate(d);
                }}
                activeOpacity={0.8}
                disabled={past}
                style={{ flex: 1, paddingHorizontal: 4, paddingVertical: 4 }}
              >
                <View
                  style={{
                    width: "100%",
                    aspectRatio: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 10,
                    backgroundColor: isSelected ? colors.accent : "transparent",
                    borderWidth: today && !isSelected ? 1 : 0,
                    borderColor:
                      today && !isSelected ? colors.secondary : "transparent",
                    opacity: past ? 0.45 : 1,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? "#ffffff" : baseTextColor,
                      fontWeight: isSelected ? "700" : "500",
                    }}
                  >
                    {format(d, "d")}
                  </Text>
                  <View style={{ flexDirection: "row", marginTop: 2 }}>
                    {dots.map((c, idx) => (
                      <View
                        key={`${key}-dot-${idx}`}
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          marginHorizontal: 1,
                          backgroundColor: isSelected ? "#ffffff" : c,
                          opacity: past ? 0.6 : 1,
                        }}
                      />
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );

  return (
    <View
      style={{
        marginHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark ? "#333333" : colors.border,
        backgroundColor: colors.surface,
        overflow: "hidden",
      }}
    >
      {header}
      {todayChip}
      {weekdayRow}
      {grid}
    </View>
  );
}
