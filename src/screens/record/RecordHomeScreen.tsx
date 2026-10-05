import React, { useEffect, useMemo, useState } from "react";
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
import { useCurrency } from "../../hooks/useCurrency";
import { useHaptics } from "../../hooks";
import { useQuickActions } from "../../context/QuickActionsContext";
import {
  HouseMark,
  TabHeaderAction,
  TabScreenHeader,
} from "../../components/ui";
import { RecordRow, RecordSection } from "../../components/record/RecordList";
import { EmergencyFactsModal } from "../../components/modals/emergency-facts/EmergencyFactsModal";
import { HouseholdSharingModal } from "../../components/modals/household-sharing/HouseholdSharingModal";
import {
  HouseholdMemberView,
  HouseholdService,
  formatHouseholdPeople,
} from "../../services/HouseholdService";
import { emergencyProgressSubtitle } from "../../types/homeEmergency";
import { computeSpendLedger, spendForYear } from "../../utils/spendLedger";
import {
  formatProfileAddressLines,
  formatProfileLocality,
} from "../../utils/formatProfileAddress";
import { usePlusFeature } from "../../lib/plusFeatures";
import { RecordStackParamList } from "../../navigation/types";
import { DesignSystem } from "../../theme/designSystem";

type Nav = NativeStackNavigationProp<RecordStackParamList, "RecordHome">;

const TINTS = {
  history: "#2F5D50",
  ledger: "#C45C26",
  equipment: "#5B6C8F",
  notes: "#B5739D",
  emergency: "#C0392B",
  pros: "#C49A3C",
  share: "#3E8E7E",
  pdf: "#6B645C",
};

function homeNotesSubtitle(paints: number, notes: number) {
  if (paints === 0 && notes === 0) return "Colours, codes, and house quirks";
  return [
    paints > 0 ? `${paints} colour${paints === 1 ? "" : "s"}` : null,
    notes > 0 ? `${notes} note${notes === 1 ? "" : "s"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function RecordHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { profile, homeNotes } = useProfile();
  const { triggerLight } = useHaptics();
  const { openLogRepair } = useQuickActions();
  const { format: formatMoney } = useCurrency();
  const { completions, loaded, refresh } = useRecordData();
  const equipment = useEquipmentIndex();
  const contacts = useHomeContacts();
  const { locked: recordLocked } = usePlusFeature("history");
  const [refreshing, setRefreshing] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
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
    await Promise.all([refresh(), equipment.refresh(), contacts.refresh()]);
    setRefreshing(false);
  };

  const go = (run: () => void) => {
    triggerLight();
    run();
  };

  const addressLines = formatProfileAddressLines(profile);
  const street = addressLines[0] ?? "Your home";
  const locality = formatProfileLocality(profile);
  const sinceLabel = ledger.firstRecordedAt
    ? `Recorded since ${format(ledger.firstRecordedAt, "MMMM yyyy")}`
    : "Your home's record starts with the next job";

  const householdShared = members.length > 1;

  return (
    <>
      <ScrollView
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
          title="Record"
          subtitle="Your home's history, things, and people"
          style={styles.header}
          actions={
            <TabHeaderAction
              icon="add"
              accessibilityLabel="Log a repair"
              accessibilityHint="Record a one-off repair or job"
              onPress={() => void openLogRepair()}
            />
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
            colors={[
              colors.primary + (isDark ? "26" : "14"),
              "transparent",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.heroTop}>
            <View
              style={[
                styles.heroMark,
                { backgroundColor: colors.background, borderColor: colors.border },
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
            </View>
          </View>
          <Text style={[styles.since, { color: colors.textSecondary }]}>
            {sinceLabel}
          </Text>
          <View style={[styles.stats, { borderTopColor: colors.border }]}>
            <Stat
              value={loaded ? String(ledger.jobCount) : "—"}
              label={ledger.jobCount === 1 ? "job" : "jobs"}
              onPress={() => go(() => navigation.navigate("CompletionHistory"))}
            />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <Stat
              value={loaded ? formatMoney(yearSpend, { whole: true }) : "—"}
              label={`spent ${year}`}
              locked={recordLocked}
              onPress={() => go(() => navigation.navigate("SpendLedger"))}
            />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
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
        </RecordSection>

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
            icon="color-palette"
            tint={TINTS.notes}
            title="Paint and notes"
            subtitle={homeNotesSubtitle(
              homeNotes.paints.length,
              homeNotes.notes.length
            )}
            onPress={() => go(() => navigation.navigate("HomeNotes"))}
          />
          <RecordRow
            icon="flash"
            tint={TINTS.emergency}
            title="Emergency info"
            subtitle={emergencyProgressSubtitle(
              profile?.home_emergency,
              profile?.home_systems
            )}
            onPress={() => go(() => setShowEmergency(true))}
          />
        </RecordSection>

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

      {showEmergency ? (
        <EmergencyFactsModal visible onClose={() => setShowEmergency(false)} />
      ) : null}
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
      accessibilityLabel={locked ? `${label}, HomeKeep Plus` : `${value} ${label}`}
    >
      {locked ? (
        <View style={styles.statLocked}>
          <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
        </View>
      ) : (
        <Text
          style={[styles.statValue, { color: colors.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {value}
        </Text>
      )}
      <Text style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={1}>
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
  statLabel: {
    ...DesignSystem.typography.caption,
    marginTop: 2,
  },
});
