import React, { useCallback, useEffect, useState } from "react";
import {
  Text,
  TextInput,
  StyleSheet,
  Alert,
  View,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useProfile } from "../../../context/ProfileContext";
import { useTasks } from "../../../context/TasksContext";
import { useHaptics } from "../../../hooks";
import { HearthSheet } from "../../ui/HearthSheet";
import { Button } from "../../ui/Button";
import { HearthSurfaceCard, TintedGlassAvatar } from "../../ui";
import { useUserPreferences, resolveGradientPreset } from "../../../context/UserPreferencesContext";
import { DesignSystem } from "../../../theme/designSystem";
import {
  HouseholdMemberView,
  HouseholdService,
  householdInviteMessage,
  normalizeInviteCode,
} from "../../../services/HouseholdService";

interface HouseholdSharingModalProps {
  visible: boolean;
  onClose: () => void;
}

function roleLabel(role: string): string {
  if (role === "owner") return "Owner";
  return "Member";
}

export function HouseholdSharingModal({
  visible,
  onClose,
}: HouseholdSharingModalProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { profile, refresh, householdRole, avatarUrl } = useProfile();
  const { selectedGradient } = useUserPreferences();
  const { stats } = useTasks();
  const { triggerLight, triggerSuccess, triggerError } = useHaptics();
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState<string | null>(null);
  const [members, setMembers] = useState<HouseholdMemberView[]>([]);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(visible);

  useEffect(() => {
    setSheetVisible(visible);
  }, [visible]);

  const selfInfo = {
    id: user?.id ?? "",
    fullName:
      (user?.user_metadata?.full_name as string | undefined) ??
      profile?.full_name ??
      null,
    email: user?.email ?? profile?.email ?? null,
  };

  const loadDetails = useCallback(
    async (householdId: string) => {
      setLoadingDetails(true);
      setMembersError(null);
      try {
        const [house, people] = await Promise.all([
          HouseholdService.getHousehold(householdId),
          HouseholdService.listMembersDetailed(householdId, selfInfo),
        ]);
        if (house.error) {
          setMembersError(house.error.message);
        }
        if (house.data?.invite_code) {
          setInvite(normalizeInviteCode(house.data.invite_code));
        }
        if (people.error) {
          setMembersError(people.error.message);
        }
        setMembers(people.data);
      } finally {
        setLoadingDetails(false);
      }
    },
    [selfInfo.id, selfInfo.fullName, selfInfo.email]
  );

  useEffect(() => {
    if (!visible) {
      setCopied(false);
      setCode("");
      return;
    }
    if (!profile?.household_id) {
      setInvite(null);
      setMembers([]);
      setMembersError(null);
      return;
    }
    void loadDetails(profile.household_id);
  }, [visible, profile?.household_id, loadDetails]);

  const copyInvite = async () => {
    if (!invite) return;
    try {
      await Clipboard.setStringAsync(invite);
      setCopied(true);
      triggerSuccess();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      triggerError();
      Alert.alert("Couldn't copy", "Select the code and copy it manually.");
    }
  };

  const shareInvite = async () => {
    if (!invite) return;
    try {
      triggerLight();
      const result = await Share.share({
        message: householdInviteMessage(invite),
      });
      if (result.action === Share.sharedAction) {
        triggerSuccess();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      // User dismissed the sheet is not an error on some platforms.
      if (/cancel|dismiss/i.test(message)) return;
      triggerError();
      Alert.alert(
        "Couldn't open share",
        "Copy the code instead and send it in a message.",
        [
          { text: "Copy code", onPress: () => void copyInvite() },
          { text: "OK", style: "cancel" },
        ]
      );
    }
  };

  const create = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const result = await HouseholdService.createHousehold(user.id);
      if (result.error) {
        Alert.alert("Couldn't create household", result.error.message);
        return;
      }
      const nextCode = result.data?.invite_code
        ? normalizeInviteCode(result.data.invite_code)
        : null;
      setInvite(nextCode);
      await refresh();
      if (result.data?.id) {
        await loadDetails(result.data.id);
      }
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    if (busy) return;
    const normalized = normalizeInviteCode(code);
    if (normalized.length < 4) {
      Alert.alert("Check the code", "Invite codes are 6 letters or numbers.");
      return;
    }
    const doJoin = async () => {
      setBusy(true);
      try {
        const result = await HouseholdService.joinHousehold(normalized);
        if (result.error) {
          Alert.alert("Couldn't join", result.error.message);
          return;
        }
        await refresh();
        setSheetVisible(false);
      } finally {
        setBusy(false);
      }
    };

    if ((stats.activeRoutines ?? 0) > 0 || (stats.totalInstances ?? 0) > 0) {
      Alert.alert(
        "Adopt this household's home?",
        "You'll see the owner's house and schedule. Your current reminders stay on your account but won't show while you share this home.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Join", onPress: () => void doJoin() },
        ]
      );
      return;
    }
    await doJoin();
  };

  const leave = async () => {
    if (!user || busy) return;
    Alert.alert(
      "Leave this household?",
      householdRole === "owner"
        ? "Others will keep the household unless you are the only person. You will go back to your own schedule."
        : "You'll go back to your own schedule and no longer see this home.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await HouseholdService.leaveHousehold(user.id);
              setInvite(null);
              setMembers([]);
              await refresh();
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const owners = members.filter((member) => member.role === "owner");
  const regularMembers = members.filter((member) => member.role !== "owner");

  const renderMember = (member: HouseholdMemberView) => (
    <View key={member.user_id} style={styles.memberRow}>
      <TintedGlassAvatar
        size={36}
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
        accessibilityLabel={member.displayName}
      />
      <View style={styles.memberText}>
        <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>
          {member.displayName}
        </Text>
        {member.email && member.email !== member.displayName.replace(" (you)", "") ? (
          <Text
            style={[styles.memberEmail, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {member.email}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          styles.rolePill,
          {
            backgroundColor:
              member.role === "owner" ? colors.primary + "18" : colors.fieldFill,
            borderColor:
              member.role === "owner" ? colors.primary + "44" : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.rolePillText,
            {
              color:
                member.role === "owner" ? colors.primary : colors.textSecondary,
            },
          ]}
        >
          {roleLabel(member.role)}
        </Text>
      </View>
    </View>
  );

  return (
    <HearthSheet
      visible={sheetVisible}
      onClose={() => setSheetVisible(false)}
      onDismissed={onClose}
      title="Household"
      footer={
        <Button
          label="Close"
          variant="ghost"
          onPress={() => setSheetVisible(false)}
        />
      }
    >
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        One household is one home. Members see the owner's address, systems,
        and schedule.
      </Text>
      {profile?.household_id ? (
        <>
          <Text style={[styles.label, { color: colors.text }]}>Invite code</Text>
          <HearthSurfaceCard containerStyle={styles.codeCard}>
            <View style={styles.codeRow}>
              <Text
                style={[styles.code, { color: colors.primary }]}
                selectable
                accessibilityLabel={`Invite code ${invite ?? "loading"}`}
              >
                {invite ?? "······"}
              </Text>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  { backgroundColor: colors.primary + "14" },
                ]}
                onPress={() => void copyInvite()}
                disabled={!invite}
                accessibilityRole="button"
                accessibilityLabel={copied ? "Copied" : "Copy invite code"}
              >
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
            <Text style={[styles.copyHint, { color: colors.textSecondary }]}>
              {copied
                ? "Copied to clipboard"
                : "Share this code. Anyone with it can join this home."}
            </Text>
            <View style={styles.shareButtonWrap}>
              <Button
                label="Share invite"
                onPress={() => void shareInvite()}
                disabled={!invite || busy}
                accessibilityLabel="Share invite code with a message"
              />
            </View>
          </HearthSurfaceCard>

          <View style={styles.peopleHeader}>
            <Text style={[styles.label, styles.peopleLabel, { color: colors.text }]}>
              People
            </Text>
            {profile.household_id ? (
              <TouchableOpacity
                onPress={() => void loadDetails(profile.household_id!)}
                accessibilityRole="button"
                accessibilityLabel="Refresh household members"
              >
                <Text style={[styles.refresh, { color: colors.primary }]}>
                  Refresh
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {loadingDetails && members.length === 0 ? (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          ) : membersError && members.length === 0 ? (
            <Text style={[styles.memberEmpty, { color: colors.textSecondary }]}>
              Couldn’t load people. {membersError}
            </Text>
          ) : members.length === 0 ? (
            <Text style={[styles.memberEmpty, { color: colors.textSecondary }]}>
              No one listed yet. Refresh or invite someone with the code.
            </Text>
          ) : (
            <HearthSurfaceCard>
              {owners.length > 0 ? (
                <View style={styles.roleGroup}>
                  {owners.map(renderMember)}
                </View>
              ) : null}
              {regularMembers.length > 0 ? (
                <View
                  style={[
                    styles.roleGroup,
                    owners.length > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: colors.border,
                    },
                  ]}
                >
                  {regularMembers.map(renderMember)}
                </View>
              ) : null}
            </HearthSurfaceCard>
          )}

          {householdRole === "member" ? (
            <Text style={[styles.hint, styles.memberNote, { color: colors.textSecondary }]}>
              The owner manages this home. You can complete reminders and leave
              anytime.
            </Text>
          ) : null}

          <Button
            label="Leave household"
            variant="ghost"
            onPress={() => void leave()}
            disabled={busy}
          />
        </>
      ) : (
        <>
          <Button
            label={busy ? "Working…" : "Create household"}
            onPress={() => void create()}
            disabled={busy}
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Or join with a code
          </Text>
          <TextInput
            value={code}
            onChangeText={(value) => setCode(normalizeInviteCode(value))}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            maxLength={8}
            placeholder="ABC123"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.fieldFill,
              },
            ]}
          />
          <Button
            label="Join"
            variant="ghost"
            onPress={() => void join()}
            disabled={busy || normalizeInviteCode(code).length < 4}
          />
        </>
      )}
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...DesignSystem.typography.footnote,
    marginBottom: DesignSystem.spacing.lg,
    lineHeight: 20,
  },
  memberNote: {
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  label: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
    marginBottom: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.md,
  },
  peopleLabel: {
    marginTop: 0,
    marginBottom: 0,
  },
  peopleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.sm,
  },
  refresh: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
  },
  codeCard: {
    marginBottom: DesignSystem.spacing.sm,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.md,
  },
  code: {
    ...DesignSystem.typography.title2,
    letterSpacing: 3,
    flex: 1,
    fontVariant: ["tabular-nums"],
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: DesignSystem.borders.radius.medium,
    alignItems: "center",
    justifyContent: "center",
  },
  copyHint: {
    ...DesignSystem.typography.caption,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.xs,
    paddingBottom: DesignSystem.spacing.sm,
  },
  shareButtonWrap: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.md,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.md,
    minHeight: 44,
    letterSpacing: 2,
  },
  spinner: {
    marginVertical: DesignSystem.spacing.md,
  },
  memberEmpty: {
    ...DesignSystem.typography.footnote,
    marginBottom: DesignSystem.spacing.md,
  },
  roleGroup: {
    paddingVertical: DesignSystem.spacing.xs,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 2,
    gap: DesignSystem.spacing.sm,
  },
  memberText: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    ...DesignSystem.typography.callout,
    fontWeight: "600",
  },
  memberEmail: {
    ...DesignSystem.typography.caption,
    marginTop: 1,
  },
  rolePill: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 4,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rolePillText: {
    ...DesignSystem.typography.caption,
    fontWeight: "700",
  },
});
