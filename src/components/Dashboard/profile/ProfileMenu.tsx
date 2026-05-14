import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useTasks } from "../../../context/TasksContext";
import { useGradients, useHaptics, useDevice } from "../../../hooks";
import { useUserPreferences } from "../../../context/UserPreferencesContext";
import { DesignSystem } from "../../../theme/designSystem";
import { GlassCard, SheetGrabber, TintedGlassAvatar } from "../../ui";
import { hexWithAlpha } from "../popups/popupChrome";
import { styles } from "./styles";
import { ProfileMenuNavigationProps } from "../../../types/navigation";
import { AllTasksModal } from "../../modals/all-tasks-modal";

const { height: screenHeight } = Dimensions.get("window");

interface ProfileMenuProps {
  onRefresh?: () => void;
  navigation: ProfileMenuNavigationProps["navigation"];
}

/**
 * Bottom-sheet profile menu opened from the dashboard avatar. Three rows:
 * Total Tasks (opens the all-tasks modal), Settings (navigates to the
 * SettingsScreen — the single source of truth for destructive/account
 * actions), and Sign Out. Avatar styling uses TintedGlassAvatar so the
 * presentation matches the rest of the 2026 glass chrome.
 */
export function ProfileMenu({ navigation }: ProfileMenuProps) {
  const { colors, isDark } = useTheme();
  const { user, signOut } = useAuth();
  const { stats } = useTasks();
  const { haloGradient } = useGradients();
  const { selectedGradient, loading: preferencesLoading } =
    useUserPreferences();
  const { triggerLight, triggerMedium } = useHaptics();
  const {
    isTablet,
    getResponsiveValue,
    getFontMultiplier,
    getTabletSheetContainerStyle,
  } = useDevice();
  const fontMultiplier = getFontMultiplier();

  const [menuVisible, setMenuVisible] = useState(false);
  const [allTasksModalVisible, setAllTasksModalVisible] = useState(false);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(screenHeight);

  const getUserInitial = () => {
    const fullName = user?.user_metadata?.full_name;
    if (fullName) return fullName.split(" ")[0].charAt(0).toUpperCase();
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const getUserName = () => {
    const fullName = user?.user_metadata?.full_name;
    return fullName || "User";
  };

  const getUserEmail = () => user?.email || "";

  // Avatar sizes — header avatar bumped to 44pt to meet iOS hit-target minimum.
  const headerAvatarSize = isTablet ? getResponsiveValue(44, 52, 56) : 44;
  const sheetAvatarSize = isTablet ? getResponsiveValue(56, 68, 78) : 56;

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (menuVisible) {
      opacity.value = withTiming(1, {
        duration: DesignSystem.motion.duration.fast,
        easing: DesignSystem.motion.easing.standard,
      });
      translateY.value = withSpring(0, DesignSystem.motion.spring.snappy);
    }
  }, [menuVisible]);

  const showMenu = async () => {
    await triggerLight();
    setMenuVisible(true);
  };

  const hideMenu = () => {
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
        if (finished) runOnJS(setMenuVisible)(false);
      },
    );
  };

  const handleSignOut = async () => {
    await triggerMedium();
    hideMenu();
    setTimeout(() => {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error("Sign out error:", error);
            }
          },
        },
      ]);
    }, DesignSystem.motion.duration.fast + 50);
  };

  const handleSettings = async () => {
    await triggerLight();
    hideMenu();
    setTimeout(() => {
      navigation.navigate("Settings");
    }, DesignSystem.motion.duration.fast + 50);
  };

  const handleAllTasks = async () => {
    await triggerLight();
    hideMenu();
    setTimeout(() => {
      setAllTasksModalVisible(true);
    }, DesignSystem.motion.duration.fast + 50);
  };

  return (
    <>
      <TintedGlassAvatar
        size={headerAvatarSize}
        gradient={selectedGradient}
        initial={getUserInitial()}
        onPress={showMenu}
        accessibilityLabel="Open profile menu"
      />

      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={hideMenu}
        statusBarTranslucent
      >
        <Animated.View style={[styles.sheetOverlay, backdropStyle]}>
          <Pressable style={styles.backdropPressable} onPress={hideMenu} />
          <Animated.View
            style={[
              styles.sheetContainer,
              getTabletSheetContainerStyle(),
              sheetStyle,
            ]}
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

                <View style={styles.profileSection}>
                  <TintedGlassAvatar
                    size={sheetAvatarSize}
                    gradient={selectedGradient}
                    initial={getUserInitial()}
                    pressable={false}
                  />
                  <View style={styles.profileInfo}>
                    <Text
                      style={[
                        styles.profileName,
                        { color: colors.text },
                        isTablet && {
                          fontSize:
                            (styles.profileName.fontSize || 18) *
                            fontMultiplier,
                          lineHeight:
                            (styles.profileName.fontSize || 18) *
                            fontMultiplier *
                            1.2,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {getUserName()}
                    </Text>
                    <Text
                      style={[
                        styles.profileEmail,
                        { color: colors.textSecondary },
                        isTablet && {
                          fontSize:
                            (styles.profileEmail.fontSize || 14) *
                            fontMultiplier,
                        },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {getUserEmail()}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.menuDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                <View style={styles.actions}>
                  {/* Total Tasks */}
                  <TouchableOpacity
                    style={[
                      styles.menuActionButton,
                      {
                        backgroundColor: isDark
                          ? hexWithAlpha("#FFFFFF", 0.04)
                          : hexWithAlpha("#000000", 0.025),
                      },
                    ]}
                    onPress={handleAllTasks}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="View all tasks"
                  >
                    <View
                      style={[
                        styles.menuActionIconContainer,
                        { backgroundColor: colors.primary + "15" },
                        isTablet && {
                          width: getResponsiveValue(36, 44, 48),
                          height: getResponsiveValue(36, 44, 48),
                          borderRadius: getResponsiveValue(18, 22, 24),
                        },
                      ]}
                    >
                      <Ionicons
                        name="stats-chart-outline"
                        size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
                        color={colors.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.menuActionText,
                        { color: colors.text },
                        isTablet && {
                          fontSize:
                            (styles.menuActionText.fontSize || 16) *
                            fontMultiplier,
                        },
                      ]}
                    >
                      Total Tasks
                    </Text>
                    <View style={styles.menuActionRight}>
                      <View
                        style={[
                          styles.counterBadge,
                          { backgroundColor: colors.primary + "20" },
                          isTablet && {
                            minWidth: getResponsiveValue(28, 36, 40),
                            height: getResponsiveValue(22, 28, 32),
                            borderRadius: getResponsiveValue(11, 14, 16),
                            paddingHorizontal: getResponsiveValue(8, 10, 12),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.counterText,
                            { color: colors.primary },
                            isTablet && {
                              fontSize:
                                (styles.counterText.fontSize || 13) *
                                fontMultiplier,
                            },
                          ]}
                        >
                          {stats.total}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={isTablet ? getResponsiveValue(16, 20, 22) : 16}
                        color={colors.textSecondary}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Settings */}
                  <TouchableOpacity
                    style={[
                      styles.menuActionButton,
                      {
                        backgroundColor: isDark
                          ? hexWithAlpha("#FFFFFF", 0.04)
                          : hexWithAlpha("#000000", 0.025),
                      },
                    ]}
                    onPress={handleSettings}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Open settings"
                  >
                    <View
                      style={[
                        styles.menuActionIconContainer,
                        { backgroundColor: colors.primary + "15" },
                        isTablet && {
                          width: getResponsiveValue(36, 44, 48),
                          height: getResponsiveValue(36, 44, 48),
                          borderRadius: getResponsiveValue(18, 22, 24),
                        },
                      ]}
                    >
                      <Ionicons
                        name="settings-outline"
                        size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
                        color={colors.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.menuActionText,
                        { color: colors.text },
                        isTablet && {
                          fontSize:
                            (styles.menuActionText.fontSize || 16) *
                            fontMultiplier,
                        },
                      ]}
                    >
                      Settings
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={isTablet ? getResponsiveValue(16, 20, 22) : 16}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {/* Sign Out */}
                  <TouchableOpacity
                    style={[
                      styles.menuActionButton,
                      {
                        backgroundColor: isDark
                          ? hexWithAlpha("#FFFFFF", 0.04)
                          : hexWithAlpha("#000000", 0.025),
                      },
                    ]}
                    onPress={handleSignOut}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Sign out"
                  >
                    <View
                      style={[
                        styles.menuActionIconContainer,
                        { backgroundColor: colors.error + "15" },
                        isTablet && {
                          width: getResponsiveValue(36, 44, 48),
                          height: getResponsiveValue(36, 44, 48),
                          borderRadius: getResponsiveValue(18, 22, 24),
                        },
                      ]}
                    >
                      <Ionicons
                        name="log-out-outline"
                        size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
                        color={colors.error}
                      />
                    </View>
                    <Text
                      style={[
                        styles.menuActionText,
                        { color: colors.error },
                        isTablet && {
                          fontSize:
                            (styles.menuActionText.fontSize || 16) *
                            fontMultiplier,
                        },
                      ]}
                    >
                      Sign Out
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Loading hint while preferences resolve */}
                {preferencesLoading ? null : null}
              </SafeAreaView>
            </GlassCard>
          </Animated.View>
        </Animated.View>
      </Modal>

      <AllTasksModal
        visible={allTasksModalVisible}
        onClose={() => setAllTasksModalVisible(false)}
      />
    </>
  );
}
