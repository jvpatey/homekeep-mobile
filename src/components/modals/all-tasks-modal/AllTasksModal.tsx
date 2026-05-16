import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useTasks } from "../../../context/TasksContext";
import { useGradients, useHaptics, useDevice } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import { GlassCard, SheetGrabber } from "../../ui";
import { PriorityBadge } from "../../Dashboard";
import { MaintenanceRoutine } from "../../../types/maintenance";
import { MaintenanceService } from "../../../services/maintenanceService";
import { styles } from "./styles";
import { getPlanTheme } from "../../../data/maintenancePlans/planThemes";

const { height: screenHeight } = Dimensions.get("window");

interface AllTasksModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AllTasksModal({ visible, onClose }: AllTasksModalProps) {
  const { colors, isDark } = useTheme();
  const { deleteTask, refreshTasks } = useTasks();
  const { haloGradient } = useGradients();
  const { triggerLight, triggerMedium } = useHaptics();
  const { isTablet, getFontMultiplier, getResponsiveValue, getTabletSheetContainerStyle } =
    useDevice();
  const fontMultiplier = getFontMultiplier();
  const [routines, setRoutines] = useState<MaintenanceRoutine[]>([]);
  const [, setLoading] = useState(false);
  const [deletingTasks, setDeletingTasks] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(visible);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(screenHeight);

  const loadRoutines = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await MaintenanceService.getMaintenanceRoutines();
      if (error) throw error;
      setRoutines(data || []);
    } catch (err) {
      console.error("Error loading routines:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      loadRoutines();
    }
  }, [visible, loadRoutines]);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, {
        duration: DesignSystem.motion.duration.fast,
        easing: DesignSystem.motion.easing.standard,
      });
      translateY.value = withSpring(0, DesignSystem.motion.spring.snappy);
    } else {
      opacity.value = withTiming(0, {
        duration: DesignSystem.motion.duration.fast,
        easing: DesignSystem.motion.easing.standard,
      });
      translateY.value = withTiming(
        screenHeight,
        {
          duration: DesignSystem.motion.duration.fast,
          easing: DesignSystem.motion.easing.standard,
        },
        (finished) => {
          if (finished) runOnJS(setMounted)(false);
        }
      );
    }
  }, [visible]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleClose = async () => {
    await triggerLight();
    onClose();
  };

  const handleDeleteRoutine = async (
    routineId: string,
    routineTitle: string
  ) => {
    if (deletingTasks.has(routineId)) return;

    await triggerMedium();
    Alert.alert(
      "Delete Task Series",
      `Are you sure you want to permanently delete "${routineTitle}"? This will remove the entire task series and all its instances.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingTasks((prev) => new Set(prev).add(routineId));
            try {
              const result = await deleteTask(routineId);
              if (result.success) {
                await triggerLight();
                setRoutines((prev) =>
                  prev.filter((routine) => routine.id !== routineId)
                );
                await refreshTasks();
              } else {
                Alert.alert(
                  "Delete Failed",
                  result.error ||
                    "Failed to delete the task series. Please try again."
                );
              }
            } catch (error) {
              console.error("Error deleting routine:", error);
              Alert.alert(
                "Delete Failed",
                "An unexpected error occurred. Please try again."
              );
            } finally {
              setDeletingTasks((prev) => {
                const next = new Set(prev);
                next.delete(routineId);
                return next;
              });
            }
          },
        },
      ]
    );
  };

  const formatCategory = (category: string) => {
    if (category === "HVAC") return "HVAC";
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  };

  const formatInterval = (intervalDays: number) => {
    if (intervalDays < 7)
      return `Every ${intervalDays} day${intervalDays !== 1 ? "s" : ""}`;
    if (intervalDays === 7) return "Weekly";
    if (intervalDays === 14) return "Bi-weekly";
    if (intervalDays === 30) return "Monthly";
    if (intervalDays === 90) return "Quarterly";
    if (intervalDays === 365) return "Yearly";
    const weeks = Math.round(intervalDays / 7);
    const months = Math.round(intervalDays / 30);
    if (intervalDays % 7 === 0 && weeks <= 8) {
      return `Every ${weeks} week${weeks !== 1 ? "s" : ""}`;
    }
    if (intervalDays % 30 === 0 && months <= 12) {
      return `Every ${months} month${months !== 1 ? "s" : ""}`;
    }
    return `Every ${intervalDays} days`;
  };

  const renderRoutineItem = ({ item }: { item: MaintenanceRoutine }) => {
    const isDeleting = deletingTasks.has(item.id);
    const planTheme = getPlanTheme(item.source_plan_id ?? undefined);

    return (
      <View
        key={item.id}
        style={[
          styles.taskItem,
          {
            backgroundColor: isDark
              ? "rgba(35, 37, 38, 0.4)"
              : "rgba(255, 255, 255, 0.4)",
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(255, 255, 255, 0.6)",
            ...(planTheme && {
              borderLeftWidth: 4,
              borderLeftColor: planTheme.primary,
            }),
          },
          isTablet && {
            padding: getResponsiveValue(16, 20, 24),
            marginBottom: getResponsiveValue(12, 16, 20),
            borderRadius: getResponsiveValue(12, 16, 20),
          },
        ]}
      >
        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text
              style={[
                styles.taskTitle,
                { color: colors.text },
                isTablet && {
                  fontSize: (styles.taskTitle.fontSize || 16) * fontMultiplier,
                  lineHeight:
                    (styles.taskTitle.fontSize || 16) * fontMultiplier * 1.3,
                },
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <PriorityBadge priority={item.priority} />
          </View>

          <View style={styles.taskDetails}>
            <Text
              style={[
                styles.taskCategory,
                { color: colors.textSecondary },
                isTablet && {
                  fontSize:
                    (styles.taskCategory.fontSize || 14) * fontMultiplier,
                },
              ]}
            >
              {formatCategory(item.category)}
            </Text>
            <Text
              style={[
                styles.taskInterval,
                { color: colors.textSecondary },
                isTablet && {
                  fontSize:
                    (styles.taskInterval.fontSize || 14) * fontMultiplier,
                },
              ]}
            >
              {formatInterval(item.interval_days)}
            </Text>
          </View>

          {item.estimated_duration_minutes ? (
            <Text
              style={[
                styles.taskDuration,
                { color: colors.textSecondary },
                isTablet && {
                  fontSize:
                    (styles.taskDuration.fontSize || 12) * fontMultiplier,
                },
              ]}
            >
              ~{item.estimated_duration_minutes} min
            </Text>
          ) : null}

          <View style={styles.routineStatus}>
            <Text
              style={[
                styles.statusText,
                { color: colors.textSecondary },
                isTablet && {
                  fontSize: (styles.statusText.fontSize || 12) * fontMultiplier,
                },
              ]}
            >
              {item.is_active ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            { backgroundColor: colors.error + "15" },
            isDeleting && styles.deletingButton,
            isTablet && {
              width: getResponsiveValue(40, 48, 52),
              height: getResponsiveValue(40, 48, 52),
              borderRadius: getResponsiveValue(20, 24, 26),
            },
          ]}
          onPress={() => handleDeleteRoutine(item.id, item.title)}
          disabled={isDeleting}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Delete task series ${item.title}`}
        >
          <Ionicons
            name={isDeleting ? "hourglass-outline" : "trash-outline"}
            size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
            color={colors.error}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View
      style={[
        styles.emptyState,
        isTablet && {
          paddingHorizontal: getResponsiveValue(32, 40, 48),
          paddingVertical: getResponsiveValue(64, 80, 96),
        },
      ]}
    >
      <Ionicons
        name="checkmark-circle-outline"
        size={isTablet ? getResponsiveValue(64, 80, 90) : 64}
        color={colors.textSecondary}
      />
      <Text
        style={[
          styles.emptyText,
          { color: colors.text },
          isTablet && {
            fontSize: (styles.emptyText.fontSize || 18) * fontMultiplier,
            lineHeight:
              (styles.emptyText.fontSize || 18) * fontMultiplier * 1.2,
          },
        ]}
      >
        No task series yet
      </Text>
      <Text
        style={[
          styles.emptySubtext,
          { color: colors.textSecondary },
          isTablet && {
            fontSize: (styles.emptySubtext.fontSize || 14) * fontMultiplier,
            lineHeight:
              (styles.emptySubtext.fontSize || 14) * fontMultiplier * 1.4,
          },
        ]}
      >
        Create your first maintenance task series to get started!
      </Text>
    </View>
  );

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <Pressable
          style={styles.backdropPressable}
          onPress={handleClose}
          accessibilityLabel="Dismiss"
        />
        <Animated.View
          style={[
            styles.sheetContainer,
            getTabletSheetContainerStyle(),
            animatedSheetStyle,
          ]}
          pointerEvents="auto"
        >
          <GlassCard
            material="thick"
            radius={DesignSystem.borders.radius.glass}
            containerStyle={styles.glassOuter}
            style={styles.glassInner}
          >
            <LinearGradient
              colors={[...haloGradient]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.haloFill}
              pointerEvents="none"
            />

            <SafeAreaView edges={["bottom"]} style={styles.sheetSafeArea}>
              <SheetGrabber />

              {/* Header */}
              <View
                style={[
                  styles.header,
                  {
                    borderBottomColor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.08)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.headerTitle,
                    { color: colors.text },
                    isTablet && {
                      fontSize:
                        (styles.headerTitle.fontSize || 20) * fontMultiplier,
                      lineHeight:
                        (styles.headerTitle.fontSize || 20) *
                        fontMultiplier *
                        1.2,
                    },
                  ]}
                >
                  All Task Series ({routines.length})
                </Text>
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    {
                      backgroundColor: isDark
                        ? "rgba(35, 37, 38, 0.55)"
                        : "rgba(255, 255, 255, 0.45)",
                      borderWidth: DesignSystem.borders.hairline,
                      borderColor: colors.glassStroke,
                    },
                    isTablet && {
                      width: getResponsiveValue(36, 44, 48),
                      height: getResponsiveValue(36, 44, 48),
                      borderRadius: getResponsiveValue(18, 22, 24),
                    },
                  ]}
                  onPress={handleClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons
                    name="close"
                    size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              {/* Scrollable list */}
              <FlatList
                style={styles.list}
                data={routines}
                keyExtractor={(item) => item.id}
                renderItem={renderRoutineItem}
                contentContainerStyle={[
                  styles.listContent,
                  isTablet && {
                    padding: getResponsiveValue(20, 28, 32),
                  },
                ]}
                showsVerticalScrollIndicator
                ListEmptyComponent={renderEmptyState}
              />
            </SafeAreaView>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
