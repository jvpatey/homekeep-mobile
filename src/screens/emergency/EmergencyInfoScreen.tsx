import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { useTasks } from "../../context/TasksContext";
import { useHaptics } from "../../hooks";
import { useRequirePlus } from "../../hooks/useRequirePlus";
import { useHomeContacts } from "../../hooks/useHomeContacts";
import { HeaderIconButton } from "../../components/ui";
import { RecordRow, RecordSection } from "../../components/record/RecordList";
import { PhotoViewerModal } from "../../components/record/PhotoViewerModal";
import {
  EmergencySpotDraft,
  EmergencySpotSheet,
} from "../../components/emergency/EmergencySpotSheet";
import {
  buildEmergencySpots,
  CUSTOM_SPOT_META,
  emergencyShareText,
  EmergencySpotView,
} from "../../components/emergency/emergencySpots";
import { deleteEmergencyPhoto } from "../../components/emergency/emergencyPhoto";
import { shareHomeText } from "../../components/home-notes/shareHomeText";
import {
  createCustomEmergencySpot,
  findOpenTasksForEmergencySpots,
  HomeEmergencyCustomSpot,
  HomeEmergencyFacts,
  MAX_CUSTOM_EMERGENCY_SPOTS,
  newlyFilledEmergencySpots,
} from "../../types/homeEmergency";
import {
  ContactTrade,
  dialablePhone,
  HomeContact,
  tradeMeta,
} from "../../types/homeContact";
import { EquipmentManualService } from "../../services/EquipmentManualService";
import { formatProfileAddressLines } from "../../utils/formatProfileAddress";
import { showActionMenu } from "../../utils/actionMenu";
import { RecordStackParamList } from "../../navigation/types";
import { DesignSystem } from "../../theme/designSystem";

type Nav = NativeStackNavigationProp<RecordStackParamList, "EmergencyInfo">;

const CALL_TRADES: ContactTrade[] = ["plumber", "electrician", "hvac"];

function newCustomSpot(): EmergencySpotView {
  const created = createCustomEmergencySpot();
  return {
    id: created.id,
    builtInKey: null,
    storageKey: `custom_${created.id}`,
    label: "",
    hint: CUSTOM_SPOT_META.hint,
    howtoHint: CUSTOM_SPOT_META.howtoHint,
    icon: CUSTOM_SPOT_META.icon,
    tint: CUSTOM_SPOT_META.tint,
    trade: null,
    note: "",
    howto: "",
    photoPath: null,
    filled: false,
  };
}

export function EmergencyInfoScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { profile, updateHomeEmergency, canEditHome } = useProfile();
  const { upcomingTasks, overdueTasks, completeTask } = useTasks();
  const { triggerLight, triggerMedium, triggerSuccess } = useHaptics();
  const requirePlus = useRequirePlus();
  const contacts = useHomeContacts();
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [viewer, setViewer] = useState<EmergencySpotView | null>(null);
  const [editor, setEditor] = useState<{
    visible: boolean;
    spot: EmergencySpotView | null;
  }>({ visible: false, spot: null });

  const facts = profile?.home_emergency ?? null;
  const spots = useMemo(
    () => buildEmergencySpots(facts, profile?.home_systems),
    [facts, profile?.home_systems]
  );
  const filledCount = spots.filter((spot) => spot.filled).length;
  const customCount = facts?.custom?.length ?? 0;
  const canAddCustom = canEditHome && customCount < MAX_CUSTOM_EMERGENCY_SPOTS;

  const callContacts = useMemo(() => {
    const byTrade = new Map<ContactTrade, HomeContact>();
    const sorted = [...contacts.items].sort((a, b) =>
      (b.last_used_at ?? "").localeCompare(a.last_used_at ?? "")
    );
    for (const contact of sorted) {
      if (contact.trade && !byTrade.has(contact.trade)) {
        byTrade.set(contact.trade, contact);
      }
    }
    return CALL_TRADES.map((trade) => ({
      trade,
      contact: byTrade.get(trade) ?? null,
    }));
  }, [contacts.items]);

  const photoKey = spots
    .map((spot) => spot.photoPath)
    .filter(Boolean)
    .join("|");

  useEffect(() => {
    const missing = spots
      .map((spot) => spot.photoPath)
      .filter((path): path is string => Boolean(path) && !photoUrls[path!]);
    if (missing.length === 0) return;
    let cancelled = false;
    void EquipmentManualService.createSignedUrls(missing).then((map) => {
      if (cancelled || map.size === 0) return;
      setPhotoUrls((prev) => ({ ...prev, ...Object.fromEntries(map) }));
    });
    return () => {
      cancelled = true;
    };
    // Re-sign only when the set of photo paths changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoKey]);

  const openEditor = async (spot: EmergencySpotView) => {
    if (!canEditHome) return;
    triggerLight();
    if (!(await requirePlus())) return;
    setEditor({ visible: true, spot });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: canAddCustom
        ? () => (
            <HeaderIconButton
              icon="add"
              accessibilityLabel="Add a custom spot"
              onPress={() => void openEditor(newCustomSpot())}
            />
          )
        : undefined,
    });
  });

  const address = formatProfileAddressLines(profile)[0] ?? null;

  const share = () => {
    triggerLight();
    const text = emergencyShareText(
      spots,
      address,
      callContacts
        .filter((row) => row.contact)
        .map((row) => ({
          label: tradeMeta(row.trade).label,
          name: row.contact!.company || row.contact!.name,
          phone: row.contact!.phone,
        }))
    );
    void shareHomeText(text, "Emergency info");
  };

  const shareSpot = (spot: EmergencySpotView) =>
    void shareHomeText(emergencyShareText([spot], address, []), spot.label);

  const promptRelatedTasks = (
    previous: HomeEmergencyFacts,
    next: HomeEmergencyFacts
  ) => {
    const keys = newlyFilledEmergencySpots(previous, next);
    const related = findOpenTasksForEmergencySpots(
      [...overdueTasks, ...upcomingTasks],
      keys
    );
    if (related.length === 0) return;
    const list = related.map((task) => `• ${task.title}`).join("\n");
    setTimeout(() => {
      Alert.alert(
        "Mark related tasks done?",
        `You just saved this spot:\n\n${list}\n\nMark ${
          related.length === 1 ? "it" : "them"
        } complete on your schedule?`,
        [
          { text: "Not now", style: "cancel" },
          {
            text: related.length === 1 ? "Mark done" : "Mark all done",
            onPress: () => {
              void (async () => {
                for (const task of related) {
                  await completeTask(task.instance_id, {
                    notes: "Recorded in emergency info",
                    labor_type: "diy",
                  });
                }
              })();
            },
          },
        ]
      );
    }, 450);
  };

  const persist = async (next: HomeEmergencyFacts) => {
    const result = await updateHomeEmergency(next);
    if (!result.success) {
      Alert.alert("Couldn't save", result.error ?? "Please try again.");
      return false;
    }
    triggerSuccess();
    return true;
  };

  const saveSpot = async (
    spot: EmergencySpotView,
    draft: EmergencySpotDraft
  ) => {
    const previous = facts ?? {};
    const next: HomeEmergencyFacts = { ...previous };
    const payload = {
      note: draft.note || null,
      howto: draft.howto || null,
      photo_storage_path: draft.photoPath,
    };
    const filled = Boolean(draft.note || draft.howto || draft.photoPath);
    if (spot.builtInKey) {
      next[spot.builtInKey] = filled ? payload : null;
    } else {
      const entry: HomeEmergencyCustomSpot = {
        id: spot.id,
        label: draft.label || "Custom spot",
        ...payload,
      };
      const list = [...(previous.custom ?? [])];
      const index = list.findIndex((item) => item.id === spot.id);
      if (index >= 0) list[index] = entry;
      else list.push(entry);
      next.custom = list;
    }
    const ok = await persist(next);
    if (!ok) return false;
    if (user && spot.photoPath !== draft.photoPath) {
      deleteEmergencyPhoto(user.id, spot.photoPath);
    }
    promptRelatedTasks(previous, next);
    return true;
  };

  const clearSpot = (spot: EmergencySpotView) => {
    triggerMedium();
    const isCustom = spot.builtInKey == null;
    Alert.alert(
      isCustom ? `Delete “${spot.label}”?` : `Clear ${spot.label}?`,
      isCustom
        ? "This spot and its photo will be removed."
        : "The location, steps, and photo will be removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isCustom ? "Delete" : "Clear",
          style: "destructive",
          onPress: async () => {
            const previous = facts ?? {};
            const next: HomeEmergencyFacts = { ...previous };
            if (spot.builtInKey) next[spot.builtInKey] = null;
            else
              next.custom = (previous.custom ?? []).filter(
                (item) => item.id !== spot.id
              );
            if (!(await persist(next))) return;
            if (user) deleteEmergencyPhoto(user.id, spot.photoPath);
            setEditor((prev) => ({ ...prev, visible: false }));
          },
        },
      ]
    );
  };

  const openSpotMenu = (spot: EmergencySpotView) => {
    triggerMedium();
    const photo = spot.photoPath ? photoUrls[spot.photoPath] : null;
    showActionMenu({
      title: spot.label,
      options: [
        ...(canEditHome
          ? [
              {
                label: "Edit",
                icon: "create-outline" as const,
                onPress: () => void openEditor(spot),
              },
            ]
          : []),
        ...(photo
          ? [
              {
                label: "View photo",
                icon: "expand-outline" as const,
                onPress: () => setViewer(spot),
              },
            ]
          : []),
        {
          label: "Share…",
          icon: "share-outline",
          onPress: () => shareSpot(spot),
        },
        ...(canEditHome
          ? [
              {
                label: spot.builtInKey ? "Clear spot" : "Delete spot",
                icon: "trash-outline" as const,
                destructive: true,
                onPress: () => clearSpot(spot),
              },
            ]
          : []),
      ],
    });
  };

  const call = (contact: HomeContact) => {
    const phone = dialablePhone(contact.phone);
    if (!phone) return;
    triggerLight();
    void Linking.openURL(`tel:${phone}`);
  };

  const total = spots.length;
  const progress = total > 0 ? filledCount / total : 0;
  const allSaved = total > 0 && filledCount === total;

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <View
          style={[
            styles.hero,
            { backgroundColor: colors.surface, borderColor: colors.border },
            DesignSystem.shadows.softKey,
          ]}
        >
          <LinearGradient
            colors={[colors.error + (isDark ? "2A" : "16"), "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.heroTop}>
            <View
              style={[
                styles.heroMark,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={24}
                color={colors.error}
              />
            </View>
            <View style={styles.heroText}>
              <Text style={[styles.heroTitle, { color: colors.text }]}>
                When something goes wrong
              </Text>
              <Text style={[styles.heroBody, { color: colors.textSecondary }]}>
                Where to shut off water, power, and gas, with photos, so anyone
                at home can act fast.
              </Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: colors.fieldFill },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(progress * 100)}%`,
                    backgroundColor: allSaved ? colors.success : colors.primary,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.progressText,
                { color: allSaved ? colors.success : colors.textSecondary },
              ]}
            >
              {allSaved ? "All saved" : `${filledCount} of ${total} saved`}
            </Text>
          </View>

          <Pressable
            onPress={share}
            disabled={filledCount === 0}
            style={({ pressed }) => [
              styles.shareButton,
              {
                backgroundColor: colors.primary + "14",
                borderColor: colors.primary + "40",
              },
              filledCount === 0 && { opacity: 0.45 },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Share emergency info"
            accessibilityHint="Send locations and steps to a sitter or family member"
          >
            <Ionicons name="share-outline" size={17} color={colors.primary} />
            <Text style={[styles.shareText, { color: colors.primary }]}>
              Share with a sitter or family
            </Text>
          </Pressable>
        </View>

        {spots.map((spot) =>
          spot.filled ? (
            <SpotCard
              key={spot.id}
              spot={spot}
              photoUri={
                spot.photoPath ? (photoUrls[spot.photoPath] ?? null) : null
              }
              canEdit={canEditHome}
              onPress={() => void openEditor(spot)}
              onMore={() => openSpotMenu(spot)}
              onViewPhoto={() => setViewer(spot)}
            />
          ) : (
            <EmptySpotRow
              key={spot.id}
              spot={spot}
              canEdit={canEditHome}
              onPress={() => void openEditor(spot)}
            />
          )
        )}

        {canAddCustom ? (
          <Pressable
            onPress={() => void openEditor(newCustomSpot())}
            style={({ pressed }) => [
              styles.addCustom,
              { borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.addCustomText, { color: colors.primary }]}>
              Add a custom spot
            </Text>
          </Pressable>
        ) : null}

        <RecordSection
          title="Who to call"
          footer="Pulled from your saved pros. The most recently used one in each trade shows here."
          style={styles.callSection}
        >
          {callContacts.map(({ trade, contact }) => {
            const meta = tradeMeta(trade);
            const phone = contact ? dialablePhone(contact.phone) : null;
            return (
              <RecordRow
                key={trade}
                icon={meta.icon}
                tint={meta.tint}
                title={contact ? contact.company || contact.name : meta.label}
                subtitle={
                  contact
                    ? [meta.label, contact.phone].filter(Boolean).join(" · ")
                    : `Add a ${meta.label.toLowerCase()}`
                }
                showChevron={!phone}
                onPress={() => {
                  if (contact && phone) call(contact);
                  else if (contact)
                    navigation.navigate("ProDetail", { contactId: contact.id });
                  else navigation.navigate("Pros");
                }}
                trailing={
                  phone ? (
                    <View
                      style={[
                        styles.callButton,
                        { backgroundColor: colors.success + "1F" },
                      ]}
                    >
                      <Ionicons name="call" size={16} color={colors.success} />
                    </View>
                  ) : undefined
                }
                accessibilityLabel={
                  contact && phone
                    ? `Call ${contact.company || contact.name}, ${meta.label}`
                    : undefined
                }
              />
            );
          })}
        </RecordSection>

        {!canEditHome ? (
          <Text style={[styles.memberNote, { color: colors.textSecondary }]}>
            Only the home's owner can edit emergency info.
          </Text>
        ) : null}
      </ScrollView>

      <EmergencySpotSheet
        visible={editor.visible}
        spot={editor.spot}
        photoUri={
          editor.spot?.photoPath
            ? (photoUrls[editor.spot.photoPath] ?? null)
            : null
        }
        onClose={() => setEditor((prev) => ({ ...prev, visible: false }))}
        onSave={(draft) =>
          editor.spot ? saveSpot(editor.spot, draft) : Promise.resolve(false)
        }
        onDelete={
          editor.spot?.filled ? () => clearSpot(editor.spot!) : undefined
        }
      />
      <PhotoViewerModal
        visible={viewer != null}
        uri={viewer?.photoPath ? (photoUrls[viewer.photoPath] ?? null) : null}
        title={viewer?.label}
        subtitle={viewer?.note || undefined}
        onClose={() => setViewer(null)}
      />
    </>
  );
}

function SpotCard({
  spot,
  photoUri,
  canEdit,
  onPress,
  onMore,
  onViewPhoto,
}: {
  spot: EmergencySpotView;
  photoUri: string | null;
  canEdit: boolean;
  onPress: () => void;
  onMore: () => void;
  onViewPhoto: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={canEdit ? onPress : undefined}
      onLongPress={onMore}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        DesignSystem.shadows.softAmbient,
        pressed && canEdit && { opacity: 0.9 },
      ]}
      accessibilityRole={canEdit ? "button" : undefined}
      accessibilityHint={canEdit ? "Opens this spot to edit" : undefined}
    >
      {spot.photoPath ? (
        <Pressable
          onPress={onViewPhoto}
          style={[styles.cardPhoto, { backgroundColor: spot.tint + "14" }]}
          accessibilityRole="imagebutton"
          accessibilityLabel={`Photo of ${spot.label}. Opens full screen`}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.cardPhotoImage} />
          ) : (
            <Ionicons name="image-outline" size={28} color={spot.tint} />
          )}
          <View style={styles.expandBadge}>
            <Ionicons name="expand" size={13} color="#FFFFFF" />
          </View>
        </Pressable>
      ) : null}

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View
            style={[styles.iconBadge, { backgroundColor: spot.tint + "22" }]}
          >
            <Ionicons name={spot.icon} size={17} color={spot.tint} />
          </View>
          <Text
            style={[styles.cardTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {spot.label}
          </Text>
          <Pressable
            onPress={onMore}
            hitSlop={10}
            style={styles.moreHit}
            accessibilityRole="button"
            accessibilityLabel={`More options for ${spot.label}`}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        {spot.safety ? (
          <View
            style={[
              styles.safety,
              {
                backgroundColor: colors.error + "12",
                borderColor: colors.error + "33",
              },
            ]}
          >
            <Ionicons name="warning" size={15} color={colors.error} />
            <Text style={[styles.safetyText, { color: colors.text }]}>
              {spot.safety}
            </Text>
          </View>
        ) : null}

        {spot.note.trim() ? (
          <Fact label="Where" value={spot.note.trim()} />
        ) : null}
        {spot.howto.trim() ? (
          <Fact
            label={spot.builtInKey ? "How to shut it off" : "What to do"}
            value={spot.howto.trim()}
          />
        ) : null}

        {!spot.photoPath && canEdit ? (
          <Pressable
            onPress={onPress}
            hitSlop={6}
            style={styles.addPhoto}
            accessibilityRole="button"
          >
            <Ionicons name="camera-outline" size={15} color={colors.primary} />
            <Text style={[styles.addPhotoText, { color: colors.primary }]}>
              Add a photo
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.fact}>
      <Text style={[styles.factLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.factValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function EmptySpotRow({
  spot,
  canEdit,
  onPress,
}: {
  spot: EmergencySpotView;
  canEdit: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={canEdit ? onPress : undefined}
      style={({ pressed }) => [
        styles.emptyRow,
        { borderColor: colors.border },
        pressed && canEdit && { opacity: 0.7 },
      ]}
      accessibilityRole={canEdit ? "button" : undefined}
      accessibilityLabel={`${spot.label}. ${canEdit ? "Not added yet. Add it" : "Not added yet"}`}
    >
      <View style={[styles.iconBadge, { backgroundColor: spot.tint + "1A" }]}>
        <Ionicons name={spot.icon} size={17} color={spot.tint} />
      </View>
      <View style={styles.emptyText}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {spot.label}
        </Text>
        <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
          {canEdit ? "Add where it is and how to shut it off" : "Not added yet"}
        </Text>
      </View>
      {canEdit ? (
        <View
          style={[styles.addCircle, { backgroundColor: colors.primary + "18" }]}
        >
          <Ionicons name="add" size={18} color={colors.primary} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.xxl,
  },
  hero: {
    borderRadius: DesignSystem.borders.radius.xlarge,
    borderWidth: StyleSheet.hairlineWidth,
    padding: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.lg,
    overflow: "hidden",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignSystem.spacing.md,
  },
  heroMark: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  heroTitle: {
    ...DesignSystem.typography.title2,
    fontSize: 21,
    lineHeight: 27,
  },
  heroBody: {
    ...DesignSystem.typography.footnote,
    lineHeight: 19,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm + 2,
    marginTop: DesignSystem.spacing.lg,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    ...DesignSystem.typography.captionSemiBold,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DesignSystem.spacing.xs + 2,
    marginTop: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 4,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  shareText: {
    ...DesignSystem.typography.bodySemiBold,
  },
  card: {
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: DesignSystem.spacing.sm + 4,
  },
  cardPhoto: {
    aspectRatio: 16 / 9,
    alignItems: "center",
    justifyContent: "center",
  },
  cardPhotoImage: {
    width: "100%",
    height: "100%",
  },
  expandBadge: {
    position: "absolute",
    right: DesignSystem.spacing.sm,
    bottom: DesignSystem.spacing.sm,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm + 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm + 2,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    ...DesignSystem.typography.bodySemiBold,
    fontSize: 17,
    flex: 1,
  },
  moreHit: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -DesignSystem.spacing.xs,
  },
  safety: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.sm + 2,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  safetyText: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
    flex: 1,
  },
  fact: {
    gap: 2,
  },
  factLabel: {
    ...DesignSystem.typography.captionSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  factValue: {
    ...DesignSystem.typography.body,
    lineHeight: 23,
  },
  addPhoto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
  },
  addPhotoText: {
    ...DesignSystem.typography.smallSemiBold,
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm + 4,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm + 4,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyText: {
    flex: 1,
    minWidth: 0,
  },
  emptyTitle: {
    ...DesignSystem.typography.bodySemiBold,
  },
  emptyHint: {
    ...DesignSystem.typography.footnote,
    marginTop: 1,
  },
  addCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addCustom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addCustomText: {
    ...DesignSystem.typography.bodySemiBold,
  },
  callSection: {
    marginTop: DesignSystem.spacing.xl,
  },
  callButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  memberNote: {
    ...DesignSystem.typography.footnote,
    textAlign: "center",
  },
});
