import React, { useLayoutEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { format } from "date-fns";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { useAuth } from "../../context/AuthContext";
import { useHaptics } from "../../hooks";
import { usePlusFeature } from "../../lib/plusFeatures";
import { HeaderIconButton, HomeKeepBrand } from "../../components/ui";
import { RecordStackParamList } from "../../navigation/types";
import { useAppNavigation } from "../../navigation/useAppNavigation";
import {
  HomeSummaryService,
  homeSummaryHasContent,
  resolveOwnerName,
} from "../../services/HomeSummaryService";
import {
  formatHomeSummaryHistoryMeta,
  formatHomeSummaryCost,
  laborTypeLabel,
} from "../../utils/groupHomeSummaryTasks";
import { warrantyStatusLabel } from "../../utils/equipmentWarranty";
import { DEFAULT_CURRENCY } from "../../utils/formatMoney";
import { HomeSummaryTaskGroup } from "../../types/homeSummary";
import { HomeSummaryPdfService } from "../../services/HomeSummaryPdfService";
import { HomeSummaryReportData } from "../../types/homeSummary";
import { homeSummaryPreviewStyles as styles } from "./styles";

type ThemeColors = ReturnType<typeof useTheme>["colors"];

function TaskGroupRow({
  group,
  colors,
  showBorder,
  currency,
}: {
  group: HomeSummaryTaskGroup;
  colors: ThemeColors;
  showBorder: boolean;
  currency: string;
}) {
  return (
    <View
      style={[styles.taskRow, showBorder && { borderTopColor: colors.border }]}
    >
      <Text style={[styles.taskTitle, { color: colors.text }]}>
        {group.title}
      </Text>
      <Text style={[styles.taskMeta, { color: colors.textSecondary }]}>
        {group.category}
        {group.completions.length > 1
          ? ` · ${group.completions.length} completions`
          : ""}
      </Text>
      {group.completions.map((completion, completionIndex) => {
        const labor = laborTypeLabel(completion.laborType);
        const cost =
          typeof completion.costAmount === "number"
            ? formatHomeSummaryCost(completion.costAmount, currency)
            : null;
        const extras = [labor, cost].filter(Boolean).join(" · ");
        return (
          <View key={`${completion.completedDateLabel}-${completionIndex}`}>
            <Text
              style={[styles.completionDate, { color: colors.textSecondary }]}
            >
              {group.completions.length > 1 ? "· " : ""}
              {completion.completedDateLabel}
              {completion.completedByLabel
                ? ` · ${completion.completedByLabel}`
                : ""}
              {extras ? ` · ${extras}` : ""}
            </Text>
            {completion.notes ? (
              <Text style={[styles.taskNotes, { color: colors.textSecondary }]}>
                {completion.notes}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function HomeSummaryPreviewScreen() {
  const { colors, isDark } = useTheme();
  const { profile, homeNotes } = useProfile();
  const { user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RecordStackParamList>>();
  const { openSettings } = useAppNavigation();
  const { triggerLight, triggerMedium } = useHaptics();
  const pdf = usePlusFeature("pdf");

  const [report, setReport] = useState<HomeSummaryReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ownerName = resolveOwnerName(
    profile,
    user?.user_metadata?.full_name as string | undefined
  );

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } =
      await HomeSummaryService.fetchReportData(profile, ownerName, homeNotes);
    if (fetchError) {
      setError(fetchError.message);
      setReport(null);
    } else if (data) {
      setReport({ ...data, generatedAt: new Date() });
    }
    setLoading(false);
  }, [profile, ownerName, homeNotes]);

  useFocusEffect(
    useCallback(() => {
      void loadReport();
    }, [loadReport])
  );

  const handleExport = async () => {
    if (!report || !homeSummaryHasContent(report)) return;
    if (!(await pdf.unlock())) return;
    await triggerMedium();
    setExporting(true);
    const result = await HomeSummaryPdfService.exportAndShare(report);
    setExporting(false);
    if (!result.success) {
      Alert.alert(
        "Export failed",
        result.error || "Could not create the PDF. Please try again."
      );
    }
  };

  const handleOpenSettings = async () => {
    await triggerLight();
    openSettings();
  };

  const canExport =
    report && homeSummaryHasContent(report) && !loading && !exporting;
  const generatedLabel = report
    ? format(report.generatedAt, "MMMM d, yyyy")
    : format(new Date(), "MMMM d, yyyy");

  const sectionSurface = {
    backgroundColor: colors.surface,
    borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : colors.border,
  };

  const exportButton = (
    <TouchableOpacity
      style={[
        styles.exportButton,
        {
          backgroundColor: canExport ? colors.primary : colors.border,
        },
      ]}
      onPress={() => void handleExport()}
      disabled={!canExport}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Export PDF"
      accessibilityState={{ disabled: !canExport }}
    >
      {exporting ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Ionicons name="share-outline" size={20} color="#FFFFFF" />
      )}
      <Text style={styles.exportButtonText}>
        {exporting ? "Creating PDF…" : "Export PDF"}
      </Text>
    </TouchableOpacity>
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderIconButton
          icon="share-outline"
          onPress={() => void handleExport()}
          disabled={!canExport}
          accessibilityLabel="Export PDF"
        />
      ),
    });
  });

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {error ? (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.error + "12",
              borderColor: colors.error + "40",
            },
          ]}
        >
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => void loadReport()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading summary"
          >
            <Text style={[styles.retryText, { color: colors.primary }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Building your summary…
          </Text>
        </View>
      ) : (
        <>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            Preview before export
          </Text>
          <View
            style={[styles.docHeader, { borderBottomColor: colors.primary }]}
          >
            <HomeKeepBrand size="md" style={styles.brandRow} />
            <Text style={[styles.docTitle, { color: colors.text }]}>
              Home maintenance summary
            </Text>
            <Text style={[styles.docMeta, { color: colors.textSecondary }]}>
              Generated {generatedLabel}
            </Text>
            {ownerName ? (
              <Text
                style={[
                  styles.docMeta,
                  { color: colors.textSecondary, marginTop: 4 },
                ]}
              >
                Prepared for {ownerName}
              </Text>
            ) : null}
          </View>

          <View style={[styles.section, sectionSurface]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Property
            </Text>
            {report?.hasAddress ? (
              report.addressLines.map((line, index) => (
                <Text
                  key={`${line}-${index}`}
                  style={[styles.addressLine, { color: colors.text }]}
                >
                  {line}
                </Text>
              ))
            ) : (
              <>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  No home address on file.
                </Text>
                <TouchableOpacity
                  onPress={handleOpenSettings}
                  accessibilityRole="button"
                  accessibilityLabel="Add home address in settings"
                >
                  <Text style={[styles.hintText, { color: colors.primary }]}>
                    Add your address in Settings
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={[styles.section, sectionSurface]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Equipment
            </Text>
            <Text style={[styles.sectionMeta, { color: colors.textSecondary }]}>
              {report?.equipment.length ?? 0} item
              {(report?.equipment.length ?? 0) === 1 ? "" : "s"}
            </Text>
            {(report?.equipment.length ?? 0) === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No equipment recorded.
              </Text>
            ) : (
              report?.equipment.map((item, index) => {
                const attachments: string[] = [];
                if (item.hasManual) attachments.push("Manual on file");
                if (item.hasReceipt) attachments.push("Receipt on file");
                return (
                  <View
                    key={`${item.name}-${index}`}
                    style={[
                      styles.equipmentRow,
                      index > 0 && { borderTopColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[styles.equipmentName, { color: colors.text }]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        styles.equipmentDetail,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {[item.manufacturer, item.modelNumber]
                        .filter(Boolean)
                        .join(" ") || "Model —"}
                      {item.serialNumber ? ` · S/N ${item.serialNumber}` : ""}
                      {" · Purchased: "}
                      {item.purchaseDateLabel ?? "—"}
                    </Text>
                    {item.warrantyExpiresLabel ? (
                      <Text
                        style={[
                          styles.equipmentDetail,
                          {
                            color:
                              item.warrantyStatus === "expired" ||
                              item.warrantyStatus === "expiring_soon"
                                ? colors.warning
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        Warranty: {item.warrantyExpiresLabel}
                        {warrantyStatusLabel(item.warrantyStatus)
                          ? ` · ${warrantyStatusLabel(item.warrantyStatus)}`
                          : ""}
                      </Text>
                    ) : null}
                    {attachments.length > 0 ? (
                      <Text
                        style={[
                          styles.equipmentAttachments,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {attachments.join(" · ")}
                      </Text>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>

          {report && report.paints.length > 0 ? (
            <View style={[styles.section, sectionSurface]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Paint colours
              </Text>
              {report.paints.map((paint, index) => (
                <View
                  key={`${paint.room}-${paint.name}-${index}`}
                  style={[
                    styles.equipmentRow,
                    styles.paintRow,
                    {
                      borderTopColor: index > 0 ? colors.border : "transparent",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.paintSwatch,
                      {
                        backgroundColor: paint.hex ?? colors.fieldFill,
                        borderColor: colors.border,
                      },
                    ]}
                  />
                  <View style={styles.paintText}>
                    <Text
                      style={[styles.equipmentName, { color: colors.text }]}
                    >
                      {paint.room ? `${paint.room}: ` : ""}
                      {paint.name}
                    </Text>
                    <Text
                      style={[
                        styles.equipmentDetail,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {[paint.brand, paint.code, paint.finish]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          <View style={[styles.section, sectionSurface]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Maintenance history
            </Text>
            <Text style={[styles.sectionMeta, { color: colors.textSecondary }]}>
              {formatHomeSummaryHistoryMeta(report?.taskGroups ?? [])}
            </Text>
            {report?.spendTotals.hasAnyCost ? (
              <Text
                style={[styles.sectionMeta, { color: colors.textSecondary }]}
              >
                Spend {report.spendTotals.yearLabel}:{" "}
                {formatHomeSummaryCost(
                  report.spendTotals.yearTotal,
                  report.currency
                )}{" "}
                · All time:{" "}
                {formatHomeSummaryCost(
                  report.spendTotals.allTimeTotal,
                  report.currency
                )}
              </Text>
            ) : null}
            {(report?.taskGroups.length ?? 0) === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No completed maintenance yet.
              </Text>
            ) : (
              report?.taskGroups.map((group, index) => (
                <TaskGroupRow
                  key={`${group.title}-${group.category}-${index}`}
                  group={group}
                  colors={colors}
                  showBorder={index > 0}
                  currency={report?.currency ?? DEFAULT_CURRENCY}
                />
              ))
            )}
          </View>

          <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
            This document is an informational record generated from data you
            entered in HomeKeep. Verify details independently for legal,
            insurance, or warranty purposes.
          </Text>
          {exportButton}
        </>
      )}
    </ScrollView>
  );
}
