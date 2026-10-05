import React, { useLayoutEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { useCurrency } from "../../hooks/useCurrency";
import { useRecordData } from "../../hooks/useRecordData";
import {
  removeHomeContact,
  useHomeContacts,
} from "../../hooks/useHomeContacts";
import { HomeContactService } from "../../services/HomeContactService";
import { HeaderIconButton } from "../../components/ui";
import { ProAvatar } from "../../components/pros/ProAvatar";
import { ProFormSheet } from "../../components/pros/ProFormSheet";
import {
  callContact,
  canCall,
  emailContact,
  openWebsite,
  textContact,
} from "../../components/pros/contactLinks";
import { RecordEntrySheet } from "../../components/record/RecordEntrySheet";
import { useRecordEntryActions } from "../../components/record/useRecordEntryActions";
import { MaintenanceTask } from "../../types/maintenance";
import { tradeMeta } from "../../types/homeContact";
import { RecordStackParamList } from "../../navigation/types";
import { DesignSystem } from "../../theme/designSystem";

type Nav = NativeStackNavigationProp<RecordStackParamList, "ProDetail">;

export function ProDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RecordStackParamList, "ProDetail">>();
  const { colors } = useTheme();
  const { triggerLight, triggerMedium } = useHaptics();
  const { format: formatMoney } = useCurrency();
  const { byId, loaded } = useHomeContacts({ refreshOnFocus: false });
  const { completions } = useRecordData();
  const actionFor = useRecordEntryActions();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<MaintenanceTask | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const contact = byId.get(route.params.contactId) ?? null;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: contact?.name ?? "Pro",
      headerLargeTitleEnabled: false,
      headerRight: contact
        ? () => (
            <HeaderIconButton
              icon="create-outline"
              onPress={() => setEditing(true)}
              accessibilityLabel="Edit pro"
            />
          )
        : undefined,
    });
  }, [contact, navigation]);

  const jobs = useMemo(
    () =>
      completions.filter(
        (task) =>
          (task.contact_id ?? task.contact?.id) === route.params.contactId
      ),
    [completions, route.params.contactId]
  );
  const totalSpent = jobs.reduce(
    (sum, task) =>
      sum + (typeof task.cost_amount === "number" ? task.cost_amount : 0),
    0
  );

  if (!contact) {
    return (
      <View style={[styles.missing, { backgroundColor: colors.background }]}>
        <Text style={[styles.missingText, { color: colors.textSecondary }]}>
          {loaded ? "This pro was removed." : "Loading…"}
        </Text>
      </View>
    );
  }

  const meta = tradeMeta(contact.trade);
  const subtitle = [contact.company, contact.trade ? meta.label : null]
    .filter(Boolean)
    .join(" · ");
  const callable = canCall(contact);

  const confirmDelete = () => {
    void triggerMedium();
    Alert.alert(
      `Delete ${contact.name}?`,
      "Past jobs keep their cost and notes, but won't show who did them.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await HomeContactService.remove(contact.id);
            if (error) {
              Alert.alert("Couldn't delete", error.message);
              return;
            }
            removeHomeContact(contact.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const surface = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  };

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <ProAvatar contact={contact} size={72} />
          <Text style={[styles.name, { color: colors.text }]}>
            {contact.name}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <ActionButton
            icon="call"
            label="Call"
            disabled={!callable}
            onPress={() => callContact(contact)}
          />
          <ActionButton
            icon="chatbubble"
            label="Text"
            disabled={!callable}
            onPress={() => textContact(contact)}
          />
          <ActionButton
            icon="mail"
            label="Email"
            disabled={!contact.email}
            onPress={() => emailContact(contact)}
          />
          <ActionButton
            icon="globe"
            label="Website"
            disabled={!contact.website}
            onPress={() => openWebsite(contact)}
          />
        </View>

        {contact.phone || contact.email || contact.website ? (
          <View style={[styles.card, surface]}>
            {contact.phone ? (
              <InfoRow
                label="Phone"
                value={contact.phone}
                onPress={callable ? () => callContact(contact) : undefined}
              />
            ) : null}
            {contact.email ? (
              <InfoRow
                label="Email"
                value={contact.email}
                onPress={() => emailContact(contact)}
                divider={Boolean(contact.phone)}
              />
            ) : null}
            {contact.website ? (
              <InfoRow
                label="Website"
                value={contact.website}
                onPress={() => openWebsite(contact)}
                divider={Boolean(contact.phone || contact.email)}
              />
            ) : null}
          </View>
        ) : null}

        {contact.notes ? (
          <View style={[styles.card, surface, styles.notesCard]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Notes
            </Text>
            <Text style={[styles.notes, { color: colors.text }]}>
              {contact.notes}
            </Text>
          </View>
        ) : null}

        <View style={[styles.statsCard, surface]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {jobs.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              job{jobs.length === 1 ? "" : "s"}
            </Text>
          </View>
          <View
            style={[styles.statDivider, { backgroundColor: colors.border }]}
          />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatMoney(totalSpent, { whole: totalSpent >= 1000 })}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              spent with them
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Job history
        </Text>
        {jobs.length === 0 ? (
          <Text style={[styles.emptyJobs, { color: colors.textSecondary }]}>
            When you mark a job "Hired a pro" and pick {contact.name}, it shows
            up here.
          </Text>
        ) : (
          <View style={[styles.card, surface]}>
            {jobs.map((task, index) => {
              const date = new Date(task.completed_at || task.due_date);
              return (
                <Pressable
                  key={task.instance_id}
                  onPress={() => {
                    triggerLight();
                    setSelected(task);
                    setSheetVisible(true);
                  }}
                  style={({ pressed }) => [
                    styles.jobRow,
                    index > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: colors.border,
                    },
                    pressed && { backgroundColor: colors.fieldFill },
                  ]}
                  accessibilityRole="button"
                >
                  <View style={styles.jobText}>
                    <Text
                      style={[styles.jobTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                    <Text
                      style={[styles.jobDate, { color: colors.textSecondary }]}
                    >
                      {Number.isNaN(date.getTime())
                        ? "—"
                        : format(date, "MMM d, yyyy")}
                    </Text>
                  </View>
                  {typeof task.cost_amount === "number" &&
                  task.cost_amount > 0 ? (
                    <Text style={[styles.jobAmount, { color: colors.text }]}>
                      {formatMoney(task.cost_amount)}
                    </Text>
                  ) : null}
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                  />
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          onPress={confirmDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            surface,
            pressed && { backgroundColor: colors.fieldFill },
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.deleteText, { color: colors.error }]}>
            Delete pro
          </Text>
        </Pressable>
      </ScrollView>

      <ProFormSheet
        visible={editing}
        contact={contact}
        onClose={() => setEditing(false)}
      />
      <RecordEntrySheet
        task={selected}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onDismissed={() => setSelected(null)}
        action={selected ? actionFor(selected) : null}
      />
    </>
  );
}

function ActionButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  return (
    <Pressable
      onPress={() => {
        triggerLight();
        onPress();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={[styles.actionLabel, { color: colors.primary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function InfoRow({
  label,
  value,
  onPress,
  divider,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  divider?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.infoRow,
        divider && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        pressed && { backgroundColor: colors.fieldFill },
      ]}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.infoValue,
          { color: onPress ? colors.primary : colors.text },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.xxl,
  },
  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  missingText: {
    ...DesignSystem.typography.body,
  },
  header: {
    alignItems: "center",
    paddingTop: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
  },
  name: {
    ...DesignSystem.typography.title2,
    marginTop: DesignSystem.spacing.md,
    textAlign: "center",
  },
  subtitle: {
    ...DesignSystem.typography.footnote,
    marginTop: 2,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.lg,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: DesignSystem.spacing.sm + 2,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionLabel: {
    ...DesignSystem.typography.captionSemiBold,
  },
  card: {
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: DesignSystem.spacing.md,
  },
  notesCard: {
    padding: DesignSystem.spacing.md,
  },
  infoRow: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 2,
  },
  infoLabel: {
    ...DesignSystem.typography.caption,
  },
  infoValue: {
    ...DesignSystem.typography.body,
    marginTop: 1,
  },
  notes: {
    ...DesignSystem.typography.body,
    marginTop: 4,
  },
  statsCard: {
    flexDirection: "row",
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
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
  sectionTitle: {
    ...DesignSystem.typography.captionSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.sm,
  },
  emptyJobs: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
    paddingHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.lg,
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 2,
  },
  jobText: {
    flex: 1,
    minWidth: 0,
  },
  jobTitle: {
    ...DesignSystem.typography.body,
  },
  jobDate: {
    ...DesignSystem.typography.footnote,
  },
  jobAmount: {
    ...DesignSystem.typography.bodySemiBold,
    fontVariant: ["tabular-nums"],
  },
  deleteButton: {
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: DesignSystem.spacing.md,
  },
  deleteText: {
    ...DesignSystem.typography.bodySemiBold,
  },
});
