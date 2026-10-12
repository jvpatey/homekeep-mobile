import React, { useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { useEquipmentIndex } from "../../hooks/useEquipmentIndex";
import { useEquipmentRecalls } from "../../hooks/useEquipmentRecalls";
import { Button, HeaderIconButton } from "../../components/ui";
import { RecordRow, RecordSection } from "../../components/record/RecordList";
import { EquipmentFormSheet } from "../../components/equipment/EquipmentFormSheet";
import { EQUIPMENT_GROUPS } from "../../components/equipment/equipmentGroups";
import {
  EquipmentManual,
  equipmentTypeIcon,
} from "../../types/equipmentManual";
import { consumableSummary } from "../../data/equipmentTaskHints";
import {
  resolveWarrantyFields,
  warrantyStatusLabel,
} from "../../utils/equipmentWarranty";
import { usePlusFeature } from "../../lib/plusFeatures";
import { useAiScanAccess } from "../../hooks/useAiScanAccess";
import { useOverlayInsets } from "../../hooks/useOverlayInsets";
import { RecordStackParamList } from "../../navigation/types";
import { DesignSystem } from "../../theme/designSystem";

type Nav = NativeStackNavigationProp<RecordStackParamList, "EquipmentList">;

function subtitleFor(item: EquipmentManual) {
  const identity = [item.manufacturer, item.model_number]
    .filter(Boolean)
    .join(" · ");
  const firstPart = item.consumables?.[0];
  const extra = firstPart ? consumableSummary(firstPart) : null;
  return [identity, extra].filter(Boolean).join("\n") || null;
}

export function EquipmentListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const overlay = useOverlayInsets();
  const { triggerLight } = useHaptics();
  const documents = usePlusFeature("documents");
  const { items, loaded, error, refresh } = useEquipmentIndex();
  const { byEquipmentId: recallsByEquipment, refresh: refreshRecalls } =
    useEquipmentRecalls();
  const scanAccess = useAiScanAccess();
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<"manual" | "scan" | "scanOnly">(
    "manual"
  );

  const openAdd = async () => {
    triggerLight();
    if (!(await documents.unlock())) return;
    setFormMode("manual");
    setFormVisible(true);
  };

  /** Free accounts can add equipment by scanning while free scans last. */
  const openScan = async () => {
    triggerLight();
    if (scanAccess.isPlus) {
      setFormMode("scan");
      setFormVisible(true);
      return;
    }
    const hasFreeScans = scanAccess.canScan;
    if (!(await scanAccess.requireAccess())) return;
    setFormMode(hasFreeScans ? "scanOnly" : "scan");
    setFormVisible(true);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <HeaderIconButton
            icon="scan"
            onPress={() => void openScan()}
            accessibilityLabel="Scan an equipment label"
          />
          <HeaderIconButton
            icon="add"
            onPress={() => void openAdd()}
            accessibilityLabel="Add equipment"
          />
        </View>
      ),
    });
  });

  const sections = useMemo(
    () =>
      EQUIPMENT_GROUPS.map((group) => ({
        ...group,
        data: items
          .filter((item) => group.types.includes(item.equipment_type ?? null))
          .sort((a, b) => a.name.localeCompare(b.name)),
      })).filter((group) => group.data.length > 0),
    [items]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshRecalls()]);
    setRefreshing(false);
  };

  const open = (item: EquipmentManual) => {
    triggerLight();
    navigation.navigate("EquipmentDetail", { equipmentId: item.id });
  };

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          (!loaded || items.length === 0) && [
            styles.contentCentered,
            { paddingBottom: overlay.top + overlay.bottom },
          ],
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {!loaded ? (
          <ActivityIndicator color={colors.primary} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.primary + "14" },
              ]}
            >
              <Ionicons
                name="hardware-chip-outline"
                size={30}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {error ? "Couldn't load equipment" : "Know what's in your house"}
            </Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              {error
                ? error
                : "Add your furnace, water heater, and appliances to keep model and serial numbers, filter sizes, manuals, and warranties in one place."}
            </Text>
            <View style={styles.emptyAction}>
              <Button
                label={error ? "Try again" : "Scan a label"}
                onPress={() => void (error ? refresh() : openScan())}
              />
              {!error ? (
                <Button
                  label="Add by hand"
                  variant="ghost"
                  onPress={() => void openAdd()}
                />
              ) : null}
            </View>
          </View>
        ) : (
          sections.map((section) => (
            <RecordSection key={section.title} title={section.title}>
              {section.data.map((item) => {
                const warranty = resolveWarrantyFields(
                  item.warranty_expires_on
                );
                const status = warrantyStatusLabel(warranty.warrantyStatus);
                const recalled = recallsByEquipment.has(item.id);
                return (
                  <RecordRow
                    key={item.id}
                    icon={equipmentTypeIcon(item.equipment_type)}
                    tint={section.tint}
                    title={item.name}
                    subtitle={subtitleFor(item)}
                    onPress={() => open(item)}
                    trailing={
                      recalled ? (
                        <View
                          style={[
                            styles.badge,
                            styles.recallBadge,
                            { backgroundColor: colors.error + "1F" },
                          ]}
                        >
                          <Ionicons
                            name="warning"
                            size={11}
                            color={colors.error}
                          />
                          <Text
                            style={[styles.badgeText, { color: colors.error }]}
                          >
                            Recall
                          </Text>
                        </View>
                      ) : status ? (
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor:
                                warranty.warrantyStatus === "expired"
                                  ? colors.fieldFill
                                  : colors.warning + "22",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              {
                                color:
                                  warranty.warrantyStatus === "expired"
                                    ? colors.textSecondary
                                    : colors.warning,
                              },
                            ]}
                          >
                            {warranty.warrantyStatus === "expired"
                              ? "Out of warranty"
                              : status}
                          </Text>
                        </View>
                      ) : null
                    }
                  />
                );
              })}
            </RecordSection>
          ))
        )}
      </ScrollView>

      <EquipmentFormSheet
        visible={formVisible}
        equipment={null}
        startWithScan={formMode !== "manual"}
        requireScan={formMode === "scanOnly"}
        onClose={() => setFormVisible(false)}
        onSaved={(item, created) => {
          if (created) {
            navigation.navigate("EquipmentDetail", { equipmentId: item.id });
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.xxl,
  },
  contentCentered: {
    flexGrow: 1,
    justifyContent: "center",
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
    fontSize: 20,
    lineHeight: 26,
    textAlign: "center",
  },
  emptyBody: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
    textAlign: "center",
    marginTop: DesignSystem.spacing.sm,
  },
  emptyAction: {
    alignSelf: "stretch",
    marginTop: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.xs,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 3,
    borderRadius: DesignSystem.borders.radius.round,
  },
  recallBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  badgeText: {
    ...DesignSystem.typography.captionSemiBold,
  },
});
