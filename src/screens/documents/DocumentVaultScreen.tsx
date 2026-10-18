import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
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
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { useOverlayInsets } from "../../hooks/useOverlayInsets";
import {
  removeHomeDocument,
  useHomeDocuments,
} from "../../hooks/useHomeDocuments";
import { useEquipmentIndex } from "../../hooks/useEquipmentIndex";
import { DocumentService } from "../../services/DocumentService";
import {
  EmptyState,
  HeaderIconButton,
  HearthSurfaceCard,
  IconChip,
  Pill,
  SectionHeader,
} from "../../components/ui";
import { DocumentFormSheet } from "../../components/documents/DocumentFormSheet";
import { openStoredFile } from "../../components/equipment/equipmentAttachments";
import { LockedPreview } from "../../components/plus/LockedPreview";
import { usePlusFeature } from "../../lib/plusFeatures";
import { showActionMenu } from "../../utils/actionMenu";
import { resolveWarrantyFields } from "../../utils/equipmentWarranty";
import {
  DOCUMENT_KINDS,
  DOCUMENT_KIND_ICONS,
  DOCUMENT_KIND_LABELS,
  DocumentKind,
  HomeDocument,
} from "../../types/homeDocument";
import { EquipmentManual } from "../../types/equipmentManual";
import { RecordStackParamList } from "../../navigation/types";
import { DesignSystem } from "../../theme/designSystem";

type Nav = NativeStackNavigationProp<RecordStackParamList, "DocumentVault">;

type Filter = DocumentKind | "all" | "equipment";

type VaultRow =
  | { type: "document"; key: string; document: HomeDocument }
  | {
      type: "equipment";
      key: string;
      equipment: EquipmentManual;
      file: "manual" | "receipt";
    };

interface VaultSection {
  key: string;
  title: string;
  data: VaultRow[];
}

const EQUIPMENT_SECTION_TITLE = "Equipment manuals & receipts";

function expiryLabel(document: HomeDocument): {
  text: string;
  tone: "expired" | "soon" | "ok";
} | null {
  const fields = resolveWarrantyFields(document.expires_on);
  if (!fields.warrantyExpiresLabel) return null;
  if (fields.warrantyStatus === "expired") {
    return { text: `Expired ${fields.warrantyExpiresLabel}`, tone: "expired" };
  }
  if (fields.warrantyStatus === "expiring_soon") {
    return { text: `Renews ${fields.warrantyExpiresLabel}`, tone: "soon" };
  }
  return { text: `Until ${fields.warrantyExpiresLabel}`, tone: "ok" };
}

function sampleDocument(
  id: string,
  kind: DocumentKind,
  title: string,
  expires_on: string | null
): HomeDocument {
  return {
    id,
    user_id: "",
    household_id: null,
    home_id: null,
    equipment_id: null,
    kind,
    title,
    notes: null,
    storage_path: "sample.pdf",
    mime_type: "application/pdf",
    issued_on: null,
    expires_on,
    created_at: "",
    updated_at: "",
  };
}

/** Shown under the lock when a free account has no documents yet. */
const SAMPLE_DOCUMENTS: HomeDocument[] = [
  sampleDocument("sample-1", "insurance", "Home insurance policy", "2027-03-01"),
  sampleDocument("sample-2", "inspection", "Pre-purchase inspection", null),
  sampleDocument("sample-3", "closing", "Closing disclosure & deed", null),
  sampleDocument("sample-4", "permit", "Deck permit", null),
];

export function DocumentVaultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RecordStackParamList, "DocumentVault">>();
  const { colors } = useTheme();
  const overlay = useOverlayInsets();
  const { triggerLight, triggerMedium } = useHaptics();
  const { items, loaded, error, refresh } = useHomeDocuments();
  const equipment = useEquipmentIndex();
  const { locked, unlock } = usePlusFeature("documents");
  const inspection = usePlusFeature("inspection");
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<HomeDocument | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [presetKind, setPresetKind] = useState<DocumentKind | null>(null);
  const addKind = route.params?.addKind;

  useEffect(() => {
    if (!addKind || !loaded) return;
    navigation.setParams({ addKind: undefined });
    if (locked) {
      void unlock();
      return;
    }
    setEditing(null);
    setPresetKind(addKind);
    setFormVisible(true);
  }, [addKind, loaded, locked, navigation, unlock]);

  const openAdd = () => {
    if (locked) {
      void unlock();
      return;
    }
    setEditing(null);
    setFormVisible(true);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderIconButton
          icon="add"
          onPress={openAdd}
          accessibilityLabel="Add a document"
        />
      ),
    });
  }, [navigation, locked, unlock]);

  const equipmentRows: VaultRow[] = useMemo(
    () =>
      equipment.items.flatMap((item) => {
        const rows: VaultRow[] = [];
        if (item.manual_storage_path) {
          rows.push({
            type: "equipment",
            key: `${item.id}-manual`,
            equipment: item,
            file: "manual",
          });
        }
        if (item.receipt_storage_path) {
          rows.push({
            type: "equipment",
            key: `${item.id}-receipt`,
            equipment: item,
            file: "receipt",
          });
        }
        return rows;
      }),
    [equipment.items]
  );

  const kindCounts = useMemo(() => {
    const counts = new Map<DocumentKind, number>();
    for (const doc of items) {
      counts.set(doc.kind, (counts.get(doc.kind) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const sections: VaultSection[] = useMemo(() => {
    const out: VaultSection[] = [];
    if (filter !== "equipment") {
      for (const kind of DOCUMENT_KINDS) {
        if (filter !== "all" && filter !== kind) continue;
        const docs = items
          .filter((doc) => doc.kind === kind)
          .sort((a, b) => a.title.localeCompare(b.title));
        if (docs.length === 0) continue;
        out.push({
          key: kind,
          title: DOCUMENT_KIND_LABELS[kind],
          data: docs.map((document) => ({
            type: "document",
            key: document.id,
            document,
          })),
        });
      }
    }
    if ((filter === "all" || filter === "equipment") && equipmentRows.length) {
      out.push({
        key: "equipment",
        title: EQUIPMENT_SECTION_TITLE,
        data: equipmentRows,
      });
    }
    return out;
  }, [filter, items, equipmentRows]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), equipment.refresh()]);
    setRefreshing(false);
  };

  const confirmDelete = (document: HomeDocument) => {
    void triggerMedium();
    Alert.alert(
      `Delete “${document.title}”?`,
      "The file is removed for everyone in your home.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error: deleteError } =
              await DocumentService.remove(document);
            if (deleteError) {
              Alert.alert("Couldn't delete", deleteError.message);
              return;
            }
            removeHomeDocument(document.id);
          },
        },
      ]
    );
  };

  const openInspectionImport = async (document: HomeDocument) => {
    if (inspection.locked && !(await inspection.unlock())) return;
    navigation.navigate("InspectionImport", { documentId: document.id });
  };

  const handleSaved = (saved: HomeDocument) => {
    if (editing || saved.kind !== "inspection" || !saved.storage_path) return;
    Alert.alert(
      "Turn this report into a plan?",
      "HomeKeep can read the findings and suggest repairs and upkeep to schedule.",
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Import findings",
          onPress: () => void openInspectionImport(saved),
        },
      ]
    );
  };

  const openDocumentMenu = (document: HomeDocument) => {
    triggerLight();
    if (locked) {
      void unlock();
      return;
    }
    showActionMenu({
      title: document.title,
      options: [
        ...(document.kind === "inspection" && document.storage_path
          ? [
              {
                label: document.ai_extraction
                  ? "Review findings"
                  : "Turn into a plan",
                icon: "sparkles-outline" as const,
                onPress: () => void openInspectionImport(document),
              },
            ]
          : []),
        ...(document.storage_path
          ? [
              {
                label: "Open file",
                icon: "open-outline" as const,
                onPress: () =>
                  void openStoredFile(document.storage_path, "document"),
              },
            ]
          : []),
        {
          label: "Edit",
          icon: "create-outline",
          onPress: () => {
            setEditing(document);
            setFormVisible(true);
          },
        },
        ...(document.equipment_id && equipment.byId.has(document.equipment_id)
          ? [
              {
                label: "Go to equipment",
                icon: "cube-outline" as const,
                onPress: () =>
                  navigation.navigate("EquipmentDetail", {
                    equipmentId: document.equipment_id!,
                  }),
              },
            ]
          : []),
        {
          label: "Delete",
          icon: "trash-outline",
          destructive: true,
          onPress: () => confirmDelete(document),
        },
      ],
    });
  };

  const renderDocumentRow = (document: HomeDocument, index: number) => {
    const expiry = expiryLabel(document);
    const linked = document.equipment_id
      ? equipment.byId.get(document.equipment_id)?.name
      : null;
    const subtitle = [linked, document.storage_path ? null : "No file yet"]
      .filter(Boolean)
      .join(" · ");
    return (
      <Pressable
        onPress={() => openDocumentMenu(document)}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: pressed ? colors.fieldFill : colors.surface },
          index > 0 && {
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={[document.title, subtitle, expiry?.text]
          .filter(Boolean)
          .join(", ")}
      >
        <IconChip
          icon={DOCUMENT_KIND_ICONS[document.kind]}
          tint={colors.primary}
          size={36}
        />
        <View style={styles.rowText}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {document.title}
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
        {expiry ? (
          <Pill
            label={expiry.text}
            tone={
              expiry.tone === "expired"
                ? "error"
                : expiry.tone === "soon"
                  ? "warning"
                  : "neutral"
            }
            style={styles.expiry}
          />
        ) : null}
      </Pressable>
    );
  };

  const renderEquipmentRow = (
    item: EquipmentManual,
    file: "manual" | "receipt",
    index: number
  ) => (
    <Pressable
      onPress={() => {
        triggerLight();
        navigation.navigate("EquipmentDetail", { equipmentId: item.id });
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
      accessibilityLabel={`${item.name} ${file}`}
      accessibilityHint="Opens the equipment"
    >
      <IconChip
        icon={file === "manual" ? "document-text" : "receipt"}
        tint={colors.textSecondary}
        size={36}
      />
      <View style={styles.rowText}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text
          style={[styles.subtitle, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {file === "manual" ? "Manual" : "Receipt"}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.textSecondary}
      />
    </Pressable>
  );

  const renderRow = (row: VaultRow, index: number) =>
    row.type === "document"
      ? renderDocumentRow(row.document, index)
      : renderEquipmentRow(row.equipment, row.file, index);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    ...DOCUMENT_KINDS.filter((kind) => kindCounts.has(kind)).map((kind) => ({
      key: kind as Filter,
      label: DOCUMENT_KIND_LABELS[kind],
    })),
    ...(equipmentRows.length > 0
      ? [{ key: "equipment" as Filter, label: "Equipment" }]
      : []),
  ];

  const empty = loaded && items.length === 0 && equipmentRows.length === 0;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {!loaded ? (
        <View
          style={[
            styles.center,
            { paddingTop: overlay.top, paddingBottom: overlay.bottom },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : locked ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
        >
          <LockedPreview feature="documents">
            <HearthSurfaceCard containerStyle={styles.lockedCard}>
              {(items.length > 0 ? items.slice(0, 6) : SAMPLE_DOCUMENTS).map(
                (document, index) => (
                  <React.Fragment key={document.id}>
                    {renderDocumentRow(document, index)}
                  </React.Fragment>
                )
              )}
            </HearthSurfaceCard>
          </LockedPreview>
        </ScrollView>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.key}
          contentInsetAdjustmentBehavior="automatic"
          stickySectionHeadersEnabled={false}
          contentContainerStyle={[
            styles.content,
            empty && [
              styles.contentEmpty,
              { paddingBottom: overlay.top + overlay.bottom },
            ],
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            !empty && filters.length > 2 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
                style={styles.filterScroller}
              >
                {filters.map((option) => (
                  <Pill
                    key={option.key}
                    label={option.label}
                    size="medium"
                    selected={filter === option.key}
                    onPress={() => setFilter(option.key)}
                  />
                ))}
              </ScrollView>
            ) : null
          }
          renderSectionHeader={({ section }) => (
            <SectionHeader title={section.title} style={styles.sectionTitle} />
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
              <EmptyState
                icon="folder-open-outline"
                title="Keep the house paperwork here"
                body={
                  error ??
                  "Insurance policies, inspection reports, closing papers, and permits, shared with everyone in your home."
                }
                primaryAction={{ label: "Add a document", onPress: openAdd }}
              />
            ) : null
          }
        />
      )}

      <DocumentFormSheet
        visible={formVisible}
        document={editing}
        defaultKind={
          presetKind ??
          (filter !== "all" && filter !== "equipment" ? filter : undefined)
        }
        onClose={() => {
          setFormVisible(false);
          setPresetKind(null);
        }}
        onSaved={handleSaved}
      />
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
  },
  content: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.xxl,
  },
  contentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  filterScroller: {
    marginHorizontal: -DesignSystem.spacing.lg,
  },
  filterRow: {
    gap: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.sm,
  },
  sectionTitle: {
    marginTop: DesignSystem.spacing.lg,
  },
  lockedCard: {
    marginTop: DesignSystem.spacing.sm,
  },
  cardSlice: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  cardTop: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: DesignSystem.borders.radius.xlarge,
    borderTopRightRadius: DesignSystem.borders.radius.xlarge,
  },
  cardBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: DesignSystem.borders.radius.xlarge,
    borderBottomRightRadius: DesignSystem.borders.radius.xlarge,
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
  title: {
    ...DesignSystem.typography.bodySemiBold,
  },
  subtitle: {
    ...DesignSystem.typography.footnote,
    marginTop: 1,
  },
  expiry: {
    maxWidth: 140,
    alignSelf: "center",
  },
});
