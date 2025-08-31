import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../hooks/useTasks";
import { useNavigation } from "@react-navigation/native";
import { AppStackParamList } from "../../navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { completionHistoryStyles } from "./styles";
import { GroupedRoutine, groupTasksByRoutine, formatDate } from "./utils";

export function CompletionHistoryScreen() {
  const { colors } = useTheme();
  const { completedTasks, tasks } = useTasks();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [groupedRoutines, setGroupedRoutines] = useState<GroupedRoutine[]>([]);
  const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    setGroupedRoutines(groupTasksByRoutine(completedTasks));
  }, [completedTasks]);

  const toggleRoutineExpansion = (routineId: string) => {
    const newExpanded = new Set(expandedRoutines);
    if (newExpanded.has(routineId)) {
      newExpanded.delete(routineId);
    } else {
      newExpanded.add(routineId);
    }
    setExpandedRoutines(newExpanded);
  };

  const renderProgressIndicator = (routine: GroupedRoutine) => {
    return (
      <View style={completionHistoryStyles.progressContainer}>
        <View style={completionHistoryStyles.progressBar}>
          <View style={completionHistoryStyles.progressBarBackground}>
            <View
              style={[
                completionHistoryStyles.progressBarFill,
                {
                  width: `${Math.min(routine.totalInstances * 5, 100)}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        </View>
        <View style={completionHistoryStyles.progressStats}>
          <View style={completionHistoryStyles.progressStat}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text
              style={[
                completionHistoryStyles.progressText,
                { color: colors.textSecondary },
              ]}
            >
              {routine.totalInstances} completed
            </Text>
          </View>
          {routine.intervalDays > 0 && (
            <View style={completionHistoryStyles.progressStat}>
              <Ionicons name="refresh" size={16} color={colors.textSecondary} />
              <Text
                style={[
                  completionHistoryStyles.progressText,
                  { color: colors.textSecondary },
                ]}
              >
                Every {routine.intervalDays} days
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderRoutineItem = ({ item }: { item: GroupedRoutine }) => {
    const isExpanded = expandedRoutines.has(item.routineId);

    return (
      <View
        style={[
          completionHistoryStyles.routineItem,
          { backgroundColor: colors.surface },
        ]}
      >
        {/* Routine Header */}
        <TouchableOpacity
          style={completionHistoryStyles.routineHeader}
          onPress={() => toggleRoutineExpansion(item.routineId)}
          activeOpacity={0.7}
        >
          <View style={completionHistoryStyles.routineHeaderLeft}>
            <Text
              style={[
                completionHistoryStyles.routineTitle,
                { color: colors.text },
              ]}
            >
              {item.title}
            </Text>
            <View
              style={[
                completionHistoryStyles.categoryBadge,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text
                style={[
                  completionHistoryStyles.categoryText,
                  { color: colors.primary },
                ]}
              >
                {item.category}
              </Text>
            </View>
          </View>

          <View style={completionHistoryStyles.routineHeaderRight}>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Progress Indicator */}
        {renderProgressIndicator(item)}

        {/* Last Completion */}
        <View style={completionHistoryStyles.lastCompletion}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text
            style={[
              completionHistoryStyles.lastCompletionText,
              { color: colors.textSecondary },
            ]}
          >
            Last completed:{" "}
            {item.latestCompletion ? formatDate(item.latestCompletion) : "N/A"}
          </Text>
        </View>

        {/* Expandable Instance Details */}
        {isExpanded && (
          <View style={completionHistoryStyles.instanceDetails}>
            <Text
              style={[
                completionHistoryStyles.instanceTitle,
                { color: colors.text },
              ]}
            >
              Completion History
            </Text>
            {item.completedInstances.map((instance, index) => (
              <View
                key={instance.instance_id}
                style={completionHistoryStyles.instanceItem}
              >
                <View style={completionHistoryStyles.instanceHeader}>
                  <Text
                    style={[
                      completionHistoryStyles.instanceDate,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {formatDate(instance.completed_at || "")}
                  </Text>
                  <View style={completionHistoryStyles.instancePriority}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#10B981"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={completionHistoryStyles.emptyState}>
      <Ionicons
        name="checkmark-circle-outline"
        size={64}
        color={colors.textSecondary}
      />
      <Text
        style={[
          completionHistoryStyles.emptyStateTitle,
          { color: colors.text },
        ]}
      >
        No completed tasks yet
      </Text>
      <Text
        style={[
          completionHistoryStyles.emptyStateSubtitle,
          { color: colors.textSecondary },
        ]}
      >
        Complete your first task to see it here!
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        completionHistoryStyles.container,
        { backgroundColor: colors.background },
      ]}
    >
      {/* Hero Header */}
      <View style={completionHistoryStyles.heroSection}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={completionHistoryStyles.heroGradient}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={completionHistoryStyles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color={colors.surface} />
          </TouchableOpacity>

          {/* Header Content */}
          <View style={completionHistoryStyles.heroContent}>
            <Text
              style={[
                completionHistoryStyles.heroTitle,
                { color: colors.surface },
              ]}
            >
              Completion History
            </Text>
            <Text
              style={[
                completionHistoryStyles.heroSubtitle,
                { color: colors.surface },
              ]}
            >
              {groupedRoutines.length} routines completed
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Routines List */}
      <FlatList
        data={groupedRoutines}
        renderItem={renderRoutineItem}
        keyExtractor={(item) => item.routineId}
        contentContainerStyle={completionHistoryStyles.routinesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}
