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
import { useOverlayInsets } from "../../hooks/useOverlayInsets";
import { useCurrency } from "../../hooks/useCurrency";
import { useRecordData } from "../../hooks/useRecordData";
import {
  removeHomeContact,
  useHomeContacts,
} from "../../hooks/useHomeContacts";
import { HomeContactService } from "../../services/HomeContactService";
import {
  HeaderIconButton,
  HearthSurfaceCard,
  QuickAction,
  SectionHeader,
  StatTile,
} from "../../components/ui";
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
  const overlay = useOverlayInsets({ translucentHeader: false });
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
      <View
        style={[
          styles.missing,
          { backgroundColor: colors.background, paddingBottom: overlay.bottom },
        ]}
      >
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
          <QuickAction
            icon="call"
            label="Call"
            disabled={!callable}
            onPress={() => callContact(contact)}
          />
          <QuickAction
            icon="chatbubble"
            label="Text"
            disabled={!callable}
            onPress={() => textContact(contact)}
          />
          <QuickAction
            icon="mail"
            label="Email"
            disabled={!contact.email}
            onPress={() => emailContact(contact)}
          />
          <QuickAction
            icon="globe"
            label="Website"
            disabled={!contact.website}
            onPress={() => openWebsite(contact)}
          />
        </View>

        {contact.phone || contact.email || contact.website ? (
          <HearthSurfaceCard>
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
          </HearthSurfaceCard>
        ) : null}

        {contact.notes ? (
          <HearthSurfaceCard style={styles.notesCard}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Notes
            </Text>
            <Text style={[styles.notes, { color: colors.text }]}>
              {contact.notes}
            </Text>
          </HearthSurfaceCard>
        ) : null}

        <View style={styles.stats}>
          <StatTile
            icon="construct-outline"
            tint={colors.secondary}
            value={String(jobs.length)}
            label={jobs.length === 1 ? "job" : "jobs"}
            style={styles.statTile}
          />
          <StatTile
            icon="wallet-outline"
            tint={colors.primary}
            value={formatMoney(totalSpent, { whole: totalSpent >= 1000 })}
            label="spent with them"
            style={styles.statTile}
          />
        </View>

        <View>
          <SectionHeader title="Job history" count={jobs.length} />
          {jobs.length === 0 ? (
            <Text style={[styles.emptyJobs, { color: colors.textSecondary }]}>
              When you mark a job "Hired a pro" and pick {contact.name}, it shows
              up here.
            </Text>
          ) : (
            <HearthSurfaceCard>
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
            </HearthSurfaceCard>
          )}
        </View>

        <Pressable
          onPress={confirmDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
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
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.xxl,
    gap: DesignSystem.spacing.lg,
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
  stats: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm + 4,
  },
  statTile: {
    flex: 1,
    width: undefined,
  },
  emptyJobs: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
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
    borderRadius: DesignSystem.borders.radius.xlarge,
    borderWidth: StyleSheet.hairlineWidth,
  },
  deleteText: {
    ...DesignSystem.typography.bodySemiBold,
  },
});
