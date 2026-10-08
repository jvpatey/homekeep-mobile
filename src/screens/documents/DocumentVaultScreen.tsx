import React, { useLayoutEffect, useMemo, useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import {
  removeHomeDocument,
  useHomeDocuments,
} from "../../hooks/useHomeDocuments";
import { useEquipmentIndex } from "../../hooks/useEquipmentIndex";
import { DocumentService } from "../../services/DocumentService";
import { Button, HeaderIconButton } from "../../components/ui";
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
  const { colors } = useTheme();
  const { triggerLight, triggerMedium } = useHaptics();
  const { items, loaded, error, refresh } = useHomeDocuments();
  const equipment = useEquipmentIndex();
  const { locked, unlock } = usePlusFeature("documents");
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<HomeDocument | null>(null);
  const [formVisible, setFormVisible] = useState(false);

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

  const openDocumentMenu = (document: HomeDocument) => {
    triggerLight();
    if (locked) {
      void unlock();
      return;
    }
    showActionMenu({
      title: document.title,
      options: [
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
        <View
          style={[styles.iconBubble, { backgroundColor: colors.primary + "14" }]}
        >
          <Ionicons
            name={DOCUMENT_KIND_ICONS[document.kind]}
            size={18}
            color={colors.primary}
          />
        </View>
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
          <Text
            style={[
              styles.expiry,
              {
                color:
                  expiry.tone === "expired"
                    ? colors.error
                    : expiry.tone === "soon"
                      ? colors.warning ?? colors.primary
                      : colors.textSecondary,
              },
            ]}
            numberOfLines={1}
          >
            {expiry.text}
          </Text>
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
      <View
        style={[styles.iconBubble, { backgroundColor: colors.fieldFill }]}
      >
        <Ionicons
          name={file === "manual" ? "document-text" : "receipt"}
          size={18}
          color={colors.textSecondary}
        />
      </View>
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
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : locked ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
        >
          <LockedPreview feature="documents">
            <View
              style={[
                styles.lockedCard,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              {(items.length > 0 ? items.slice(0, 6) : SAMPLE_DOCUMENTS).map(
                (document, index) => (
                  <React.Fragment key={document.id}>
                    {renderDocumentRow(document, index)}
                  </React.Fragment>
                )
              )}
            </View>
          </LockedPreview>
        </ScrollView>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.key}
          contentInsetAdjustmentBehavior="automatic"
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
          ListHeaderComponent={
            !empty && filters.length > 2 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
                style={styles.filterScroller}
              >
                {filters.map((option) => {
                  const active = filter === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      onPress={() => {
                        triggerLight();
                        setFilter(option.key);
                      }}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: active
                            ? colors.primary
                            : colors.fieldFill,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          { color: active ? "#FFFFFF" : colors.text },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null
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
                    name="folder-open-outline"
                    size={30}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Keep the house paperwork here
                </Text>
                <Text
                  style={[styles.emptyBody, { color: colors.textSecondary }]}
                >
                  Insurance policies, inspection reports, closing papers, and
                  permits, shared with everyone in your home.
                </Text>
                <View style={styles.emptyButton}>
                  <Button label="Add a document" onPress={openAdd} />
                </View>
                {error ? (
                  <Text style={[styles.emptyBody, { color: colors.error }]}>
                    {error}
                  </Text>
                ) : null}
              </View>
            ) : null
          }
        />
      )}

      <DocumentFormSheet
        visible={formVisible}
        document={editing}
        defaultKind={
          filter !== "all" && filter !== "equipment" ? filter : undefined
        }
        onClose={() => setFormVisible(false)}
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
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.xxl,
  },
  contentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  filterScroller: {
    marginHorizontal: -DesignSystem.spacing.md,
  },
  filterRow: {
    gap: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs + 3,
    borderRadius: DesignSystem.borders.radius.round,
  },
  filterText: {
    ...DesignSystem.typography.smallSemiBold,
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
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
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
    ...DesignSystem.typography.caption,
    maxWidth: 130,
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
});
