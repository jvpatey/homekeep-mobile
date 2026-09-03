import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useProfile } from "../../../context/ProfileContext";
import { useTasks } from "../../../context/TasksContext";
import { useGradients, useHaptics, useDevice, useSheetMount } from "../../../hooks";
import {
  resolveGradientPreset,
  useUserPreferences,
} from "../../../context/UserPreferencesContext";
import { DesignSystem } from "../../../theme/designSystem";
import { SheetGrabber, TintedGlassAvatar, HearthSurfaceCard } from "../../ui";
import { styles } from "./styles";
import { ProfileMenuNavigationProps } from "../../../types/navigation";
import { AllTasksModal } from "../../modals/all-tasks-modal";
import { HouseholdSharingModal } from "../../modals/household-sharing/HouseholdSharingModal";
import {
  HouseholdMemberView,
  HouseholdService,
  formatHouseholdPeople,
} from "../../../services/HouseholdService";

interface ProfileMenuProps {
  onRefresh?: () => void;
  navigation: ProfileMenuNavigationProps["navigation"];
}

/**
 * Bottom-sheet profile menu opened from the dashboard avatar.
 */
export function ProfileMenu({ navigation }: ProfileMenuProps) {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const { profile, householdRole, avatarUrl } = useProfile();
  const { stats } = useTasks();
  const { authAtmosphere } = useGradients();
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
  const [householdVisible, setHouseholdVisible] = useState(false);
  const [members, setMembers] = useState<HouseholdMemberView[]>([]);
  const { mounted, backdropStyle, sheetStyle } = useSheetMount(menuVisible);

  const selfInfo = useMemo(
    () => ({
      id: user?.id ?? "",
      fullName:
        (user?.user_metadata?.full_name as string | undefined) ??
        profile?.full_name ??
        null,
      email: user?.email ?? profile?.email ?? null,
    }),
    [user?.id, user?.user_metadata?.full_name, user?.email, profile?.full_name, profile?.email]
  );

  useEffect(() => {
    const householdId = profile?.household_id;
    if (!householdId) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    void HouseholdService.listMembersDetailed(householdId, selfInfo).then(
      (result) => {
        if (!cancelled) setMembers(result.data);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [profile?.household_id, selfInfo, menuVisible, householdVisible]);

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

  const showMenu = async () => {
    await triggerLight();
    setMenuVisible(true);
  };

  const hideMenu = () => {
    setMenuVisible(false);
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

  const handleCompletionHistory = async () => {
    await triggerLight();
    hideMenu();
    setTimeout(() => {
      navigation.navigate("CompletionHistory");
    }, DesignSystem.motion.duration.fast + 50);
  };

  const handleAllTasks = async () => {
    await triggerLight();
    hideMenu();
    setTimeout(() => {
      setAllTasksModalVisible(true);
    }, DesignSystem.motion.duration.fast + 50);
  };

  const handleHousehold = async () => {
    await triggerLight();
    hideMenu();
    setTimeout(() => {
      setHouseholdVisible(true);
    }, DesignSystem.motion.duration.fast + 50);
  };

  const householdId = profile?.household_id;
  const householdPeople = formatHouseholdPeople(members, user?.id);
  const householdShared = members.length > 1;
  const householdTitle = householdShared ? "Shared household" : "Household";
  const householdSubtitle = householdShared
    ? householdPeople
    : householdPeople
      ? "Just you — invite someone to share this home"
      : householdRole === "member"
        ? "You're a member of this home"
        : "Invite someone to share this home";
  const visibleAvatars = members.slice(0, 4);
  const extraCount = Math.max(0, members.length - visibleAvatars.length);

  return (
    <>
      <TintedGlassAvatar
        size={headerAvatarSize}
        gradient={selectedGradient}
        initial={getUserInitial()}
        imageUri={avatarUrl}
        onPress={showMenu}
        accessibilityLabel="Open profile menu"
      />

      {mounted ? (
      <Modal
        visible={mounted}
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
            <HearthSurfaceCard
              containerStyle={styles.glassOuter}
              style={styles.glassInner}
            >
              <LinearGradient
                colors={authAtmosphere}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.35 }}
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
                    imageUri={avatarUrl}
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

                {householdId ? (
                  <TouchableOpacity
                    style={[
                      styles.householdCard,
                      {
                        backgroundColor: colors.fieldFill,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => void handleHousehold()}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={`${householdTitle}. ${householdSubtitle}. Open household sharing`}
                  >
                    <View style={styles.householdCardTop}>
                      {visibleAvatars.length > 0 ? (
                        <View style={styles.householdAvatars}>
                          {visibleAvatars.map((member, index) => (
                            <View
                              key={member.user_id}
                              style={[
                                styles.householdAvatar,
                                {
                                  borderColor: colors.surface,
                                  marginLeft: index === 0 ? 0 : -8,
                                  zIndex: visibleAvatars.length - index,
                                },
                              ]}
                            >
                              <TintedGlassAvatar
                                size={26}
                                gradient={
                                  member.user_id === user?.id
                                    ? selectedGradient
                                    : resolveGradientPreset(member.avatarStyle)
                                }
                                initial={member.initial}
                                imageUri={
                                  member.user_id === user?.id
                                    ? avatarUrl ?? member.avatarUrl
                                    : member.avatarUrl
                                }
                                pressable={false}
                                ringWidth={1.5}
                                accessibilityLabel={member.displayName}
                              />
                            </View>
                          ))}
                          {extraCount > 0 ? (
                            <Text
                              style={[
                                styles.householdOverflow,
                                { color: colors.textSecondary },
                              ]}
                            >
                              +{extraCount}
                            </Text>
                          ) : null}
                        </View>
                      ) : (
                        <Ionicons
                          name="people-outline"
                          size={18}
                          color={colors.primary}
                        />
                      )}
                      <View style={styles.householdCardText}>
                        <Text
                          style={[
                            styles.householdTitle,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {householdTitle}
                        </Text>
                        <Text
                          style={[
                            styles.householdPeople,
                            { color: colors.text },
                          ]}
                          numberOfLines={2}
                        >
                          {householdSubtitle}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.textSecondary}
                      />
                    </View>
                  </TouchableOpacity>
                ) : null}

                <View
                  style={[
                    styles.menuDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                <View style={styles.actions}>
                  {/* Home summary */}
                  <TouchableOpacity
                    style={[
                      styles.menuActionButton,
                      { backgroundColor: colors.fieldFill },
                    ]}
                    onPress={async () => {
                      await triggerLight();
                      hideMenu();
                      setTimeout(() => {
                        navigation.navigate("HomeSummaryPreview");
                      }, DesignSystem.motion.duration.fast + 50);
                    }}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Open home maintenance summary"
                  >
                    <View
                      style={[
                        styles.menuActionIconContainer,
                        { backgroundColor: colors.primary + "15" },
                      ]}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <Text
                      style={[styles.menuActionText, { color: colors.text }]}
                    >
                      Home summary
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {/* All reminders */}
                  <TouchableOpacity
                    style={[
                      styles.menuActionButton,
                      { backgroundColor: colors.fieldFill },
                    ]}
                    onPress={handleAllTasks}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="View all reminders"
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
                      All reminders
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

                  {/* Completion History */}
                  <TouchableOpacity
                    style={[
                      styles.menuActionButton,
                      { backgroundColor: colors.fieldFill },
                    ]}
                    onPress={handleCompletionHistory}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Open completion history"
                  >
                    <View
                      style={[
                        styles.menuActionIconContainer,
                        { backgroundColor: colors.secondary + "18" },
                        isTablet && {
                          width: getResponsiveValue(36, 44, 48),
                          height: getResponsiveValue(36, 44, 48),
                          borderRadius: getResponsiveValue(18, 22, 24),
                        },
                      ]}
                    >
                      <Ionicons
                        name="time-outline"
                        size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
                        color={colors.secondary}
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
                      Completion History
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={isTablet ? getResponsiveValue(16, 20, 22) : 16}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {/* Settings */}
                  <TouchableOpacity
                    style={[
                      styles.menuActionButton,
                      { backgroundColor: colors.fieldFill },
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
                      { backgroundColor: colors.fieldFill },
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
            </HearthSurfaceCard>
          </Animated.View>
        </Animated.View>
      </Modal>
      ) : null}

      <AllTasksModal
        visible={allTasksModalVisible}
        onClose={() => setAllTasksModalVisible(false)}
      />

      <HouseholdSharingModal
        visible={householdVisible}
        onClose={() => setHouseholdVisible(false)}
      />
    </>
  );
}
