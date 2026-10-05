import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import {
  removeHomeContact,
  useHomeContacts,
} from "../../hooks/useHomeContacts";
import { HomeContactService } from "../../services/HomeContactService";
import { Button, HeaderIconButton } from "../../components/ui";
import { ProFormSheet } from "../../components/pros/ProFormSheet";
import {
  callContact,
  canCall,
  emailContact,
  textContact,
} from "../../components/pros/contactLinks";
import { ProAvatar } from "../../components/pros/ProAvatar";
import {
  CONTACT_TRADES,
  HomeContact,
  tradeMeta,
} from "../../types/homeContact";
import { LockedPreview } from "../../components/plus/LockedPreview";
import { usePlusFeature } from "../../lib/plusFeatures";
import { RecordStackParamList } from "../../navigation/types";
import { DesignSystem } from "../../theme/designSystem";

type Nav = NativeStackNavigationProp<RecordStackParamList, "Pros">;

function samplePro(
  id: string,
  name: string,
  company: string,
  trade: HomeContact["trade"]
): HomeContact {
  return {
    id,
    household_id: null,
    user_id: "",
    name,
    company,
    trade,
    phone: "5550100",
    email: "pro@example.com",
    website: null,
    notes: null,
    last_used_at: null,
    created_at: "",
    updated_at: "",
  };
}

/** Shown under the lock when a free account has no pros yet. */
const SAMPLE_PROS: HomeContact[] = [
  samplePro("sample-1", "Dana Ruiz", "Ruiz Plumbing", "plumber"),
  samplePro("sample-2", "Sam Okafor", "Brightline Electric", "electrician"),
  samplePro("sample-3", "Lee Hart", "Hart Heating & Air", "hvac"),
  samplePro("sample-4", "Morgan Fry", "Fix-It Morgan", "handyman"),
];

interface ProSection {
  key: string;
  title: string;
  data: HomeContact[];
}

function matches(contact: HomeContact, needle: string) {
  return [
    contact.name,
    contact.company,
    contact.notes,
    tradeMeta(contact.trade).label,
  ].some((field) => field?.toLowerCase().includes(needle));
}

export function ProsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { triggerLight, triggerMedium } = useHaptics();
  const { items, loaded, error, refresh } = useHomeContacts();
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const openSwipe = useRef<Swipeable | null>(null);
  const { locked, unlock } = usePlusFeature("pros");

  const openAdd = () => {
    if (locked) void unlock();
    else setFormVisible(true);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderIconButton
          icon="add"
          onPress={openAdd}
          accessibilityLabel="Add a pro"
        />
      ),
      headerSearchBarOptions: {
        placeholder: "Search pros",
        hideWhenScrolling: true,
        tintColor: colors.primary,
        onChangeText: (event) => setQuery(event.nativeEvent.text),
        onCancelButtonPress: () => setQuery(""),
      },
    });
  }, [colors.primary, navigation, locked, unlock]);

  const sections: ProSection[] = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const visible = needle ? items.filter((c) => matches(c, needle)) : items;
    const byTrade = new Map<string, HomeContact[]>();
    for (const contact of visible) {
      const key = contact.trade ?? "other";
      byTrade.set(key, [...(byTrade.get(key) ?? []), contact]);
    }
    return CONTACT_TRADES.filter((trade) => byTrade.has(trade)).map(
      (trade) => ({
        key: trade,
        title: tradeMeta(trade).plural,
        data: [...(byTrade.get(trade) ?? [])].sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      })
    );
  }, [items, query]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const confirmDelete = (contact: HomeContact) => {
    void triggerMedium();
    Alert.alert(
      `Delete ${contact.name}?`,
      "Past jobs keep their cost and notes, but won't show who did them.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => openSwipe.current?.close(),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error: deleteError } = await HomeContactService.remove(
              contact.id
            );
            if (deleteError) {
              Alert.alert("Couldn't delete", deleteError.message);
              return;
            }
            removeHomeContact(contact.id);
          },
        },
      ]
    );
  };

  const renderRow = (contact: HomeContact, index: number) => {
    const meta = tradeMeta(contact.trade);
    const subtitle = [contact.company, contact.trade ? meta.label : null]
      .filter(Boolean)
      .join(" · ");
    let swipeRef: Swipeable | null = null;

    return (
      <Swipeable
        ref={(ref) => {
          swipeRef = ref;
        }}
        onSwipeableWillOpen={() => {
          if (openSwipe.current && openSwipe.current !== swipeRef) {
            openSwipe.current.close();
          }
          openSwipe.current = swipeRef;
        }}
        overshootRight={false}
        friction={2}
        renderRightActions={() => (
          <View style={styles.swipeActions}>
            {canCall(contact) ? (
              <Pressable
                onPress={() => {
                  swipeRef?.close();
                  callContact(contact);
                }}
                style={[
                  styles.swipeButton,
                  { backgroundColor: colors.success },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Call ${contact.name}`}
              >
                <Ionicons name="call" size={20} color="#FFFFFF" />
                <Text style={styles.swipeText}>Call</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => confirmDelete(contact)}
              style={[styles.swipeButton, { backgroundColor: colors.error }]}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${contact.name}`}
            >
              <Ionicons name="trash" size={20} color="#FFFFFF" />
              <Text style={styles.swipeText}>Delete</Text>
            </Pressable>
          </View>
        )}
      >
        <Pressable
          onPress={() => {
            triggerLight();
            navigation.navigate("ProDetail", { contactId: contact.id });
          }}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: pressed ? colors.fieldFill : colors.surface },
            index > 0 && {
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={[contact.name, subtitle]
            .filter(Boolean)
            .join(", ")}
          accessibilityHint="Opens details. Swipe left to call or delete."
        >
          <ProAvatar contact={contact} size={40} />
          <View style={styles.rowText}>
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
            >
              {contact.name}
            </Text>
            {subtitle ? (
              <Text
                style={[styles.subtitle, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
          <View style={styles.quickActions}>
            {canCall(contact) ? (
              <QuickAction
                icon="chatbubble"
                label={`Text ${contact.name}`}
                onPress={() => textContact(contact)}
              />
            ) : null}
            {contact.email ? (
              <QuickAction
                icon="mail"
                label={`Email ${contact.name}`}
                onPress={() => emailContact(contact)}
              />
            ) : null}
            {canCall(contact) ? (
              <QuickAction
                icon="call"
                label={`Call ${contact.name}`}
                onPress={() => callContact(contact)}
                strong
              />
            ) : null}
          </View>
        </Pressable>
      </Swipeable>
    );
  };

  const empty = loaded && items.length === 0;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {!loaded ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : locked ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
        >
          <LockedPreview feature="pros">
            <View
              style={[
                styles.lockedCard,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              {(items.length > 0 ? items.slice(0, 6) : SAMPLE_PROS).map(
                (contact, index) => (
                  <React.Fragment key={contact.id}>
                    {renderRow(contact, index)}
                  </React.Fragment>
                )
              )}
            </View>
          </LockedPreview>
        </ScrollView>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled={false}
          contentContainerStyle={[styles.content, empty && styles.contentEmpty]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderSectionHeader={({ section }) => (
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
              accessibilityRole="header"
            >
              {section.title}
            </Text>
          )}
          renderItem={({ item, index, section }) => (
            <View
              style={[
                styles.cardSlice,
                { borderColor: colors.border, backgroundColor: colors.surface },
                index === 0 && styles.cardTop,
                index === section.data.length - 1 && styles.cardBottom,
              ]}
            >
              {renderRow(item, index)}
            </View>
          )}
          ListEmptyComponent={
            empty ? (
              <View style={styles.empty}>
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: colors.primary + "14" },
                  ]}
                >
                  <Ionicons
                    name="people-outline"
                    size={30}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Keep your trusted pros here
                </Text>
                <Text
                  style={[styles.emptyBody, { color: colors.textSecondary }]}
                >
                  The plumber who showed up on a Sunday, the electrician who
                  fixed the panel. One tap to call, shared with your home.
                </Text>
                <View style={styles.emptyButton}>
                  <Button
                    label="Add a pro"
                    onPress={() => setFormVisible(true)}
                  />
                </View>
                {error ? (
                  <Text style={[styles.emptyBody, { color: colors.error }]}>
                    {error}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={[styles.noMatch, { color: colors.textSecondary }]}>
                No pros match “{query.trim()}”.
              </Text>
            )
          }
        />
      )}

      <ProFormSheet
        visible={formVisible}
        contact={null}
        onClose={() => setFormVisible(false)}
      />
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  strong,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  strong?: boolean;
}) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  return (
    <Pressable
      onPress={() => {
        triggerLight();
        onPress();
      }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.quickAction,
        {
          backgroundColor: strong ? colors.success + "1F" : colors.fieldFill,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons
        name={icon}
        size={16}
        color={strong ? colors.success : colors.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.xxl,
  },
  contentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  sectionTitle: {
    ...DesignSystem.typography.captionSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.sm,
  },
  lockedCard: {
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginTop: DesignSystem.spacing.sm,
  },
  cardSlice: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  cardTop: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: DesignSystem.borders.radius.large,
    borderTopRightRadius: DesignSystem.borders.radius.large,
  },
  cardBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: DesignSystem.borders.radius.large,
    borderBottomRightRadius: DesignSystem.borders.radius.large,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 2,
    minHeight: 60,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...DesignSystem.typography.bodySemiBold,
  },
  subtitle: {
    ...DesignSystem.typography.footnote,
    marginTop: 1,
  },
  quickActions: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  quickAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeActions: {
    flexDirection: "row",
  },
  swipeButton: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  swipeText: {
    ...DesignSystem.typography.captionSemiBold,
    color: "#FFFFFF",
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  emptyTitle: {
    ...DesignSystem.typography.title2,
    textAlign: "center",
  },
  emptyBody: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
    textAlign: "center",
    marginTop: DesignSystem.spacing.sm,
    maxWidth: 300,
  },
  emptyButton: {
    alignSelf: "stretch",
    marginTop: DesignSystem.spacing.lg,
  },
  noMatch: {
    ...DesignSystem.typography.footnote,
    textAlign: "center",
    marginTop: DesignSystem.spacing.xl,
  },
});
