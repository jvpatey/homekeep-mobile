import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { useRecordData } from "../../hooks/useRecordData";
import { useEquipmentIndex } from "../../hooks/useEquipmentIndex";
import { useHomeContacts } from "../../hooks/useHomeContacts";
import { useHomeDocuments } from "../../hooks/useHomeDocuments";
import { useCurrency } from "../../hooks/useCurrency";
import { useHaptics } from "../../hooks";
import { useQuickActions } from "../../context/QuickActionsContext";
import {
  HouseMark,
  TabHeaderAction,
  TabScreenHeader,
} from "../../components/ui";
import { RecordRow, RecordSection } from "../../components/record/RecordList";
import { KeeperHeaderButton } from "../../components/assistant/KeeperHeaderButton";
import { HouseholdSharingModal } from "../../components/modals/household-sharing/HouseholdSharingModal";
import {
  HouseholdMemberView,
  HouseholdService,
  formatHouseholdPeople,
} from "../../services/HouseholdService";
import {
  countFilledEmergencySpots,
  emergencyProgressSubtitle,
} from "../../types/homeEmergency";
import {
  HomeRecordItemKey,
  homeRecordProgress,
} from "../../utils/homeRecordProgress";
import { computeSpendLedger, spendForYear } from "../../utils/spendLedger";
import {
  formatProfileAddressLines,
  formatProfileLocality,
} from "../../utils/formatProfileAddress";
import { usePlusFeature } from "../../lib/plusFeatures";
import { showActionMenu } from "../../utils/actionMenu";
import { formatHomeAge } from "../../data/maintenancePlans";
import { RecordStackParamList } from "../../navigation/types";
import { DesignSystem } from "../../theme/designSystem";

type Nav = NativeStackNavigationProp<RecordStackParamList, "RecordHome">;

const TINTS = {
  history: "#2F5D50",
  ledger: "#C45C26",
  equipment: "#5B6C8F",
  documents: "#7A6A4F",
  paint: "#B5739D",
  notes: "#3E7CB1",
  emergency: "#C0392B",
  pros: "#C49A3C",
  share: "#3E8E7E",
  pdf: "#6B645C",
  review: "#A0522D",
};

type RecordSectionKey = "things" | "people";

const SECTION_FOR: Record<HomeRecordItemKey, RecordSectionKey> = {
  emergency: "things",
  equipment: "things",
  documents: "things",
  notes: "things",
  pros: "people",
  homeShare: "people",
};

function countSubtitle(count: number, noun: string, empty: string) {
  return count > 0 ? `${count} ${noun}${count === 1 ? "" : "s"} saved` : empty;
}

export function RecordHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { profile, homeNotes } = useProfile();
  const { triggerLight } = useHaptics();
  const { openLogRepair, openScheduleRepair } = useQuickActions();
  const { format: formatMoney } = useCurrency();
  const { completions, loaded, refresh } = useRecordData();
  const equipment = useEquipmentIndex();
  const contacts = useHomeContacts();
  const { locked: recordLocked } = usePlusFeature("history");
  const documents = useHomeDocuments();
  const { locked: documentsLocked } = usePlusFeature("documents");
  const [refreshing, setRefreshing] = useState(false);
  const [showHomeShare, setShowHomeShare] = useState(false);
  const [members, setMembers] = useState<HouseholdMemberView[]>([]);

  const year = new Date().getFullYear();
  const ledger = useMemo(() => computeSpendLedger(completions), [completions]);
  const yearSpend = spendForYear(ledger, year)?.total ?? 0;

  useEffect(() => {
    const householdId = profile?.household_id;
    if (!householdId || !user) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    void HouseholdService.listMembersDetailed(householdId, {
      id: user.id,
      fullName: profile?.full_name ?? null,
      email: user.email ?? null,
    }).then((result) => {
      if (!cancelled) setMembers(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.household_id, profile?.full_name, user, showHomeShare]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refresh(),
      equipment.refresh(),
      contacts.refresh(),
      documents.refresh(),
    ]);
    setRefreshing(false);
  };

  const go = (run: () => void) => {
    triggerLight();
    run();
  };

  const addressLines = formatProfileAddressLines(profile);
  const street = addressLines[0] ?? "Your home";
  const locality = formatProfileLocality(profile);
  const homeAgeLabel = formatHomeAge(profile?.home_systems);
  const sinceLabel = ledger.firstRecordedAt
    ? `Recorded since ${format(ledger.firstRecordedAt, "MMMM yyyy")}`
    : "Your home's record starts with the next job";

  const householdShared = members.length > 1;

  const emergencyCount = countFilledEmergencySpots(
    profile?.home_emergency,
    profile?.home_systems
  );
  const recordProgress = homeRecordProgress({
    emergencyComplete:
      emergencyCount.total > 0 && emergencyCount.filled === emergencyCount.total,
    equipmentCount: equipment.items.length,
    documentCount: documents.items.length,
    proCount: contacts.items.length,
    noteCount: homeNotes.notes.length,
    paintCount: homeNotes.paints.length,
    householdShared,
  });
  const firstMissing = recordProgress.items.find((item) => !item.done);

  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Partial<Record<RecordSectionKey, number>>>({});
  const scrollToFirstMissing = () => {
    if (!firstMissing) return;
    const y = sectionY.current[SECTION_FOR[firstMissing.key]];
    if (y == null) return;
    triggerLight();
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
  };

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={{ backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <TabScreenHeader
          title="My Home"
          subtitle="Your home's history, things, and people"
          style={styles.header}
          actions={
            <>
              <KeeperHeaderButton />
              <TabHeaderAction
                icon="add"
                accessibilityLabel="Add a repair"
                accessibilityHint="Log a repair you did, or schedule one to fix later"
                onPress={() =>
                  showActionMenu({
                    options: [
                      {
                        label: "Log a repair",
                        icon: "hammer-outline",
                        subtitle: "Already done",
                        onPress: () => void openLogRepair(),
                      },
                      {
                        label: "Schedule a repair",
                        icon: "construct-outline",
                        subtitle: "Needs fixing",
                        onPress: () => void openScheduleRepair(),
                      },
                    ],
                  })
                }
              />
            </>
          }
        />
        <View
          style={[
            styles.hero,
            { backgroundColor: colors.surface, borderColor: colors.border },
            DesignSystem.shadows.softKey,
          ]}
        >
          <LinearGradient
            colors={[colors.primary + (isDark ? "26" : "14"), "transparent"]}
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
              <HouseMark size={26} inline />
            </View>
            <View style={styles.heroText}>
              <Text
                style={[styles.heroTitle, { color: colors.text }]}
                numberOfLines={2}
              >
                {street}
              </Text>
              {locality ? (
                <Text
                  style={[styles.heroLocality, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {locality}
                </Text>
              ) : null}
              {homeAgeLabel ? (
                <Text
                  style={[styles.heroLocality, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {homeAgeLabel}
                </Text>
              ) : null}
            </View>
          </View>
          <Text style={[styles.since, { color: colors.textSecondary }]}>
            {sinceLabel}
          </Text>
          <Pressable
            onPress={scrollToFirstMissing}
            disabled={!firstMissing}
            style={({ pressed }) => [
              styles.progress,
              pressed && { opacity: 0.6 },
            ]}
            accessibilityRole={firstMissing ? "button" : "text"}
            accessibilityLabel={`Home record ${recordProgress.done} of ${recordProgress.total} complete${
              firstMissing ? `. Next: ${firstMissing.label}` : ""
            }`}
          >
            <View style={styles.progressTop}>
              <Text style={[styles.progressLabel, { color: colors.text }]}>
                Home record
              </Text>
              <Text
                style={[styles.progressCount, { color: colors.textSecondary }]}
              >
                {recordProgress.done} of {recordProgress.total}
                {firstMissing ? ` · Next: ${firstMissing.label}` : " · Complete"}
              </Text>
            </View>
            <View
              style={[styles.progressTrack, { backgroundColor: colors.fieldFill }]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(recordProgress.done / recordProgress.total) * 100}%`,
                    backgroundColor: colors.secondary,
                  },
                ]}
              />
            </View>
          </Pressable>
          <View style={[styles.stats, { borderTopColor: colors.border }]}>
            <Stat
              value={loaded ? String(ledger.jobCount) : "—"}
              label={ledger.jobCount === 1 ? "job" : "jobs"}
              onPress={() => go(() => navigation.navigate("CompletionHistory"))}
            />
            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />
            <Stat
              value={loaded ? formatMoney(yearSpend, { whole: true }) : "—"}
              label={`spent ${year}`}
              locked={recordLocked}
              onPress={() => go(() => navigation.navigate("SpendLedger"))}
            />
            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />
            <Stat
              value={equipment.loaded ? String(equipment.items.length) : "—"}
              label={equipment.items.length === 1 ? "appliance" : "appliances"}
              onPress={() => go(() => navigation.navigate("EquipmentList"))}
            />
          </View>
        </View>

        <RecordSection title="History">
          <RecordRow
            icon="time"
            tint={TINTS.history}
            title="Completion history"
            subtitle={
              ledger.jobCount > 0
                ? `${ledger.jobCount} job${ledger.jobCount === 1 ? "" : "s"} recorded`
                : "Every finished job, with notes and photos"
            }
            locked={recordLocked}
            onPress={() => go(() => navigation.navigate("CompletionHistory"))}
          />
          <RecordRow
            icon="wallet"
            tint={TINTS.ledger}
            title="Spend ledger"
            subtitle={
              ledger.hasAnyCost && !recordLocked
                ? `${formatMoney(yearSpend)} this year`
                : "Costs by year and category"
            }
            locked={recordLocked}
            onPress={() => go(() => navigation.navigate("SpendLedger"))}
          />
          <RecordRow
            icon="sparkles"
            tint={TINTS.review}
            title="Year in review"
            subtitle="Your year of upkeep, ready to share"
            onPress={() => go(() => navigation.navigate("YearInReview"))}
          />
        </RecordSection>

        <View
          onLayout={(e) => {
            sectionY.current.things = e.nativeEvent.layout.y;
          }}
        />
        <RecordSection title="Things">
          <RecordRow
            icon="cube"
            tint={TINTS.equipment}
            title="Equipment"
            subtitle={
              equipment.items.length > 0
                ? `${equipment.items.length} item${equipment.items.length === 1 ? "" : "s"} · manuals, parts, warranties`
                : "Manuals, parts, and warranties"
            }
            onPress={() => go(() => navigation.navigate("EquipmentList"))}
          />
          <RecordRow
            icon="folder-open"
            tint={TINTS.documents}
            title="Documents"
            subtitle={
              documents.items.length > 0
                ? `${documents.items.length} saved · insurance, inspections, permits`
                : "Insurance, inspections, closing papers, permits"
            }
            locked={documentsLocked}
            onPress={() => go(() => navigation.navigate("DocumentVault"))}
          />
          <RecordRow
            icon="color-palette"
            tint={TINTS.paint}
            title="Paint colours"
            subtitle={countSubtitle(
              homeNotes.paints.length,
              "colour",
              "Brands, codes, and finishes by room",
            )}
            onPress={() => go(() => navigation.navigate("PaintColors"))}
          />
          <RecordRow
            icon="document-text"
            tint={TINTS.notes}
            title="House notes"
            subtitle={countSubtitle(
              homeNotes.notes.length,
              "note",
              "Wi‑Fi, codes, trash day, and quirks",
            )}
            onPress={() => go(() => navigation.navigate("HouseNotes"))}
          />
          <RecordRow
            icon="flash"
            tint={TINTS.emergency}
            title="Emergency info"
            subtitle={emergencyProgressSubtitle(
              profile?.home_emergency,
              profile?.home_systems,
            )}
            onPress={() => go(() => navigation.navigate("EmergencyInfo"))}
          />
        </RecordSection>

        <View
          onLayout={(e) => {
            sectionY.current.people = e.nativeEvent.layout.y;
          }}
        />
        <RecordSection title="People">
          <RecordRow
            icon="call"
            tint={TINTS.pros}
            title="Pros"
            subtitle={
              contacts.items.length > 0
                ? `${contacts.items.length} saved · tap to call`
                : "Plumber, electrician, and who to call"
            }
            locked={recordLocked}
            onPress={() => go(() => navigation.navigate("Pros"))}
          />
          <RecordRow
            icon="people"
            tint={TINTS.share}
            title="HomeShare"
            subtitle={
              householdShared
                ? formatHouseholdPeople(members, user?.id)
                : "Share the home with everyone who lives there"
            }
            locked={recordLocked && !householdShared}
            onPress={() => go(() => setShowHomeShare(true))}
          />
        </RecordSection>

        <RecordSection
          title="Share"
          footer="A tidy history of the home for buyers, insurers, and your own files."
        >
          <RecordRow
            icon="document-text"
            tint={TINTS.pdf}
            title="Home history PDF"
            subtitle="Preview and export"
            locked={recordLocked}
            onPress={() => go(() => navigation.navigate("HomeSummaryPreview"))}
          />
        </RecordSection>
      </ScrollView>

      <HouseholdSharingModal
        visible={showHomeShare}
        onClose={() => setShowHomeShare(false)}
      />
    </>
  );
}

function Stat({
  value,
  label,
  onPress,
  locked,
}: {
  value: string;
  label: string;
  onPress: () => void;
  locked?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.stat, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={
        locked ? `${label}, HomeKeep Plus` : `${value} ${label}`
      }
    >
      {locked ? (
        <View style={styles.statLocked}>
          <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
        </View>
      ) : (
        <Text
          style={[
            styles.statValue,
            { color: colors.text },
            value.length >= 10
              ? styles.statValueSmall
              : value.length >= 8 && styles.statValueMedium,
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
      )}
      <Text
        style={[styles.statLabel, { color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  statLocked: {
    height: 28,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.xxl,
  },
  header: {
    marginHorizontal: -DesignSystem.spacing.md,
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
    alignItems: "center",
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
  },
  heroTitle: {
    ...DesignSystem.typography.title2,
  },
  heroLocality: {
    ...DesignSystem.typography.footnote,
    marginTop: 2,
  },
  since: {
    ...DesignSystem.typography.footnote,
    marginTop: DesignSystem.spacing.md,
  },
  progress: {
    marginTop: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.xs + 2,
  },
  progressTop: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: DesignSystem.spacing.sm,
  },
  progressLabel: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
  },
  progressCount: {
    ...DesignSystem.typography.caption,
    flexShrink: 1,
    textAlign: "right",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.xs,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
  },
  statValue: {
    fontFamily: DesignSystem.fonts.displaySemiBold,
    fontSize: 22,
    lineHeight: 28,
    fontVariant: ["tabular-nums"],
  },
  // Sized by length rather than adjustsFontSizeToFit, which iOS can collapse
  // to a sliver when the flex column is measured before it has a width.
  statValueMedium: {
    fontSize: 18,
  },
  statValueSmall: {
    fontSize: 15,
  },
  statLabel: {
    ...DesignSystem.typography.caption,
    marginTop: 2,
  },
});
