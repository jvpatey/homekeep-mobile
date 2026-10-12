import React, { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { format } from "date-fns";
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
  ScrollAtmosphere,
  SectionHeader,
  TabHeaderAction,
  TabScreenHeader,
} from "../../components/ui";
import { useEnter } from "../../components/ui/hero/heroKit";
import { RecordRow, RecordSection } from "../../components/record/RecordList";
import { KeeperHeaderButton } from "../../components/assistant/KeeperHeaderButton";
import { HouseholdSharingModal } from "../../components/modals/household-sharing/HouseholdSharingModal";
import {
  EmergencyQuickCard,
  HeadsUpCard,
  HomeIdentityHero,
  MemberAvatars,
  RecentWorkStrip,
  RecordChecklistCard,
  ThingsGrid,
} from "../../components/myHome";
import {
  HouseholdMemberView,
  HouseholdService,
  formatHouseholdPeople,
} from "../../services/HouseholdService";
import { countFilledEmergencySpots } from "../../types/homeEmergency";
import {
  HomeRecordItemKey,
  homeRecordProgress,
} from "../../utils/homeRecordProgress";
import { HeadsUpItem, homeHeadsUp } from "../../utils/homeHeadsUp";
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

const GRID_TINTS = {
  paint: "#B5739D",
  notes: "#3E7CB1",
};

/** Entrance motion plays on the first My Home render of each app session. */
let enteredThisSession = false;

export function RecordHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { profile, homeNotes } = useProfile();
  const { triggerLight } = useHaptics();
  const { openLogRepair, openScheduleRepair } = useQuickActions();
  const { format: formatMoney } = useCurrency();
  const { completions, loaded, refresh } = useRecordData();
  const equipment = useEquipmentIndex();
  const contacts = useHomeContacts();
  const history = usePlusFeature("history");
  const recordLocked = history.locked;
  const documents = useHomeDocuments();
  const { locked: documentsLocked } = usePlusFeature("documents");
  const [refreshing, setRefreshing] = useState(false);
  const [showHomeShare, setShowHomeShare] = useState(false);
  const [members, setMembers] = useState<HouseholdMemberView[]>([]);
  const enter = useEnter();

  const [animateIn] = useState(() => !enteredThisSession);
  useEffect(() => {
    enteredThisSession = true;
  }, []);
  const entering = (index: number) =>
    animateIn ? enter(80 + index * 70) : undefined;

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
  const recordLoaded = equipment.loaded && documents.loaded;

  const headsUp = useMemo(
    () => homeHeadsUp(equipment.items, documents.items),
    [equipment.items, documents.items]
  );

  const startRecordItem = (key: HomeRecordItemKey) => {
    switch (key) {
      case "emergency":
        navigation.navigate("EmergencyInfo");
        return;
      case "equipment":
        navigation.navigate("EquipmentList");
        return;
      case "documents":
        navigation.navigate("DocumentVault");
        return;
      case "pros":
        navigation.navigate("Pros");
        return;
      case "notes":
        navigation.navigate("HouseNotes");
        return;
      case "homeShare":
        setShowHomeShare(true);
        return;
    }
  };

  const openHeadsUp = (item: HeadsUpItem) => {
    if (item.kind === "warranty") {
      navigation.navigate("EquipmentDetail", { equipmentId: item.targetId });
    } else {
      navigation.navigate("DocumentVault");
    }
  };

  let section = 0;

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <ScrollAtmosphere />
        <TabScreenHeader
          eyebrow={locality ?? undefined}
          title="My Home"
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

        <View style={styles.content}>
          <Animated.View entering={entering(section++)}>
            <HomeIdentityHero
              street={street}
              meta={homeAgeLabel}
              sinceLabel={sinceLabel}
              stats={[
                {
                  value: loaded ? String(ledger.jobCount) : "—",
                  label: ledger.jobCount === 1 ? "job" : "jobs",
                  onPress: () => navigation.navigate("CompletionHistory"),
                },
                {
                  value: loaded ? formatMoney(yearSpend, { whole: true }) : "—",
                  label: `spent ${year}`,
                  locked: recordLocked,
                  onPress: () => navigation.navigate("SpendLedger"),
                },
                {
                  value: equipment.loaded ? String(equipment.items.length) : "—",
                  label:
                    equipment.items.length === 1 ? "appliance" : "appliances",
                  onPress: () => navigation.navigate("EquipmentList"),
                },
              ]}
            />
          </Animated.View>

          {recordLoaded && recordProgress.done < recordProgress.total ? (
            <Animated.View entering={entering(section++)}>
              <RecordChecklistCard
                items={recordProgress.items}
                done={recordProgress.done}
                total={recordProgress.total}
                onStart={startRecordItem}
              />
            </Animated.View>
          ) : null}

          <Animated.View entering={entering(section++)}>
            <EmergencyQuickCard
              facts={profile?.home_emergency}
              home={profile?.home_systems}
              onPress={() => navigation.navigate("EmergencyInfo")}
            />
          </Animated.View>

          {headsUp.items.length > 0 ? (
            <Animated.View entering={entering(section++)}>
              <HeadsUpCard
                items={headsUp.items}
                total={headsUp.total}
                onPressItem={openHeadsUp}
              />
            </Animated.View>
          ) : null}

          <Animated.View entering={entering(section++)}>
            <RecentWorkStrip
              completions={completions}
              loaded={loaded}
              locked={recordLocked}
              onOpenHistory={() => navigation.navigate("CompletionHistory")}
              onUnlock={() => void history.unlock()}
              onLogRepair={() => void openLogRepair()}
            />
          </Animated.View>

          <Animated.View entering={entering(section++)}>
            <ThingsGrid
              tiles={[
                {
                  icon: "cube",
                  tint: colors.secondary,
                  title: "Equipment",
                  count: equipment.loaded ? equipment.items.length : null,
                  descriptor: "Manuals, parts, warranties",
                  onPress: () => navigation.navigate("EquipmentList"),
                },
                {
                  icon: "folder-open",
                  tint: colors.warning,
                  title: "Documents",
                  count: documents.loaded ? documents.items.length : null,
                  descriptor: "Insurance, inspections, permits",
                  locked: documentsLocked,
                  onPress: () => navigation.navigate("DocumentVault"),
                },
                {
                  icon: "color-palette",
                  tint: GRID_TINTS.paint,
                  title: "Paint colours",
                  count: homeNotes.paints.length,
                  descriptor: "Brands and codes by room",
                  onPress: () => navigation.navigate("PaintColors"),
                },
                {
                  icon: "document-text",
                  tint: GRID_TINTS.notes,
                  title: "House notes",
                  count: homeNotes.notes.length,
                  descriptor: "Wi‑Fi, codes, trash day",
                  onPress: () => navigation.navigate("HouseNotes"),
                },
              ]}
            />
          </Animated.View>

          <Animated.View entering={entering(section++)}>
            <SectionHeader title="People" />
            <RecordSection style={styles.group}>
              <RecordRow
                icon="call"
                tone="soft"
                tint={colors.primary}
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
                tone="soft"
                tint={colors.secondary}
                title="HomeShare"
                subtitle={
                  householdShared
                    ? formatHouseholdPeople(members, user?.id)
                    : "Share the home with everyone who lives there"
                }
                trailing={
                  householdShared ? (
                    <MemberAvatars members={members} currentUserId={user?.id} />
                  ) : null
                }
                locked={recordLocked && !householdShared}
                onPress={() => go(() => setShowHomeShare(true))}
              />
            </RecordSection>
          </Animated.View>

          <Animated.View entering={entering(section++)}>
            <SectionHeader title="Share" />
            <RecordSection
              style={styles.group}
              footer="A tidy history of the home for buyers, insurers, and your own files."
            >
              <RecordRow
                icon="sparkles"
                tone="soft"
                tint={colors.warning}
                title="Year in review"
                subtitle="Your year of upkeep, ready to share"
                onPress={() => go(() => navigation.navigate("YearInReview"))}
              />
              <RecordRow
                icon="document-text"
                tone="soft"
                tint={colors.textSecondary}
                title="Home history PDF"
                subtitle="Preview and export"
                locked={recordLocked}
                onPress={() =>
                  go(() => navigation.navigate("HomeSummaryPreview"))
                }
              />
            </RecordSection>
          </Animated.View>
        </View>
      </ScrollView>

      <HouseholdSharingModal
        visible={showHomeShare}
        onClose={() => setShowHomeShare(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.xs,
    paddingBottom: DesignSystem.spacing.xxl,
    gap: DesignSystem.spacing.lg,
  },
  group: {
    marginBottom: 0,
  },
});
