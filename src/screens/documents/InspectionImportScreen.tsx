import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { useHaptics } from "../../hooks";
import { useOverlayInsets } from "../../hooks/useOverlayInsets";
import {
  refreshHomeDocuments,
  useHomeDocuments,
} from "../../hooks/useHomeDocuments";
import { useEquipmentIndex } from "../../hooks/useEquipmentIndex";
import {
  AiError,
  AiService,
  FindingSeverity,
  InspectionExtraction,
  InspectionFinding,
} from "../../services/AiService";
import { MaintenanceService } from "../../services/maintenanceService";
import { MaintenanceInstanceService } from "../../services/MaintenanceInstanceService";
import {
  buildRoutinePayloadsFromItems,
  filterNewRoutinePayloads,
} from "../../data/maintenancePlans";
import { formatRoutineInterval } from "../../components/all-reminders/groupRoutines";
import { Button, HeaderIconButton } from "../../components/ui";
import { isRepairRoutine, Priority } from "../../types/maintenance";
import { RecordStackParamList } from "../../navigation/types";
import { DesignSystem } from "../../theme/designSystem";

type Nav = NativeStackNavigationProp<RecordStackParamList, "InspectionImport">;
type Route = RouteProp<RecordStackParamList, "InspectionImport">;

const SEVERITY_ORDER: FindingSeverity[] = [
  "safety",
  "major",
  "minor",
  "maintenance",
];

const SEVERITY_LABELS: Record<FindingSeverity, string> = {
  safety: "Safety",
  major: "Major repairs",
  minor: "Minor fixes",
  maintenance: "Upkeep",
};

const DUE_IN_DAYS: Record<Priority, number> = {
  urgent: 7,
  high: 30,
  medium: 90,
  low: 180,
};

const REJECTION_COPY: Record<string, string> = {
  not_inspection:
    "This doesn't look like a home inspection report. Check that the right file is attached.",
  no_file: "Attach the report file to this document first.",
  unsupported_file: "Inspection import works with PDFs and photos of the report.",
  too_large: "This file is too large to read. Try a smaller PDF.",
  unreadable: "We couldn't read this report. Try a clearer copy.",
  not_found: "This document is no longer available.",
};

function normalizeTitle(title: string) {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}

function repairTitle(finding: InspectionFinding) {
  return finding.action === "monitor" ? `Check: ${finding.title}` : finding.title;
}

function dueDateFor(priority: Priority) {
  const date = new Date();
  date.setDate(date.getDate() + DUE_IN_DAYS[priority]);
  date.setHours(9, 0, 0, 0);
  return date;
}

function findingKind(finding: InspectionFinding): string {
  if (finding.action === "routine") {
    return formatRoutineInterval(finding.suggested_interval_days ?? 365);
  }
  if (finding.action === "monitor") return "Keep an eye on";
  return "One-time fix";
}

function findingDescription(finding: InspectionFinding, docTitle: string) {
  return [
    finding.detail,
    finding.location ? `Location: ${finding.location}` : null,
    `From “${docTitle}”${finding.page ? `, page ${finding.page}` : ""}.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Reads an inspection report with HomeKeep AI and turns the findings the
 * owner picks into pending repairs and recurring routines.
 */
export function InspectionImportScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const overlay = useOverlayInsets({ translucentHeader: false });
  const { triggerLight, triggerSuccess } = useHaptics();
  const { createTasks, refreshTasks } = useTasks();
  const { presentPaywall } = useSubscription();
  const documents = useHomeDocuments({ refreshOnFocus: false });
  const equipment = useEquipmentIndex();
  const document = documents.items.find((d) => d.id === params.documentId);
  const docTitle = document?.title ?? "inspection report";

  const [extraction, setExtraction] = useState<InspectionExtraction | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<{
    message: string;
    locked?: boolean;
  } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [existing, setExisting] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (refresh = false) => {
      setLoading(true);
      setFailure(null);
      try {
        const [{ result }, routines] = await Promise.all([
          AiService.extractInspection(params.documentId, refresh),
          MaintenanceService.getMaintenanceRoutines({ is_active: true }),
        ]);
        const taken = new Set(
          (routines.data ?? []).map((r) =>
            isRepairRoutine(r)
              ? `repair|${normalizeTitle(r.title)}`
              : `routine|${normalizeTitle(r.title)}`
          )
        );
        const keyFor = (f: InspectionFinding) =>
          f.action === "routine"
            ? `routine|${normalizeTitle(f.title)}`
            : `repair|${normalizeTitle(repairTitle(f))}`;
        const already = new Set(
          result.findings.filter((f) => taken.has(keyFor(f))).map((f) => f.id)
        );
        setExtraction(result);
        setExisting(already);
        setSelected(
          new Set(
            result.findings
              .filter((f) => f.action !== "monitor" && !already.has(f.id))
              .map((f) => f.id)
          )
        );
        void refreshHomeDocuments();
      } catch (error) {
        if (error instanceof AiError && error.code === "plus_required") {
          setFailure({
            message:
              "Inspection import is part of HomeKeep +. Upgrade to turn this report into a plan.",
            locked: true,
          });
          void presentPaywall({ force: true, reason: "inspection" });
        } else if (error instanceof AiError) {
          setFailure({
            message:
              (error.reason && REJECTION_COPY[error.reason]) || error.message,
          });
        } else {
          setFailure({ message: "Something went wrong. Try again." });
        }
      } finally {
        setLoading(false);
      }
    },
    [params.documentId, presentPaywall]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        extraction && !loading ? (
          <HeaderIconButton
            icon="refresh"
            onPress={() =>
              Alert.alert(
                "Read the report again?",
                "HomeKeep will re-read the file. Findings you already added stay on your schedule.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Re-read", onPress: () => void load(true) },
                ]
              )
            }
            accessibilityLabel="Read the report again"
          />
        ) : null,
    });
  }, [navigation, extraction, loading, load]);

  const sections = useMemo(() => {
    if (!extraction) return [];
    return SEVERITY_ORDER.map((severity) => ({
      severity,
      findings: extraction.findings.filter((f) => f.severity === severity),
    })).filter((section) => section.findings.length > 0);
  }, [extraction]);

  const toggle = (id: string) => {
    triggerLight();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const equipmentIdFor = (finding: InspectionFinding): string | null => {
    if (!finding.equipment_hint) return null;
    const matches = equipment.items.filter(
      (item) => item.equipment_type === finding.equipment_hint
    );
    return matches.length === 1 ? matches[0].id : null;
  };

  const addSelected = async () => {
    if (!extraction || saving) return;
    const picked = extraction.findings.filter((f) => selected.has(f.id));
    if (picked.length === 0) return;
    setSaving(true);
    try {
      const repairs = picked.filter((f) => f.action !== "routine");
      const routines = picked.filter((f) => f.action === "routine");

      let failed = 0;
      for (const finding of repairs) {
        const priority: Priority =
          finding.action === "monitor" ? "low" : finding.priority;
        const { error } = await MaintenanceInstanceService.scheduleRepair({
          title: repairTitle(finding),
          category: finding.category,
          dueDate: dueDateFor(priority),
          description: findingDescription(finding, docTitle),
          equipmentId: equipmentIdFor(finding),
          priority,
        });
        if (error) failed++;
      }

      let routinesAdded = 0;
      if (routines.length > 0) {
        const payloads = buildRoutinePayloadsFromItems(
          routines.map((finding) => ({
            title: finding.title,
            description: findingDescription(finding, docTitle),
            category: finding.category,
            priority: finding.priority,
            estimated_duration_minutes: 30,
            interval_days: finding.suggested_interval_days ?? 365,
          }))
        ).map((payload, index) => ({
          ...payload,
          equipment_id: equipmentIdFor(routines[index]),
        }));
        const existingRoutines = await MaintenanceService.getMaintenanceRoutines(
          { is_active: true }
        );
        const { newPayloads } = filterNewRoutinePayloads(
          payloads,
          existingRoutines.data ?? []
        );
        const result = await createTasks(newPayloads);
        if (result.success) routinesAdded = newPayloads.length;
        else failed += newPayloads.length;
      }

      await refreshTasks();
      const added = repairs.length - failed + routinesAdded;
      if (failed > 0) {
        Alert.alert(
          "Some items weren't added",
          `${added} added, ${failed} couldn't be saved. Try again in a moment.`
        );
        return;
      }
      triggerSuccess();
      const parts = [
        repairs.length > 0
          ? `${repairs.length} ${repairs.length === 1 ? "repair" : "repairs"}`
          : null,
        routinesAdded > 0
          ? `${routinesAdded} recurring ${routinesAdded === 1 ? "task" : "tasks"}`
          : null,
      ].filter(Boolean);
      Alert.alert(
        "Added to your schedule",
        parts.length > 0
          ? `${parts.join(" and ")} from your inspection are on your schedule.`
          : "Those items were already on your schedule.",
        [{ text: "Done", onPress: () => navigation.goBack() }]
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background, paddingBottom: overlay.bottom },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingTitle, { color: colors.text }]}>
          Reading your report…
        </Text>
        <Text style={[styles.loadingBody, { color: colors.textSecondary }]}>
          Long reports can take up to a minute. We'll pull out each finding and
          suggest what to schedule.
        </Text>
      </View>
    );
  }

  if (failure || !extraction) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background, paddingBottom: overlay.bottom },
        ]}
      >
        <Ionicons
          name={failure?.locked ? "lock-closed" : "alert-circle-outline"}
          size={36}
          color={colors.textSecondary}
        />
        <Text style={[styles.loadingBody, { color: colors.text }]}>
          {failure?.message ?? "Something went wrong."}
        </Text>
        <View style={styles.failureButton}>
          {failure?.locked ? (
            <Button
              label="See HomeKeep +"
              onPress={() =>
                void presentPaywall({ force: true, reason: "inspection" })
              }
            />
          ) : (
            <Button label="Try again" onPress={() => void load()} />
          )}
        </View>
      </View>
    );
  }

  const count = selected.size;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        {extraction.summary ? (
          <View
            style={[
              styles.summary,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: colors.primary }]}>
              Report summary
            </Text>
            <Text style={[styles.summaryText, { color: colors.text }]}>
              {extraction.summary}
            </Text>
          </View>
        ) : null}

        {sections.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No actionable findings were found in this report.
          </Text>
        ) : (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Pick what to add. Repairs become one-time tasks with a due date;
            upkeep becomes a recurring routine.
          </Text>
        )}

        {sections.map((section) => (
          <View key={section.severity}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
              accessibilityRole="header"
            >
              {SEVERITY_LABELS[section.severity]}
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {section.findings.map((finding, index) => {
                const checked = selected.has(finding.id);
                const already = existing.has(finding.id);
                const meta = [
                  findingKind(finding),
                  finding.location,
                  already ? "Already on your schedule" : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <Pressable
                    key={finding.id}
                    onPress={() => toggle(finding.id)}
                    style={({ pressed }) => [
                      styles.row,
                      pressed && { backgroundColor: colors.fieldFill },
                      index > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: colors.border,
                      },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    accessibilityLabel={`${finding.title}. ${meta}`}
                  >
                    <Ionicons
                      name={checked ? "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color={checked ? colors.primary : colors.textSecondary}
                    />
                    <View style={styles.rowText}>
                      <Text style={[styles.title, { color: colors.text }]}>
                        {finding.title}
                      </Text>
                      <Text
                        style={[styles.meta, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {meta}
                      </Text>
                      {finding.detail ? (
                        <Text
                          style={[
                            styles.detail,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={3}
                        >
                          {finding.detail}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
          Findings are read by AI and can miss or misread details. Check the
          original report and talk to a licensed pro about safety items.
        </Text>
      </ScrollView>

      {sections.length > 0 ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, DesignSystem.spacing.md),
            },
          ]}
        >
          <Button
            label={
              count === 0
                ? "Select findings to add"
                : `Add ${count} to my schedule`
            }
            onPress={() => void addSelected()}
            disabled={count === 0}
            loading={saving}
          />
        </View>
      ) : null}
    </View>
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
    paddingHorizontal: DesignSystem.spacing.xl,
    gap: DesignSystem.spacing.sm,
  },
  loadingTitle: {
    ...DesignSystem.typography.h3,
    marginTop: DesignSystem.spacing.md,
    textAlign: "center",
  },
  loadingBody: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 300,
  },
  failureButton: {
    alignSelf: "stretch",
    marginTop: DesignSystem.spacing.md,
  },
  content: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.xxl,
  },
  summary: {
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.xs,
  },
  summaryLabel: {
    ...DesignSystem.typography.captionSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  summaryText: {
    ...DesignSystem.typography.body,
  },
  hint: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
    marginTop: DesignSystem.spacing.md,
  },
  emptyText: {
    ...DesignSystem.typography.body,
    textAlign: "center",
    marginTop: DesignSystem.spacing.xl,
  },
  sectionTitle: {
    ...DesignSystem.typography.captionSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.sm,
  },
  card: {
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 4,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...DesignSystem.typography.bodySemiBold,
  },
  meta: {
    ...DesignSystem.typography.caption,
  },
  detail: {
    ...DesignSystem.typography.footnote,
    marginTop: 2,
  },
  disclaimer: {
    ...DesignSystem.typography.caption,
    lineHeight: 18,
    marginTop: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.sm,
    textAlign: "center",
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.md,
  },
});
