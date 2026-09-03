import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useProfile } from "../../../context/ProfileContext";
import { useTasks } from "../../../context/TasksContext";
import { useHaptics, useDevice } from "../../../hooks";
import {
  resolveGradientPreset,
  useUserPreferences,
} from "../../../context/UserPreferencesContext";
import { DesignSystem } from "../../../theme/designSystem";
import {
  HearthSheet,
  HearthSurfaceCard,
  SheetActionRow,
  TintedGlassAvatar,
} from "../../ui";
import { styles } from "./styles";
import { ProfileMenuNavigationProps } from "../../../types/navigation";
import { AllTasksModal } from "../../modals/all-tasks-modal";
import { HouseholdSharingModal } from "../../modals/household-sharing/HouseholdSharingModal";
import { AvatarCustomizationModal } from "../../modals/avatar-customization-modal";
import {
  HouseholdMemberView,
  HouseholdService,
  formatHouseholdPeople,
} from "../../../services/HouseholdService";
import {
  accountDisplayName,
  accountInitial,
} from "../../../utils/displayName";

interface ProfileMenuProps {
  onRefresh?: () => void;
  navigation: ProfileMenuNavigationProps["navigation"];
}

export function ProfileMenu({ navigation }: ProfileMenuProps) {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const { profile, householdRole, avatarUrl } = useProfile();
  const { stats } = useTasks();
  const { selectedGradient } = useUserPreferences();
  const { triggerLight, triggerMedium } = useHaptics();
  const { isTablet, getResponsiveValue } = useDevice();

  const [menuVisible, setMenuVisible] = useState(false);
  const [allTasksModalVisible, setAllTasksModalVisible] = useState(false);
  const [householdVisible, setHouseholdVisible] = useState(false);
  const [avatarEditorVisible, setAvatarEditorVisible] = useState(false);
  const [members, setMembers] = useState<HouseholdMemberView[]>([]);

  const nameInput = useMemo(
    () => ({
      authFullName: user?.user_metadata?.full_name as string | undefined,
      profileFullName: profile?.full_name,
      email: user?.email ?? profile?.email ?? null,
    }),
    [
      user?.user_metadata?.full_name,
      user?.email,
      profile?.full_name,
      profile?.email,
    ]
  );

  const selfInfo = useMemo(
    () => ({
      id: user?.id ?? "",
      fullName: nameInput.authFullName ?? nameInput.profileFullName ?? null,
      email: nameInput.email,
    }),
    [user?.id, nameInput]
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

  const displayName = accountDisplayName(nameInput);
  const initial = accountInitial(nameInput);
  const headerAvatarSize = isTablet ? getResponsiveValue(44, 52, 56) : 44;
  const sheetAvatarSize = isTablet ? getResponsiveValue(56, 68, 78) : 56;

  const presentAfterClose = (open: () => void) => {
    setMenuVisible(false);
    setTimeout(open, DesignSystem.motion.duration.fast + 50);
  };

  const showMenu = async () => {
    await triggerLight();
    setMenuVisible(true);
  };

  const handleSignOut = async () => {
    await triggerMedium();
    presentAfterClose(() => {
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
    });
  };

  const householdShared = members.length > 1;
  const householdTitle = householdShared ? "Shared household" : "Account";
  const householdSubtitle = householdShared
    ? formatHouseholdPeople(members, user?.id)
    : householdRole === "member"
      ? "You're a member of this home"
      : "Single-user account";
  const visibleAvatars = members.slice(0, 4);
  const extraCount = Math.max(0, members.length - visibleAvatars.length);

  return (
    <>
      <TintedGlassAvatar
        size={headerAvatarSize}
        gradient={selectedGradient}
        initial={initial}
        imageUri={avatarUrl}
        onPress={showMenu}
        accessibilityLabel="Open profile menu"
      />

      <HearthSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title="Account"
        keyboardAvoiding={false}
        maxHeightRatio={0.88}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarEditWrap}>
            <TintedGlassAvatar
              size={sheetAvatarSize}
              gradient={selectedGradient}
              initial={initial}
              imageUri={avatarUrl}
              onPress={() => {
                void triggerLight();
                presentAfterClose(() => setAvatarEditorVisible(true));
              }}
              accessibilityLabel="Edit avatar"
            />
            <View
              style={[
                styles.editBadge,
                { backgroundColor: colors.primary, borderColor: colors.surface },
              ]}
              pointerEvents="none"
            >
              <Ionicons name="pencil" size={11} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text
              style={[styles.profileName, { color: colors.text }]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            {nameInput.email ? (
              <Text
                style={[styles.profileEmail, { color: colors.textSecondary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {nameInput.email}
              </Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.householdCard,
            {
              backgroundColor: colors.fieldFill,
              borderColor: colors.border,
            },
          ]}
          onPress={() => {
            void triggerLight();
            presentAfterClose(() => setHouseholdVisible(true));
          }}
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
                name="person-outline"
                size={18}
                color={colors.primary}
              />
            )}
            <View style={styles.householdCardText}>
              <Text
                style={[styles.householdTitle, { color: colors.textSecondary }]}
              >
                {householdTitle}
              </Text>
              <Text
                style={[styles.householdPeople, { color: colors.text }]}
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

        <HearthSurfaceCard
          containerStyle={styles.actionsCard}
          style={styles.actionsSurface}
        >
          <SheetActionRow
            icon="document-text-outline"
            title="Home summary"
            onPress={() => {
              void triggerLight();
              presentAfterClose(() =>
                navigation.navigate("HomeSummaryPreview")
              );
            }}
            showDivider
          />
          <SheetActionRow
            icon="stats-chart-outline"
            title="All reminders"
            onPress={() => {
              void triggerLight();
              presentAfterClose(() => setAllTasksModalVisible(true));
            }}
            trailing={
              <View
                style={[
                  styles.counterBadge,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Text style={[styles.counterText, { color: colors.primary }]}>
                  {stats.total}
                </Text>
              </View>
            }
            showDivider
          />
          <SheetActionRow
            icon="time-outline"
            title="Completion history"
            onPress={() => {
              void triggerLight();
              presentAfterClose(() =>
                navigation.navigate("CompletionHistory")
              );
            }}
            showDivider
          />
          <SheetActionRow
            icon="settings-outline"
            title="Settings"
            onPress={() => {
              void triggerLight();
              presentAfterClose(() => navigation.navigate("Settings"));
            }}
            showDivider
          />
          <SheetActionRow
            icon="log-out-outline"
            title="Sign out"
            onPress={() => void handleSignOut()}
            destructive
            showChevron={false}
          />
        </HearthSurfaceCard>
      </HearthSheet>

      <AllTasksModal
        visible={allTasksModalVisible}
        onClose={() => setAllTasksModalVisible(false)}
      />

      <HouseholdSharingModal
        visible={householdVisible}
        onClose={() => setHouseholdVisible(false)}
      />

      <AvatarCustomizationModal
        visible={avatarEditorVisible}
        onClose={() => setAvatarEditorVisible(false)}
      />
    </>
  );
}
