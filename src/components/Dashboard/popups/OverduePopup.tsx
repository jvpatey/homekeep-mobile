import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ListRenderItem,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "../../../theme/designSystem";
import { MaintenanceTask, PRIORITIES } from "../../../types/maintenance";
import { useTheme } from "../../../context/ThemeContext";
import { useDevice, useGradients } from "../../../hooks";
import { GlassCard } from "../../ui/glass-card/GlassCard";
import { formControlFill } from "../modals/create-task-modal/formChrome";
import { hexWithAlpha } from "./popupChrome";
import { formatDueDate } from "../utils";

export interface OverduePopupProps {
  tasks: MaintenanceTask[];
  onClose: () => void;
  onTaskPress: (instanceId: string) => void;
}

export function OverduePopup({
  tasks,
  onClose,
  onTaskPress,
}: OverduePopupProps) {
  const { colors, isDark } = useTheme();
  const { haloGradient } = useGradients();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();

  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: DesignSystem.motion.duration.fast,
      easing: DesignSystem.motion.easing.standard,
    });
    scale.value = withSpring(1, DesignSystem.motion.spring.snappy);
    translateY.value = withTiming(0, {
      duration: DesignSystem.motion.duration.fast,
      easing: DesignSystem.motion.easing.standard,
    });
    contentOpacity.value = withDelay(
      DesignSystem.motion.stagger,
      withTiming(1, {
        duration: DesignSystem.motion.duration.base,
        easing: DesignSystem.motion.easing.standard,
      })
    );
  }, [contentOpacity, opacity, scale, translateY]);

  const handleClose = () => {
    opacity.value = withTiming(0, {
      duration: DesignSystem.motion.duration.fast,
      easing: DesignSystem.motion.easing.standard,
    });
    scale.value = withTiming(0.96, {
      duration: DesignSystem.motion.duration.fast,
      easing: DesignSystem.motion.easing.standard,
    });
    translateY.value = withTiming(20, {
      duration: DesignSystem.motion.duration.fast,
      easing: DesignSystem.motion.easing.standard,
    });
    setTimeout(onClose, DesignSystem.motion.duration.fast);
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const renderItem: ListRenderItem<MaintenanceTask> = ({ item }) => {
    const priorityInfo =
      PRIORITIES[item.priority as keyof typeof PRIORITIES] ??
      PRIORITIES.medium;

    return (
      <TouchableOpacity
        style={[
          styles.row,
          {
            backgroundColor: formControlFill(isDark),
            borderColor: colors.glassStroke,
          },
        ]}
        onPress={() => {
          onTaskPress(item.instance_id);
        }}
        activeOpacity={0.75}
      >
        <View style={styles.rowHeader}>
          <View
            style={[
              styles.urgencyDot,
              { backgroundColor: colors.error, shadowColor: colors.error },
            ]}
          />
          <Text
            style={[
              styles.rowTitle,
              { color: colors.text },
              isTablet && {
                fontSize: 17 * getFontMultiplier(),
              },
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
        </View>
        <Text
          style={[
            styles.rowMeta,
            { color: colors.textSecondary },
            isTablet && { fontSize: 14 * getFontMultiplier() },
          ]}
        >
          Due {formatDueDate(item.due_date)} · {priorityInfo.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.overlayContainer}>
      <TouchableOpacity
        style={styles.overlay}
        onPress={handleClose}
        activeOpacity={1}
      />
      <Animated.View
        style={[
          styles.container,
          containerAnimatedStyle,
          {
            borderRadius: DesignSystem.borders.radius.glass,
            overflow: "hidden",
          },
          isTablet && {
            maxWidth: getResponsiveValue(420, 560, 640),
          },
        ]}
        pointerEvents="box-none"
      >
        <GlassCard
          material="thick"
          radius={DesignSystem.borders.radius.glass}
          containerStyle={{ width: "100%" }}
          style={{ overflow: "hidden" }}
        >
          <LinearGradient
            colors={[...haloGradient]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[
              styles.gradientBackground,
              { position: "relative" },
              isTablet && {
                padding: getResponsiveValue(
                  DesignSystem.spacing.lg,
                  DesignSystem.spacing.xl,
                  DesignSystem.spacing.xl + DesignSystem.spacing.md,
                ),
              },
            ]}
          >
            <LinearGradient
              pointerEvents="none"
              colors={[
                hexWithAlpha(colors.error, isDark ? 0.22 : 0.14),
                hexWithAlpha(colors.primary, isDark ? 0.12 : 0.07),
                hexWithAlpha(colors.primary, isDark ? 0.06 : 0.04),
              ]}
              locations={[0, 0.48, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.popupAtmosphere}
            />
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDark
                    ? "rgba(35, 37, 38, 0.55)"
                    : "rgba(255, 255, 255, 0.45)",
                  borderRadius: 20,
                  borderWidth: DesignSystem.borders.hairline,
                  borderColor: colors.glassStroke,
                },
              ]}
              onPress={handleClose}
            >
              <Ionicons
                name="close"
                size={isTablet ? getResponsiveValue(22, 26, 28) : 22}
                color={colors.text}
              />
            </TouchableOpacity>

            <Animated.View style={[styles.content, contentAnimatedStyle]}>
              <View style={styles.headerRow}>
                <View
                  style={[
                    styles.headerIconWrap,
                    {
                      backgroundColor: hexWithAlpha(
                        colors.error,
                        isDark ? 0.22 : 0.12
                      ),
                      borderColor: hexWithAlpha(
                        colors.error,
                        isDark ? 0.45 : 0.3
                      ),
                    },
                  ]}
                >
                  <Ionicons
                    name="alert-circle"
                    size={isTablet ? getResponsiveValue(28, 32, 36) : 28}
                    color={colors.error}
                  />
                </View>
                <View style={styles.headerText}>
                  <Text
                    style={[
                      styles.title,
                      { color: colors.text },
                      isTablet && {
                        fontSize:
                          (DesignSystem.typography.h3.fontSize || 20) *
                          getFontMultiplier(),
                      },
                    ]}
                  >
                    Overdue
                  </Text>
                  <Text
                    style={[
                      styles.subtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {tasks.length === 0
                      ? "Nothing overdue right now."
                      : `${tasks.length} task${
                          tasks.length === 1 ? "" : "s"
                        } to catch up on.`}
                  </Text>
                </View>
              </View>

              {tasks.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons
                    name="checkmark-circle"
                    size={48}
                    color={colors.success}
                  />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    All caught up
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={tasks}
                  keyExtractor={(t) => t.instance_id}
                  renderItem={renderItem}
                  style={styles.list}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </Animated.View>
          </LinearGradient>
        </GlassCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    width: "88%",
    maxWidth: 380,
    maxHeight: "72%",
  },
  gradientBackground: {
    padding: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.xl + 8,
  },
  popupAtmosphere: {
    ...StyleSheet.absoluteFill,
  },
  closeButton: {
    position: "absolute",
    top: DesignSystem.spacing.md,
    right: DesignSystem.spacing.md,
    zIndex: 2,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: DesignSystem.spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignSystem.spacing.md,
    paddingRight: 44,
  },
  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: DesignSystem.borders.hairline,
  },
  headerText: {
    flex: 1,
    gap: DesignSystem.spacing.xs,
  },
  title: {
    ...DesignSystem.typography.h3,
  },
  subtitle: {
    ...DesignSystem.typography.body,
  },
  list: {
    maxHeight: 360,
  },
  listContent: {
    paddingBottom: DesignSystem.spacing.sm,
    gap: DesignSystem.spacing.sm,
  },
  row: {
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: DesignSystem.borders.hairline,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignSystem.spacing.sm,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  rowTitle: {
    ...DesignSystem.typography.bodySemiBold,
    flex: 1,
    fontSize: 16,
  },
  rowMeta: {
    ...DesignSystem.typography.caption,
    marginTop: DesignSystem.spacing.xs,
    marginLeft: 8 + DesignSystem.spacing.sm,
  },
  empty: {
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.xl,
    gap: DesignSystem.spacing.sm,
  },
  emptyTitle: {
    ...DesignSystem.typography.bodySemiBold,
  },
});
