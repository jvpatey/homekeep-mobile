import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  LayoutChangeEvent,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useDevice, useHaptics } from "../../hooks";
import { ProfileMenu } from "./profile";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { AppStackParamList } from "../../navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { headerStyles } from "./styles";
import { DesignSystem } from "../../theme/designSystem";
import { DashboardHomeTile, DashboardWeatherTile } from "./tiles";

interface DashboardHeaderProps {
  userName: string;
  greeting: string;
  dueSoonCount: number;
  completedCount: number;
  overdueCount: number;
  onRefresh?: () => void;
  onShowDueSoonPopup: () => void;
  onShowOverduePopup: () => void;
  onOpenEquipmentManuals?: () => void;
  onOpenAddressEditor: () => void;
}

const COLLAPSE_STORAGE_KEY = "@homekeep/dashboard_header_collapsed";

export function DashboardHeader({
  userName,
  greeting,
  dueSoonCount,
  completedCount,
  overdueCount,
  onRefresh,
  onShowDueSoonPopup,
  onShowOverduePopup,
  onOpenEquipmentManuals,
  onOpenAddressEditor,
}: DashboardHeaderProps) {
  const { colors, isDark } = useTheme();
  const { isTablet, getResponsiveValue, width, height } = useDevice();
  const { triggerLight } = useHaptics();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  /** Matches ProfileMenu header avatar (hit target + tablet scaling). */
  const headerAvatarSize = isTablet ? getResponsiveValue(44, 52, 56) : 44;
  const heroFontMultiplier = isTablet
    ? Math.max(width, height) > 1300
      ? 1.5
      : 1.35
    : 1;
  const statsFontMultiplier = isTablet
    ? Math.max(width, height) > 1300
      ? 1.65
      : 1.5
    : 1;

  // Spring animations for greeting, username, and profile icon
  const greetOpacity = useSharedValue(0);
  const greetTranslateY = useSharedValue(12);
  const nameOpacity = useSharedValue(0);
  const nameTranslateY = useSharedValue(12);
  const profileOpacity = useSharedValue(0);
  const profileScale = useSharedValue(0.8);
  const profileTranslateY = useSharedValue(10);
  const statsOpacity = useSharedValue(0);
  const statsTranslateY = useSharedValue(15);
  const statsScale = useSharedValue(0.95);

  // Collapse animation: 1 = expanded, 0 = collapsed.
  const [collapsed, setCollapsed] = useState(false);
  const collapseProgress = useSharedValue(1);
  /** Natural height of the inner content, captured via onLayout. We can't
   * animate to "auto" so we interpolate against the measured value. */
  const contentHeight = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(COLLAPSE_STORAGE_KEY);
        if (cancelled) return;
        const isCollapsed = stored === "true";
        setCollapsed(isCollapsed);
        collapseProgress.value = isCollapsed ? 0 : 1;
      } catch {
        // ignore — default to expanded
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [collapseProgress]);

  const handleContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const measured = event.nativeEvent.layout.height;
      if (measured > 0) {
        contentHeight.value = measured;
      }
    },
    [contentHeight],
  );

  const triggerHeaderAnimations = useCallback(() => {
    greetOpacity.value = 0;
    greetTranslateY.value = 12;
    nameOpacity.value = 0;
    nameTranslateY.value = 12;
    profileOpacity.value = 0;
    profileScale.value = 0.8;
    profileTranslateY.value = 10;
    statsOpacity.value = 0;
    statsTranslateY.value = 15;
    statsScale.value = 0.95;

    const d = DesignSystem.motion.duration.base;
    const fast = DesignSystem.motion.duration.fast;
    const s = DesignSystem.motion.stagger;

    greetOpacity.value = withDelay(
      s,
      withTiming(1, {
        duration: d,
        easing: DesignSystem.motion.easing.standard,
      }),
    );
    greetTranslateY.value = withDelay(
      s,
      withTiming(0, {
        duration: d,
        easing: DesignSystem.motion.easing.standard,
      }),
    );

    nameOpacity.value = withDelay(
      s * 2,
      withTiming(1, {
        duration: d,
        easing: DesignSystem.motion.easing.standard,
      }),
    );
    nameTranslateY.value = withDelay(
      s * 2,
      withTiming(0, {
        duration: d,
        easing: DesignSystem.motion.easing.standard,
      }),
    );

    profileOpacity.value = withDelay(
      s,
      withTiming(1, {
        duration: fast,
        easing: DesignSystem.motion.easing.standard,
      }),
    );
    profileScale.value = withDelay(
      s,
      withSpring(1, DesignSystem.motion.spring.smooth),
    );
    profileTranslateY.value = withDelay(
      s,
      withTiming(0, {
        duration: fast,
        easing: DesignSystem.motion.easing.standard,
      }),
    );

    statsOpacity.value = withDelay(
      s * 3,
      withTiming(1, {
        duration: d,
        easing: DesignSystem.motion.easing.standard,
      }),
    );
    statsTranslateY.value = withDelay(
      s * 3,
      withTiming(0, {
        duration: d,
        easing: DesignSystem.motion.easing.standard,
      }),
    );
    statsScale.value = withDelay(
      s * 3,
      withSpring(1, DesignSystem.motion.spring.smooth),
    );
  }, [
    greetOpacity,
    greetTranslateY,
    nameOpacity,
    nameTranslateY,
    profileOpacity,
    profileScale,
    profileTranslateY,
    statsOpacity,
    statsTranslateY,
    statsScale,
  ]);

  useEffect(() => {
    triggerHeaderAnimations();
  }, [triggerHeaderAnimations]);

  useFocusEffect(
    useCallback(() => {
      triggerHeaderAnimations();
    }, [triggerHeaderAnimations]),
  );

  const greetAnimatedStyle = useAnimatedStyle(() => ({
    opacity: greetOpacity.value,
    transform: [{ translateY: greetTranslateY.value }],
  }));

  const nameAnimatedStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameTranslateY.value }],
  }));

  const profileAnimatedStyle = useAnimatedStyle(() => ({
    opacity: profileOpacity.value,
    transform: [
      { scale: profileScale.value },
      { translateY: profileTranslateY.value },
    ],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [
      { translateY: statsTranslateY.value },
      { scale: statsScale.value },
    ],
  }));

  const collapsibleStyle = useAnimatedStyle(() => {
    const measured = contentHeight.value;
    const progress = collapseProgress.value;

    if (measured > 0) {
      return {
        height: progress * measured,
        opacity: progress,
      };
    }

    // Restored collapsed state before onLayout: avoid flashing at full height.
    // Expanded + unmeasured still uses natural height so we can measure.
    if (progress <= 0) {
      return { height: 0, opacity: 0 };
    }

    return {
      height: undefined,
      opacity: 1,
    };
  });

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(collapseProgress.value, [0, 1], [0, 180])}deg` },
    ],
  }));

  const handleToggleCollapse = useCallback(async () => {
    await triggerLight();
    const next = !collapsed;
    setCollapsed(next);
    collapseProgress.value = withTiming(next ? 0 : 1, {
      duration: DesignSystem.motion.duration.base,
      easing: DesignSystem.motion.easing.standard,
    });
    try {
      await AsyncStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "true" : "false");
    } catch {
      // best-effort persistence
    }
  }, [collapsed, collapseProgress, triggerLight]);

  return (
    <View
      style={[
        headerStyles.headerSection,
        {
          marginBottom: 0,
          backgroundColor: colors.background,
        },
      ]}
    >
      <View
        style={[
          headerStyles.headerGradient,
          { backgroundColor: colors.background },
        ]}
      >
        <View
          style={[
            headerStyles.contentLayer,
            isTablet && {
              paddingHorizontal: getResponsiveValue(
                DesignSystem.spacing.md,
                DesignSystem.spacing.lg,
                DesignSystem.spacing.xl,
              ),
            },
          ]}
        >
          <Animated.View
            style={[headerStyles.headerTopBar, profileAnimatedStyle]}
          >
            <Image
              source={require("../../../assets/images/homekeep-logo.png")}
              style={{
                width: headerAvatarSize,
                height: headerAvatarSize,
              }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
              accessible
              accessibilityRole="image"
              accessibilityLabel="HomeKeep"
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: DesignSystem.spacing.sm,
              }}
            >
              {onOpenEquipmentManuals ? (
                <TouchableOpacity
                  onPress={onOpenEquipmentManuals}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    minWidth: headerAvatarSize,
                    minHeight: headerAvatarSize,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Open equipment manuals"
                >
                  <Ionicons
                    name="book-outline"
                    size={isTablet ? getResponsiveValue(24, 26, 28) : 24}
                    color={isDark ? colors.text : "rgba(15, 23, 42, 0.85)"}
                  />
                </TouchableOpacity>
              ) : null}
              <ProfileMenu onRefresh={onRefresh} navigation={navigation} />
            </View>
          </Animated.View>

          <View style={headerStyles.headerContent}>
            <View style={headerStyles.greetingContainer}>
              <Animated.Text
                style={[
                  headerStyles.greeting,
                  {
                    color: isDark ? colors.text : "rgba(15, 23, 42, 0.9)",
                  },
                  greetAnimatedStyle,
                  isTablet && {
                    fontSize:
                      headerStyles.greeting.fontSize * heroFontMultiplier,
                    lineHeight:
                      headerStyles.greeting.fontSize * heroFontMultiplier * 1.2,
                  },
                ]}
              >
                {greeting}
              </Animated.Text>
              <Animated.View style={nameAnimatedStyle}>
                <Text
                  style={[
                    headerStyles.userName,
                    { color: colors.accent },
                    isTablet && {
                      fontSize:
                        headerStyles.userName.fontSize * heroFontMultiplier,
                      lineHeight:
                        headerStyles.userName.fontSize *
                        heroFontMultiplier *
                        1.2,
                    },
                  ]}
                >
                  {userName}
                </Text>
              </Animated.View>

              <TouchableOpacity
                onPress={handleToggleCollapse}
                style={[
                  headerStyles.collapseToggle,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.06)"
                      : "rgba(15, 23, 42, 0.05)",
                  },
                ]}
                hitSlop={{ top: 6, bottom: 6, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel={
                  collapsed
                    ? "Expand dashboard summary"
                    : "Collapse dashboard summary"
                }
              >
                <Text
                  style={[
                    headerStyles.collapseToggleText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {collapsed ? "Show summary" : "Hide summary"}
                </Text>
                <Animated.View style={chevronStyle}>
                  <Ionicons
                    name="chevron-up"
                    size={14}
                    color={colors.textSecondary}
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>

            <Animated.View
              style={[
                headerStyles.collapsibleSection,
                { alignSelf: "stretch" },
                collapsibleStyle,
              ]}
              pointerEvents={collapsed ? "none" : "auto"}
            >
              {/* Stats card + address/weather tiles. Hidden from a11y when
                  collapsed. onLayout captures the natural height so
                  collapseProgress can interpolate against it.
                  flexDirection: column-reverse renders the stats card above
                  the tiles row visually while keeping the source order
                  intact (avoids moving a large JSX block). The tiles row's
                  marginTop is the gap between the (visually upper) stats
                  card and the (visually lower) tiles. */}
              <View
                onLayout={handleContentLayout}
                style={{ width: "100%", flexDirection: "column-reverse" }}
                accessibilityElementsHidden={collapsed}
                importantForAccessibility={
                  collapsed ? "no-hide-descendants" : "auto"
                }
              >
                <View
                  style={{
                    flexDirection: "row",
                    gap: DesignSystem.spacing.sm,
                    /** Top (not bottom) because the parent uses
                     * flexDirection: column-reverse — this row sits below
                     * the stats card visually. */
                    marginTop: DesignSystem.spacing.sm,
                    width: "100%",
                  }}
                >
                  <DashboardHomeTile onPress={onOpenAddressEditor} />
                  <DashboardWeatherTile
                    onMissingAddressPress={onOpenAddressEditor}
                  />
                </View>

                <Animated.View
                  style={[
                    headerStyles.statsContainer,
                    {
                      backgroundColor: isDark
                        ? "rgba(35, 37, 38, 0.4)"
                        : "rgba(255, 255, 255, 0.45)",
                      borderWidth: 1,
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(255, 255, 255, 0.5)",
                    },
                    statsAnimatedStyle,
                    isTablet && {
                      paddingVertical: getResponsiveValue(
                        DesignSystem.spacing.sm,
                        DesignSystem.spacing.md,
                        DesignSystem.spacing.lg,
                      ),
                      paddingHorizontal: getResponsiveValue(
                        DesignSystem.spacing.md,
                        DesignSystem.spacing.lg,
                        DesignSystem.spacing.xl,
                      ),
                      gap: getResponsiveValue(
                        DesignSystem.spacing.sm,
                        DesignSystem.spacing.md,
                        DesignSystem.spacing.lg,
                      ),
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      headerStyles.statItem,
                      isTablet && {
                        paddingHorizontal: getResponsiveValue(
                          0,
                          DesignSystem.spacing.sm,
                          DesignSystem.spacing.md,
                        ),
                      },
                    ]}
                    onPress={onShowDueSoonPopup}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        headerStyles.statNumber,
                        { color: colors.primary },
                        isTablet && {
                          fontSize:
                            headerStyles.statNumber.fontSize *
                            statsFontMultiplier,
                          lineHeight:
                            headerStyles.statNumber.fontSize *
                            statsFontMultiplier *
                            1.2,
                        },
                      ]}
                    >
                      {dueSoonCount}
                    </Text>
                    <Text
                      style={[
                        headerStyles.statLabel,
                        {
                          color: isDark
                            ? colors.textSecondary
                            : "rgba(15, 23, 42, 0.85)",
                        },
                        isTablet && {
                          fontSize:
                            (headerStyles.statLabel.fontSize || 11) *
                            statsFontMultiplier,
                          lineHeight:
                            (headerStyles.statLabel.fontSize || 11) *
                            statsFontMultiplier *
                            1.3,
                        },
                      ]}
                    >
                      Due Soon
                    </Text>
                  </TouchableOpacity>
                  <View
                    style={[
                      headerStyles.statDivider,
                      {
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.08)",
                      },
                    ]}
                  />
                  <TouchableOpacity
                    style={[
                      headerStyles.statItem,
                      isTablet && {
                        paddingHorizontal: getResponsiveValue(
                          0,
                          DesignSystem.spacing.sm,
                          DesignSystem.spacing.md,
                        ),
                      },
                    ]}
                    onPress={() => {
                      navigation.navigate("CompletionHistory");
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        headerStyles.statNumber,
                        { color: colors.success },
                        isTablet && {
                          fontSize:
                            headerStyles.statNumber.fontSize *
                            statsFontMultiplier,
                          lineHeight:
                            headerStyles.statNumber.fontSize *
                            statsFontMultiplier *
                            1.2,
                        },
                      ]}
                    >
                      {completedCount}
                    </Text>
                    <Text
                      style={[
                        headerStyles.statLabel,
                        {
                          color: isDark
                            ? colors.textSecondary
                            : "rgba(15, 23, 42, 0.85)",
                        },
                        isTablet && {
                          fontSize:
                            (headerStyles.statLabel.fontSize || 11) *
                            statsFontMultiplier,
                          lineHeight:
                            (headerStyles.statLabel.fontSize || 11) *
                            statsFontMultiplier *
                            1.3,
                        },
                      ]}
                    >
                      Completed
                    </Text>
                  </TouchableOpacity>
                  <View
                    style={[
                      headerStyles.statDivider,
                      {
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.08)",
                      },
                    ]}
                  />
                  <TouchableOpacity
                    style={[
                      headerStyles.statItem,
                      isTablet && {
                        paddingHorizontal: getResponsiveValue(
                          0,
                          DesignSystem.spacing.sm,
                          DesignSystem.spacing.md,
                        ),
                      },
                    ]}
                    onPress={onShowOverduePopup}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        headerStyles.statNumber,
                        {
                          color:
                            overdueCount > 0
                              ? colors.error
                              : colors.success,
                        },
                        isTablet && {
                          fontSize:
                            headerStyles.statNumber.fontSize *
                            statsFontMultiplier,
                          lineHeight:
                            headerStyles.statNumber.fontSize *
                            statsFontMultiplier *
                            1.2,
                        },
                      ]}
                    >
                      {overdueCount}
                    </Text>
                    <Text
                      style={[
                        headerStyles.statLabel,
                        {
                          color: isDark
                            ? colors.textSecondary
                            : "rgba(15, 23, 42, 0.85)",
                        },
                        isTablet && {
                          fontSize:
                            (headerStyles.statLabel.fontSize || 11) *
                            statsFontMultiplier,
                          lineHeight:
                            (headerStyles.statLabel.fontSize || 11) *
                            statsFontMultiplier *
                            1.3,
                        },
                      ]}
                    >
                      Overdue
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}
