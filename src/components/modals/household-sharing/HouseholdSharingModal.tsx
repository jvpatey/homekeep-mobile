import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { CameraView, useCameraPermissions } from "expo-camera";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useProfile } from "../../../context/ProfileContext";
import { useTasks } from "../../../context/TasksContext";
import { useHaptics } from "../../../hooks";
import { useSubscription } from "../../../context/SubscriptionContext";
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
import {
  homeShareInvitePayload,
  parseHomeShareInvitePayload,
} from "../../../utils/homeShareInvite";

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
  const { isPlus, presentPaywall } = useSubscription();
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState<string | null>(null);
  const [members, setMembers] = useState<HouseholdMemberView[]>([]);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(visible);
  const [mode, setMode] = useState<"main" | "scan">("main");
  const [scanLocked, setScanLocked] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const scanHandledRef = useRef(false);
  const pendingPaywallRef = useRef(false);

  useEffect(() => {
    setSheetVisible(visible);
    if (!visible) {
      setMode("main");
      setScanLocked(false);
      scanHandledRef.current = false;
    }
  }, [visible]);

  /** Close HomeShare first so Plus is not trapped under this Modal. */
  const ensurePlus = async (): Promise<boolean> => {
    if (isPlus) return true;
    pendingPaywallRef.current = true;
    setSheetVisible(false);
    return false;
  };

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
    if (!(await ensurePlus())) return;
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
    if (!(await ensurePlus())) return;
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
    if (!(await ensurePlus())) return;
    setBusy(true);
    try {
      const result = await HouseholdService.createHousehold(user.id);
      if (result.error) {
        Alert.alert("Couldn't create HomeShare", result.error.message);
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

  const join = async (rawCode?: string) => {
    if (busy) return;
    const normalized = normalizeInviteCode(rawCode ?? code);
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
          setScanLocked(false);
          scanHandledRef.current = false;
          return;
        }
        setCode("");
        setMode("main");
        await refresh();
        if (result.data) {
          await loadDetails(result.data);
        }
        triggerSuccess();
      } finally {
        setBusy(false);
      }
    };

    if ((stats.activeRoutines ?? 0) > 0 || (stats.totalInstances ?? 0) > 0) {
      Alert.alert(
        "Adopt this home?",
        "You'll see the owner's house and schedule. Your current reminders stay on your account but won't show while you share this home.",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              setScanLocked(false);
              scanHandledRef.current = false;
            },
          },
          { text: "Join", onPress: () => void doJoin() },
        ]
      );
      return;
    }
    await doJoin();
  };

  const openScanner = async () => {
    triggerLight();
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert(
          "Camera needed",
          "Allow camera access in Settings to scan a HomeShare QR code."
        );
        return;
      }
    }
    scanHandledRef.current = false;
    setScanLocked(false);
    setMode("scan");
  };

  const onBarcodeScanned = (event: { data: string }) => {
    if (scanLocked || scanHandledRef.current || busy) return;
    const parsed = parseHomeShareInvitePayload(event.data);
    if (!parsed) return;
    scanHandledRef.current = true;
    setScanLocked(true);
    setCode(parsed);
    triggerSuccess();
    void join(parsed);
  };

  const leave = async () => {
    if (!user || busy) return;
    const isSoloOwner =
      householdRole === "owner" &&
      members.filter((m) => m.user_id !== user.id).length === 0;
    const leaveMessage = isSoloOwner
      ? "You're the only person here. Leaving ends this HomeShare and returns you to your personal schedule."
      : householdRole === "owner"
        ? "Others will keep this HomeShare. You will go back to your own schedule."
        : "You'll go back to your own schedule and no longer see this home.";
    Alert.alert("Leave HomeShare?", leaveMessage, [
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
    ]);
  };

  const removeMember = (member: HouseholdMemberView) => {
    if (busy || householdRole !== "owner") return;
    Alert.alert(
      "Remove from HomeShare?",
      `${member.displayName.replace(" (you)", "")} will return to their own schedule and stop seeing this home.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                const result = await HouseholdService.removeMember(
                  member.user_id
                );
                if (result.error) {
                  Alert.alert("Couldn't remove", result.error.message);
                  return;
                }
                if (profile?.household_id) {
                  await loadDetails(profile.household_id);
                }
                triggerSuccess();
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ]
    );
  };

  const rotateInvite = async () => {
    if (!profile?.household_id || busy) return;
    if (!(await ensurePlus())) return;
    Alert.alert(
      "New invite code?",
      "The current code will stop working. Anyone who already joined stays in this HomeShare.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "New code",
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                const result = await HouseholdService.rotateInviteCode(
                  profile.household_id!
                );
                if (result.error || !result.data?.invite_code) {
                  Alert.alert(
                    "Couldn't rotate code",
                    result.error?.message ?? "Please try again."
                  );
                  return;
                }
                setInvite(normalizeInviteCode(result.data.invite_code));
                triggerSuccess();
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ]
    );
  };

  const owners = members.filter((member) => member.role === "owner");
  const regularMembers = members.filter((member) => member.role !== "owner");
  const isOwner = householdRole === "owner";

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
      {isOwner && member.role !== "owner" && member.user_id !== user?.id ? (
        <TouchableOpacity
          onPress={() => removeMember(member)}
          disabled={busy}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${member.displayName}`}
          style={styles.removeButton}
        >
          <Ionicons name="close-circle-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <HearthSheet
      visible={sheetVisible}
      onClose={() => {
        if (mode === "scan") {
          setMode("main");
          setScanLocked(false);
          scanHandledRef.current = false;
          return;
        }
        setSheetVisible(false);
      }}
      onDismissed={() => {
        const needPaywall = pendingPaywallRef.current;
        pendingPaywallRef.current = false;
        onClose();
        if (needPaywall) {
          setTimeout(() => {
            void presentPaywall();
          }, 320);
        }
      }}
      title={mode === "scan" ? "Scan HomeShare" : "HomeShare"}
      fillMaxHeight={mode === "scan"}
      footer={
        mode === "scan" ? (
          <Button
            label="Enter code instead"
            variant="ghost"
            onPress={() => {
              setMode("main");
              setScanLocked(false);
              scanHandledRef.current = false;
            }}
          />
        ) : (
          <Button
            label="Close"
            variant="ghost"
            onPress={() => setSheetVisible(false)}
          />
        )
      }
    >
      {mode === "scan" ? (
        <View style={styles.scanBody}>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Point the camera at their HomeShare QR code.
          </Text>
          <View
            style={[
              styles.cameraFrame,
              { borderColor: colors.border, backgroundColor: "#000" },
            ]}
          >
            {cameraPermission?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={
                  scanLocked ? undefined : onBarcodeScanned
                }
              />
            ) : (
              <View style={styles.cameraFallback}>
                <Text style={{ color: "#fff", textAlign: "center" }}>
                  Camera permission is required to scan.
                </Text>
                <Button
                  label="Allow camera"
                  onPress={() => void openScanner()}
                />
              </View>
            )}
          </View>
          {busy ? (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          ) : null}
        </View>
      ) : (
        <>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        HomeShare is one home for everyone who lives there. Members see the
        owner's address, systems, and schedule.
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
            {invite ? (
              <View style={styles.qrWrap}>
                <View
                  style={[
                    styles.qrCard,
                    { backgroundColor: "#FFFFFF" },
                  ]}
                  accessibilityLabel="HomeShare invite QR code"
                >
                  <QRCode
                    value={homeShareInvitePayload(invite)}
                    size={168}
                    backgroundColor="#FFFFFF"
                    color="#1A1612"
                  />
                </View>
                <Text
                  style={[styles.copyHint, { color: colors.textSecondary }]}
                >
                  They can scan this in HomeKeep → HomeShare → Scan QR.
                </Text>
              </View>
            ) : null}
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
              {isOwner ? (
                <Button
                  label="New invite code"
                  variant="ghost"
                  onPress={() => void rotateInvite()}
                  disabled={!invite || busy}
                  accessibilityLabel="Generate a new invite code"
                />
              ) : null}
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
                accessibilityLabel="Refresh HomeShare members"
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
            label="Leave HomeShare"
            variant="ghost"
            onPress={() => void leave()}
            disabled={busy}
          />
        </>
      ) : (
        <>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Creating a HomeShare and sharing an invite code needs HomeKeep +.
            Joining with a code is free.
          </Text>
          <Button
            label={busy ? "Working…" : "Create HomeShare"}
            onPress={() => void create()}
            disabled={busy}
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Or join with a code (free)
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
          <View style={styles.joinActions}>
            <Button
              label="Join"
              variant="ghost"
              onPress={() => void join()}
              disabled={busy || normalizeInviteCode(code).length < 4}
            />
            <Button
              label="Scan QR"
              variant="ghost"
              onPress={() => void openScanner()}
              disabled={busy}
              accessibilityLabel="Scan a HomeShare QR code"
            />
          </View>
        </>
      )}
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
    gap: DesignSystem.spacing.sm,
  },
  removeButton: {
    padding: 2,
  },
  qrWrap: {
    alignItems: "center",
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.xs,
    gap: DesignSystem.spacing.sm,
  },
  qrCard: {
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
  },
  joinActions: {
    marginTop: DesignSystem.spacing.sm,
    gap: DesignSystem.spacing.xs,
  },
  scanBody: {
    flex: 1,
    minHeight: 280,
  },
  cameraFrame: {
    flex: 1,
    minHeight: 280,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  cameraFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.md,
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
