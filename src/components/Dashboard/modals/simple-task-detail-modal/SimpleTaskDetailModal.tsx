import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MaintenanceTask } from "../../../../types/maintenance";
import { useTheme } from "../../../../context/ThemeContext";
import { useGradients, useDevice } from "../../../../hooks";
import { DesignSystem } from "../../../../theme/designSystem";
import { GlassCard } from "../../../ui/glass-card/GlassCard";
import { SheetGrabber } from "../../../ui/sheet-grabber";
import { sheetChromeStyles, createContentStyles } from "./styles";

interface SimpleTaskDetailModalProps {
  task: MaintenanceTask | null;
  visible: boolean;
  onClose: () => void;
  onComplete: (instanceId: string) => void;
  onEdit?: (task: MaintenanceTask) => void;
  /** Reserved for callers that refresh after external edits */
  onModified?: () => void;
}

export function SimpleTaskDetailModal({
  task,
  visible,
  onClose,
  onComplete,
  onEdit,
}: SimpleTaskDetailModalProps) {
  const { colors, isDark } = useTheme();
  const { haloGradient, ctaHighlight } = useGradients();
  const { height: windowHeight } = useWindowDimensions();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const fontMultiplier = getFontMultiplier();
  const [isCompleting, setIsCompleting] = useState(false);

  const contentStyles = createContentStyles(
    {
      glass: colors.glass,
      glassBorder: colors.glassBorder,
      text: colors.text,
      textSecondary: colors.textSecondary,
    },
    isTablet
  );

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(windowHeight);
  const contentOpacity = useSharedValue(0);

  const sheetTabletMaxWidth = isTablet
    ? getResponsiveValue(500, 640, 720)
    : undefined;
  const sheetMaxHeight = windowHeight * 0.9;

  const motionFast = DesignSystem.motion.duration.fast;
  const motionEasing = DesignSystem.motion.easing.standard;

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const openSheet = useCallback(() => {
    translateY.value = windowHeight;
    opacity.value = 0;
    contentOpacity.value = 0;
    opacity.value = withTiming(1, {
      duration: motionFast,
      easing: motionEasing,
    });
    translateY.value = withSpring(0, DesignSystem.motion.spring.snappy);
    contentOpacity.value = withDelay(
      DesignSystem.motion.stagger,
      withTiming(1, {
        duration: DesignSystem.motion.duration.base,
        easing: motionEasing,
      })
    );
  }, [
    contentOpacity,
    motionEasing,
    motionFast,
    opacity,
    translateY,
    windowHeight,
  ]);

  useEffect(() => {
    if (visible && task) {
      setIsCompleting(false);
      openSheet();
    }
  }, [visible, task?.instance_id, openSheet, task]);

  const handleClose = () => {
    contentOpacity.value = withTiming(0, {
      duration: motionFast,
      easing: motionEasing,
    });
    opacity.value = withTiming(0, {
      duration: motionFast,
      easing: motionEasing,
    });
    translateY.value = withTiming(
      windowHeight,
      {
        duration: motionFast,
        easing: motionEasing,
      },
      (finished) => {
        if (finished) runOnJS(onClose)();
      }
    );
  };

  const getCategoryInfo = (category: string) => {
    const categoryMap: Record<
      string,
      { icon: string; gradient: [string, string]; displayName: string }
    > = {
      HVAC: {
        icon: "snow-outline",
        gradient: ["#FF6B6B", "#FF8E8E"],
        displayName: "HVAC",
      },
      PLUMBING: {
        icon: "water-outline",
        gradient: ["#4ECDC4", "#6EDDD6"],
        displayName: "Plumbing",
      },
      ELECTRICAL: {
        icon: "flash-outline",
        gradient: ["#FFE66D", "#FFF08C"],
        displayName: "Electrical",
      },
      APPLIANCES: {
        icon: "hardware-chip-outline",
        gradient: ["#A8E6CF", "#C8F0D9"],
        displayName: "Appliances",
      },
      EXTERIOR: {
        icon: "home-outline",
        gradient: ["#FF9A8B", "#FFB3A8"],
        displayName: "Exterior",
      },
      INTERIOR: {
        icon: "bed-outline",
        gradient: ["#B8E0D2", "#D0E8DD"],
        displayName: "Interior",
      },
      LANDSCAPING: {
        icon: "leaf-outline",
        gradient: ["#95E1D3", "#B0E8DD"],
        displayName: "Landscaping",
      },
      SAFETY: {
        icon: "shield-checkmark-outline",
        gradient: ["#F38181", "#F5A0A0"],
        displayName: "Safety",
      },
      GENERAL: {
        icon: "construct-outline",
        gradient: ["#C7CEEA", "#D8E0F0"],
        displayName: "General",
      },
    };

    return (
      categoryMap[category] || {
        icon: "construct-outline",
        gradient: ["#C7CEEA", "#D8E0F0"] as [string, string],
        displayName: category,
      }
    );
  };

  const priorityColors = {
    low: colors.success,
    medium: colors.warning,
    high: colors.accent,
    urgent: colors.error,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return "No time estimate";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatInterval = (intervalDays: number) => {
    if (intervalDays === 7) return "Weekly";
    if (intervalDays === 30) return "Monthly";
    if (intervalDays === 90) return "Quarterly";
    if (intervalDays === 365) return "Yearly";
    if (intervalDays === 1) return "Daily";
    if (intervalDays < 7) return `Every ${intervalDays} days`;
    if (intervalDays < 30) return `Every ${Math.round(intervalDays / 7)} weeks`;
    if (intervalDays < 365)
      return `Every ${Math.round(intervalDays / 30)} months`;
    return `Every ${Math.round(intervalDays / 365)} years`;
  };

  const handleComplete = async () => {
    if (!task || isCompleting) return;
    setIsCompleting(true);
    try {
      await onComplete(task.instance_id);
      handleClose();
    } catch (error) {
      console.error("Error completing task:", error);
      setIsCompleting(false);
    }
  };

  const mutedSurface = {
    backgroundColor: isDark
      ? "rgba(35, 37, 38, 0.45)"
      : "rgba(255, 255, 255, 0.55)",
    borderColor: isDark
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(255, 255, 255, 0.55)",
  };

  const scrollChromeOverhead =
    DesignSystem.spacing.sm +
    4 +
    DesignSystem.spacing.md * 2 +
    56 +
    DesignSystem.spacing.lg +
    DesignSystem.spacing.xl +
    120;
  const scrollViewportMaxHeight = Math.max(
    240,
    sheetMaxHeight - scrollChromeOverhead - 140
  );

  if (!task) return null;

  const category = getCategoryInfo(task.category);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <Animated.View
        style={[sheetChromeStyles.sheetOverlay, backdropAnimatedStyle]}
      >
        <Pressable
          style={sheetChromeStyles.backdropPressable}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss task details"
        />
        <Animated.View
          pointerEvents="box-none"
          style={[
            sheetChromeStyles.sheetContainer,
            sheetTabletMaxWidth != null && {
              maxWidth: sheetTabletMaxWidth,
              alignSelf: "center",
            },
            { maxHeight: sheetMaxHeight },
            sheetAnimatedStyle,
          ]}
        >
          <GlassCard
            material="thick"
            radius={DesignSystem.borders.radius.glass}
            containerStyle={sheetChromeStyles.sheetGlassOuter}
            style={sheetChromeStyles.sheetGlassInner}
          >
            <LinearGradient
              colors={[...haloGradient]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[
                sheetChromeStyles.gradientBackground,
                { maxHeight: sheetMaxHeight },
                isTablet && {
                  paddingHorizontal: getResponsiveValue(
                    DesignSystem.spacing.lg,
                    DesignSystem.spacing.xl,
                    DesignSystem.spacing.xl + DesignSystem.spacing.md
                  ),
                },
              ]}
            >
              <SafeAreaView
                edges={["bottom"]}
                style={sheetChromeStyles.sheetSafeArea}
              >
                <SheetGrabber />
                <View style={sheetChromeStyles.sheetTitleRow}>
                  <View style={sheetChromeStyles.sheetTitleSideSpacer} />
                  <Pressable style={sheetChromeStyles.sheetTitlePressable}>
                    <Text
                      style={[
                        sheetChromeStyles.modalTitle,
                        { color: colors.text },
                        isTablet && {
                          fontSize:
                            (sheetChromeStyles.modalTitle.fontSize ||
                              DesignSystem.typography.h2.fontSize) *
                            fontMultiplier,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      Task details
                    </Text>
                  </Pressable>
                  <TouchableOpacity
                    style={[
                      sheetChromeStyles.sheetCloseButton,
                      {
                        backgroundColor: isDark
                          ? "rgba(35, 37, 38, 0.55)"
                          : "rgba(255, 255, 255, 0.45)",
                        borderWidth: DesignSystem.borders.hairline,
                        borderColor: colors.glassStroke,
                      },
                    ]}
                    onPress={handleClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <Ionicons
                      name="close"
                      size={isTablet ? getResponsiveValue(22, 26, 28) : 22}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                </View>

                <Animated.View
                  style={[contentAnimatedStyle, sheetChromeStyles.scrollSection]}
                >
                  <ScrollView
                    style={{ maxHeight: scrollViewportMaxHeight }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingBottom: DesignSystem.spacing.md,
                    }}
                    bounces={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={
                      Platform.OS === "ios" ? "interactive" : "on-drag"
                    }
                  >
                    <Text
                      style={[contentStyles.taskTitle, { color: colors.text }]}
                    >
                      {task.title}
                    </Text>

                    <View style={contentStyles.metaRow}>
                      <View
                        style={[
                          contentStyles.categoryChip,
                          mutedSurface,
                        ]}
                      >
                        <LinearGradient
                          colors={category.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={contentStyles.categoryIconWrap}
                        >
                          <Ionicons
                            name={category.icon as any}
                            size={isTablet ? 18 : 16}
                            color="#fff"
                          />
                        </LinearGradient>
                        <Text
                          style={[
                            contentStyles.categoryLabel,
                            { color: colors.text },
                          ]}
                        >
                          {category.displayName}
                        </Text>
                      </View>
                      <View
                        style={[contentStyles.priorityPill, mutedSurface]}
                      >
                        <View
                          style={[
                            contentStyles.priorityDot,
                            {
                              backgroundColor:
                                priorityColors[task.priority],
                            },
                          ]}
                        />
                        <Text
                          style={[
                            contentStyles.priorityText,
                            { color: colors.text },
                          ]}
                        >
                          {task.priority.charAt(0).toUpperCase() +
                            task.priority.slice(1)}{" "}
                          priority
                        </Text>
                      </View>
                    </View>

                    {task.description ? (
                      <View style={contentStyles.section}>
                        <Text
                          style={[
                            contentStyles.sectionTitle,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Notes
                        </Text>
                        <Text
                          style={[
                            contentStyles.descriptionText,
                            { color: colors.text },
                          ]}
                        >
                          {task.description}
                        </Text>
                      </View>
                    ) : null}

                    <Text
                      style={[
                        contentStyles.sectionTitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Schedule
                    </Text>
                    <View style={[contentStyles.detailCard, mutedSurface]}>
                      <View
                        style={[
                          contentStyles.detailIconBox,
                          {
                            backgroundColor: isDark
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(0,0,0,0.04)",
                            borderColor: colors.glassStroke,
                          },
                        ]}
                      >
                        <Ionicons
                          name="time-outline"
                          size={22}
                          color={colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            contentStyles.detailLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Estimated time
                        </Text>
                        <Text
                          style={[
                            contentStyles.detailValue,
                            { color: colors.text },
                          ]}
                        >
                          {formatTime(task.estimated_duration_minutes)}
                        </Text>
                      </View>
                    </View>

                    <View style={[contentStyles.detailCard, mutedSurface]}>
                      <View
                        style={[
                          contentStyles.detailIconBox,
                          {
                            backgroundColor: isDark
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(0,0,0,0.04)",
                            borderColor: colors.glassStroke,
                          },
                        ]}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={22}
                          color={colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            contentStyles.detailLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Due
                        </Text>
                        <Text
                          style={[
                            contentStyles.detailValue,
                            { color: colors.text },
                          ]}
                        >
                          {formatDate(task.due_date)}
                        </Text>
                      </View>
                    </View>

                    <View style={[contentStyles.detailCard, mutedSurface]}>
                      <View
                        style={[
                          contentStyles.detailIconBox,
                          {
                            backgroundColor: isDark
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(0,0,0,0.04)",
                            borderColor: colors.glassStroke,
                          },
                        ]}
                      >
                        <Ionicons
                          name="repeat-outline"
                          size={22}
                          color={colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            contentStyles.detailLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Recurrence
                        </Text>
                        <Text
                          style={[
                            contentStyles.detailValue,
                            { color: colors.text },
                          ]}
                        >
                          {formatInterval(task.interval_days)}
                        </Text>
                      </View>
                    </View>
                  </ScrollView>

                  <View
                    style={[
                      contentStyles.actionsRow,
                      {
                        borderTopColor: colors.border,
                        paddingBottom: DesignSystem.spacing.sm,
                      },
                    ]}
                  >
                    {onEdit ? (
                      <TouchableOpacity
                        style={[
                          contentStyles.secondaryButton,
                          {
                            borderColor: colors.glassStroke,
                            backgroundColor: isDark
                              ? "rgba(35, 37, 38, 0.35)"
                              : "rgba(255, 255, 255, 0.45)",
                          },
                        ]}
                        onPress={() => onEdit(task)}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="Edit task"
                      >
                        <Ionicons
                          name="create-outline"
                          size={22}
                          color={colors.text}
                        />
                        <Text
                          style={[
                            DesignSystem.typography.bodySemiBold,
                            { color: colors.text },
                          ]}
                        >
                          Edit
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={[
                        contentStyles.primaryButton,
                        {
                          position: "relative",
                          backgroundColor: colors.primary,
                          opacity: isCompleting ? 0.65 : 1,
                        },
                      ]}
                      onPress={() => void handleComplete()}
                      disabled={isCompleting}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Mark task complete"
                    >
                      <LinearGradient
                        colors={ctaHighlight}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                        pointerEvents="none"
                      />
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#fff"
                      />
                      <Text style={contentStyles.primaryButtonLabel}>
                        {isCompleting ? "Completing…" : "Complete"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </SafeAreaView>
            </LinearGradient>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
