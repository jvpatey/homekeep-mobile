/**
 * Equipment manuals UI. Apple Notes–style document scanning would need VisionKit /
 * ML Kit and a custom dev client; this MVP attaches PDFs and photos only.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { format, parseISO } from "date-fns";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useGradients, useHaptics, useDevice, useSheetMount } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import { Button, HearthSurfaceCard, SheetGrabber } from "../../ui";
import { FormField } from "../../Dashboard/modals/create-task-modal/FormField";
import { EquipmentManual } from "../../../types/equipmentManual";
import { EquipmentManualService } from "../../../services/EquipmentManualService";
import { MaintenanceService } from "../../../services/maintenanceService";
import { useTasks } from "../../../context/TasksContext";
import { useRequirePlus } from "../../../hooks/useRequirePlus";
import {
  hintsForEquipmentName,
  partitionEquipmentHints,
} from "../../../data/equipmentTaskHints";
import {
  buildRoutinePayloadsFromItems,
  MaintenancePlanItemTemplate,
} from "../../../data/maintenancePlans";
import { styles } from "./styles";

type ScreenMode = "list" | "form" | "hints";

interface EquipmentManualsModalProps {
  visible: boolean;
  onClose: () => void;
  onAddRecurringTask?: (equipmentId: string) => void;
}

export function EquipmentManualsModal({
  visible,
  onClose,
  onAddRecurringTask,
}: EquipmentManualsModalProps) {
  const { colors, isDark } = useTheme();
  const { isConfigured } = useAuth();
  const { authAtmosphere } = useGradients();
  const { triggerLight, triggerMedium } = useHaptics();
  const { createTask, updateTask } = useTasks();
  const requirePlus = useRequirePlus();
  const { isTablet, getFontMultiplier, getResponsiveValue, getTabletSheetContainerStyle } =
    useDevice();
  const fontMultiplier = getFontMultiplier();

  const {
    mounted,
    backdropStyle: animatedBackdropStyle,
    sheetStyle: animatedSheetStyle,
  } = useSheetMount(visible);
  const [screenMode, setScreenMode] = useState<ScreenMode>("list");
  const [items, setItems] = useState<EquipmentManual[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const [editing, setEditing] = useState<EquipmentManual | null>(null);
  const [name, setName] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<Date | null>(null);
  const [showPurchasePicker, setShowPurchasePicker] = useState(false);

  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [pendingMime, setPendingMime] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string | null>(null);

  const [pendingReceiptUri, setPendingReceiptUri] = useState<string | null>(
    null
  );
  const [pendingReceiptMime, setPendingReceiptMime] = useState<string | null>(
    null
  );
  const [pendingReceiptFileName, setPendingReceiptFileName] = useState<
    string | null
  >(null);

  const [hintEquipmentId, setHintEquipmentId] = useState<string | null>(null);
  const [hintEquipmentName, setHintEquipmentName] = useState("");
  const [hintCreate, setHintCreate] = useState<MaintenancePlanItemTemplate[]>(
    []
  );
  const [hintLinkIds, setHintLinkIds] = useState<string[]>([]);
  const [hintMask, setHintMask] = useState<boolean[]>([]);
  const [hintLinkTitles, setHintLinkTitles] = useState<string[]>([]);

  const loadItems = useCallback(async () => {
    if (!isConfigured) return;
    setLoading(true);
    try {
      const { data, error } = await EquipmentManualService.listEquipmentManuals();
      if (error) throw new Error(error.message);
      setItems(data ?? []);
    } catch (err) {
      console.error(err);
      Alert.alert(
        "Could not load equipment",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  useEffect(() => {
    if (visible) {
      loadItems();
    }
  }, [visible, loadItems]);

  useEffect(() => {
    if (!visible && !mounted) {
      setScreenMode("list");
      setEditing(null);
      resetForm();
      setHintEquipmentId(null);
      setHintCreate([]);
      setHintLinkIds([]);
    }
  }, [visible, mounted]);

  const resetForm = () => {
    setName("");
    setModelNumber("");
    setPurchaseDate(null);
    setShowPurchasePicker(false);
    setPendingUri(null);
    setPendingMime(null);
    setPendingFileName(null);
    setPendingReceiptUri(null);
    setPendingReceiptMime(null);
    setPendingReceiptFileName(null);
  };

  const handleClose = async () => {
    await triggerLight();
    onClose();
  };

  const openAdd = async () => {
    await triggerLight();
    if (!(await requirePlus())) return;
    setEditing(null);
    resetForm();
    setScreenMode("form");
  };

  const openEdit = async (item: EquipmentManual) => {
    await triggerLight();
    setEditing(item);
    setName(item.name);
    setModelNumber(item.model_number ?? "");
    setPurchaseDate(
      item.purchase_date ? parseISO(item.purchase_date) : null
    );
    setPendingUri(null);
    setPendingMime(null);
    setPendingFileName(null);
    setPendingReceiptUri(null);
    setPendingReceiptMime(null);
    setPendingReceiptFileName(null);
    setScreenMode("form");
  };

  type AttachmentTarget = "manual" | "receipt";

  const setPendingAttachment = (
    target: AttachmentTarget,
    uri: string,
    mime: string,
    fileName: string
  ) => {
    if (target === "manual") {
      setPendingUri(uri);
      setPendingMime(mime);
      setPendingFileName(fileName);
      return;
    }
    setPendingReceiptUri(uri);
    setPendingReceiptMime(mime);
    setPendingReceiptFileName(fileName);
  };

  const pickDocument = async (target: AttachmentTarget = "manual") => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: ["application/pdf", "image/*"],
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setPendingAttachment(
        target,
        asset.uri,
        asset.mimeType ?? "application/octet-stream",
        asset.name ?? (target === "receipt" ? "receipt" : "manual")
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Picker error", "Could not open the file picker.");
    }
  };

  const pickImageLibrary = async (target: AttachmentTarget = "manual") => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission needed",
          "Allow photo library access to attach images."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const prefix = target === "receipt" ? "receipt" : "manual";
      setPendingAttachment(
        target,
        asset.uri,
        asset.mimeType ?? "image/jpeg",
        asset.fileName ?? `${prefix}-${Date.now()}.jpg`
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Photos", "Could not open your photo library.");
    }
  };

  const pickCamera = async (target: AttachmentTarget = "manual") => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission needed",
          "Allow camera access to photograph a manual."
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
      if (result.canceled) return;
      const asset = result.assets[0];
      const prefix = target === "receipt" ? "receipt" : "manual";
      setPendingAttachment(
        target,
        asset.uri,
        asset.mimeType ?? "image/jpeg",
        asset.fileName ?? `${prefix}-${Date.now()}.jpg`
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Camera", "Could not open the camera.");
    }
  };

  const promptAttach = (target: AttachmentTarget) => {
    const title =
      target === "receipt" ? "Attach receipt" : "Attach manual";
    Alert.alert(title, "PDF or photo", [
      { text: "Choose file", onPress: () => void pickDocument(target) },
      {
        text: "Photo library",
        onPress: () => void pickImageLibrary(target),
      },
      { text: "Take photo", onPress: () => void pickCamera(target) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handlePurchaseDateChange = (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (Platform.OS === "android") {
      setShowPurchasePicker(false);
    }
    if (event.type === "dismissed") {
      return;
    }
    if (selected) {
      const normalized = new Date(selected);
      normalized.setHours(12, 0, 0, 0);
      setPurchaseDate(normalized);
    }
  };

  const clearPurchaseDate = async () => {
    await triggerLight();
    setPurchaseDate(null);
    setShowPurchasePicker(false);
  };

  const openStorageFile = async (
    storagePath: string | null | undefined,
    failureTitle: string
  ) => {
    if (!storagePath) return;
    await triggerLight();
    const { data: url, error } =
      await EquipmentManualService.getManualSignedUrl(storagePath);
    if (error || !url) {
      Alert.alert(failureTitle, error?.message ?? "Try again.");
      return;
    }
    await WebBrowser.openBrowserAsync(url);
  };

  const handleViewManual = async (row: EquipmentManual) => {
    await openStorageFile(row.manual_storage_path, "Could not open manual");
  };

  const handleViewReceipt = async (row: EquipmentManual) => {
    await openStorageFile(row.receipt_storage_path, "Could not open receipt");
  };

  const handleRemoveStoredManual = async () => {
    if (!editing?.manual_storage_path) return;
    await triggerMedium();
    Alert.alert(
      "Remove manual",
      "Delete the saved manual file from HomeKeep?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              const { error: storageErr } =
                await EquipmentManualService.deleteStorageObject(
                  editing.manual_storage_path!
                );
              if (storageErr) {
                throw new Error(
                  storageErr.message ||
                    "Could not delete the manual file from storage."
                );
              }
              const { error } = await EquipmentManualService.updateEquipmentManual(
                editing.id,
                {
                  manual_storage_path: null,
                  manual_mime_type: null,
                }
              );
              if (error) throw new Error(error.message);
              setEditing((prev) =>
                prev
                  ? {
                      ...prev,
                      manual_storage_path: null,
                      manual_mime_type: null,
                    }
                  : null
              );
              await loadItems();
            } catch (e) {
              Alert.alert(
                "Remove failed",
                e instanceof Error ? e.message : "Try again."
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleRemoveStoredReceipt = async () => {
    if (!editing?.receipt_storage_path) return;
    await triggerMedium();
    Alert.alert(
      "Remove receipt",
      "Delete the saved receipt file from HomeKeep?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              const { error: storageErr } =
                await EquipmentManualService.deleteStorageObject(
                  editing.receipt_storage_path!
                );
              if (storageErr) {
                throw new Error(
                  storageErr.message ||
                    "Could not delete the receipt file from storage."
                );
              }
              const { error } = await EquipmentManualService.updateEquipmentManual(
                editing.id,
                {
                  receipt_storage_path: null,
                  receipt_mime_type: null,
                }
              );
              if (error) throw new Error(error.message);
              setEditing((prev) =>
                prev
                  ? {
                      ...prev,
                      receipt_storage_path: null,
                      receipt_mime_type: null,
                    }
                  : null
              );
              await loadItems();
            } catch (e) {
              Alert.alert(
                "Remove failed",
                e instanceof Error ? e.message : "Try again."
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!(await requirePlus())) return;
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Give this equipment a name.");
      return;
    }

    setSaving(true);
    try {
      let equipmentId = editing?.id;
      const purchaseIso =
        purchaseDate !== null ? format(purchaseDate, "yyyy-MM-dd") : null;

      if (!equipmentId) {
        const { data: created, error: createErr } =
          await EquipmentManualService.createEquipmentManual({
            name: trimmed,
            model_number: modelNumber.trim() || null,
            purchase_date: purchaseIso,
          });
        if (createErr || !created) {
          throw new Error(createErr?.message ?? "Could not save.");
        }
        equipmentId = created.id;
      } else {
        const { error: updErr } =
          await EquipmentManualService.updateEquipmentManual(equipmentId, {
            name: trimmed,
            model_number: modelNumber.trim() || null,
            purchase_date: purchaseIso,
          });
        if (updErr) throw new Error(updErr.message);
      }

      if (pendingUri && pendingMime && pendingFileName && equipmentId) {
        const priorPath = editing?.manual_storage_path;
        if (priorPath) {
          const { error: priorDelErr } =
            await EquipmentManualService.deleteStorageObject(priorPath);
          if (priorDelErr) {
            throw new Error(
              priorDelErr.message ||
                "Could not remove the previous manual file from storage."
            );
          }
        }
        const { path: storagePath, error: upErr } =
          await EquipmentManualService.uploadManualFromUri(
            equipmentId,
            pendingUri,
            pendingMime,
            pendingFileName
          );
        if (upErr || !storagePath) {
          throw new Error(upErr?.message ?? "Upload failed.");
        }
        const { error: linkErr } =
          await EquipmentManualService.updateEquipmentManual(equipmentId, {
            manual_storage_path: storagePath,
            manual_mime_type: pendingMime,
          });
        if (linkErr) throw new Error(linkErr.message);
      }

      if (
        pendingReceiptUri &&
        pendingReceiptMime &&
        pendingReceiptFileName &&
        equipmentId
      ) {
        const priorReceiptPath = editing?.receipt_storage_path;
        if (priorReceiptPath) {
          const { error: priorDelErr } =
            await EquipmentManualService.deleteStorageObject(priorReceiptPath);
          if (priorDelErr) {
            throw new Error(
              priorDelErr.message ||
                "Could not remove the previous receipt file from storage."
            );
          }
        }
        const { path: receiptPath, error: receiptUpErr } =
          await EquipmentManualService.uploadReceiptFromUri(
            equipmentId,
            pendingReceiptUri,
            pendingReceiptMime,
            pendingReceiptFileName
          );
        if (receiptUpErr || !receiptPath) {
          throw new Error(receiptUpErr?.message ?? "Receipt upload failed.");
        }
        const { error: receiptLinkErr } =
          await EquipmentManualService.updateEquipmentManual(equipmentId, {
            receipt_storage_path: receiptPath,
            receipt_mime_type: pendingReceiptMime,
          });
        if (receiptLinkErr) throw new Error(receiptLinkErr.message);
      }

      await loadItems();
      await triggerLight();

      const wasCreate = !editing;
      resetForm();
      setEditing(null);

      if (wasCreate && equipmentId) {
        const hints = hintsForEquipmentName(trimmed);
        if (hints.length > 0) {
          const { data: routines } =
            await MaintenanceService.getMaintenanceRoutines({
              is_active: true,
            });
          const { toLink, toCreate } = partitionEquipmentHints(
            hints,
            routines ?? []
          );
          if (toLink.length > 0 || toCreate.length > 0) {
            setHintEquipmentId(equipmentId);
            setHintEquipmentName(trimmed);
            setHintCreate(toCreate);
            setHintLinkIds(toLink.map((row) => row.id));
            setHintLinkTitles(toLink.map((row) => row.title));
            setHintMask([
              ...toCreate.map(() => true),
              ...toLink.map(() => true),
            ]);
            setScreenMode("hints");
            return;
          }
        }
        if (onAddRecurringTask) {
          Alert.alert(
            "Equipment saved",
            "Add a recurring reminder for this equipment?",
            [
              { text: "Not now", style: "cancel" },
              {
                text: "Add a task",
                onPress: () => onAddRecurringTask(equipmentId),
              },
            ]
          );
        }
      }

      setScreenMode("list");
    } catch (e) {
      Alert.alert(
        "Save failed",
        e instanceof Error ? e.message : "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const applyEquipmentHints = async () => {
    if (!hintEquipmentId) return;
    setSaving(true);
    try {
      const selectedCreate = hintCreate.filter((_, index) => hintMask[index]);
      const selectedLink = hintLinkIds.filter(
        (_, index) => hintMask[hintCreate.length + index]
      );
      for (const item of selectedCreate) {
        const [payload] = buildRoutinePayloadsFromItems([item]);
        const result = await createTask({
          ...payload,
          equipment_id: hintEquipmentId,
        });
        if (!result.success) {
          throw new Error(result.error ?? "Could not add reminder");
        }
      }
      for (const id of selectedLink) {
        const result = await updateTask(id, { equipment_id: hintEquipmentId });
        if (!result.success) {
          throw new Error(result.error ?? "Could not link reminder");
        }
      }
      await triggerLight();
      setScreenMode("list");
      setHintEquipmentId(null);
    } catch (e) {
      Alert.alert(
        "Could not add reminders",
        e instanceof Error ? e.message : "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: EquipmentManual) => {
    if (deletingIds.has(item.id)) return;
    await triggerMedium();
    Alert.alert(
      "Delete equipment",
      `Remove “${item.name}” and any saved manual or receipt?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingIds((prev) => new Set(prev).add(item.id));
            try {
              const { error } =
                await EquipmentManualService.deleteEquipmentManual(item.id);
              if (error) throw new Error(error.message);
              await triggerLight();
              setItems((prev) => prev.filter((x) => x.id !== item.id));
            } catch (e) {
              Alert.alert(
                "Delete failed",
                e instanceof Error ? e.message : "Try again."
              );
            } finally {
              setDeletingIds((prev) => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
              });
            }
          },
        },
      ]
    );
  };

  const formatPurchase = (iso: string | null) => {
    if (!iso) return null;
    try {
      return format(parseISO(iso), "MMM d, yyyy");
    } catch {
      return iso;
    }
  };

  const renderHintRow = ({
    key,
    title,
    meta,
    checked,
    onToggle,
  }: {
    key: string;
    title: string;
    meta: string;
    checked: boolean;
    onToggle: () => void;
  }) => (
    <TouchableOpacity
      key={key}
      onPress={onToggle}
      style={[
        styles.hintRow,
        {
          borderColor: checked ? colors.primary : colors.border,
          backgroundColor: checked ? colors.primary + "12" : colors.fieldFill,
        },
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={title}
    >
      <View style={styles.hintCheckbox}>
        <Ionicons
          name={checked ? "checkbox" : "square-outline"}
          size={24}
          color={checked ? colors.primary : colors.textSecondary}
        />
      </View>
      <View style={styles.hintText}>
        <Text style={[styles.hintTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.hintMeta, { color: colors.textSecondary }]}>
          {meta}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const listSubtitle =
    items.length === 0
      ? "Manuals, models, and purchase dates in one place"
      : `${items.length} item${items.length === 1 ? "" : "s"} · tap a row to edit`;

  const renderAttachmentChip = (
    label: string,
    attached: boolean,
    icon: React.ComponentProps<typeof Ionicons>["name"]
  ) => (
    <View
      style={[
        styles.statusChip,
        {
          backgroundColor: attached ? colors.primary + "12" : colors.fieldFill,
          borderColor: attached ? colors.primary + "33" : colors.border,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={12}
        color={attached ? colors.primary : colors.textSecondary}
      />
      <Text
        style={[
          styles.statusChipText,
          { color: attached ? colors.primary : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: EquipmentManual }) => {
    const isDeleting = deletingIds.has(item.id);
    const purchaseLabel = formatPurchase(item.purchase_date);
    const iconHit = isTablet ? getResponsiveValue(18, 20, 22) : 18;

    return (
      <HearthSurfaceCard containerStyle={styles.equipmentCard}>
        <View style={styles.equipmentRow}>
          <View
            style={[
              styles.equipmentIconBadge,
              { backgroundColor: colors.primary + "14" },
            ]}
          >
            <Ionicons name="construct-outline" size={22} color={colors.primary} />
          </View>

          <TouchableOpacity
            style={styles.equipmentMainTouchable}
            onPress={() => openEdit(item)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${item.name}`}
          >
            <View style={styles.equipmentMain}>
              <Text
                style={[
                  styles.equipmentTitle,
                  { color: colors.text },
                  isTablet && {
                    fontSize:
                      (styles.equipmentTitle.fontSize || 16) * fontMultiplier,
                  },
                ]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              {item.model_number ? (
                <Text
                  style={[
                    styles.equipmentMeta,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  Model {item.model_number}
                </Text>
              ) : null}
              {purchaseLabel ? (
                <Text
                  style={[
                    styles.equipmentMeta,
                    { color: colors.textSecondary },
                  ]}
                >
                  Purchased {purchaseLabel}
                </Text>
              ) : null}
              <View style={styles.chipRow}>
                {renderAttachmentChip(
                  item.manual_storage_path ? "Manual" : "No manual",
                  Boolean(item.manual_storage_path),
                  "document-text-outline"
                )}
                {renderAttachmentChip(
                  item.receipt_storage_path ? "Receipt" : "No receipt",
                  Boolean(item.receipt_storage_path),
                  "receipt-outline"
                )}
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.equipmentRowActions}>
            {item.receipt_storage_path ? (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.fieldFill,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleViewReceipt(item)}
                accessibilityRole="button"
                accessibilityLabel={`View receipt for ${item.name}`}
              >
                <Ionicons
                  name="receipt-outline"
                  size={iconHit}
                  color={colors.primary}
                />
              </TouchableOpacity>
            ) : null}
            {item.manual_storage_path ? (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.fieldFill,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleViewManual(item)}
                accessibilityRole="button"
                accessibilityLabel={`View manual for ${item.name}`}
              >
                <Ionicons
                  name="document-text-outline"
                  size={iconHit}
                  color={colors.primary}
                />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.error + "10",
                  borderColor: colors.error + "30",
                },
                isDeleting && styles.deletingButton,
              ]}
              onPress={() => handleDelete(item)}
              disabled={isDeleting}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.name}`}
            >
              <Ionicons
                name={isDeleting ? "hourglass-outline" : "trash-outline"}
                size={iconHit}
                color={colors.error}
              />
            </TouchableOpacity>
          </View>
        </View>
      </HearthSurfaceCard>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIconCircle,
          { backgroundColor: colors.primary + "14" },
        ]}
      >
        <Ionicons name="file-tray-full-outline" size={32} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No equipment yet
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        Store manuals, model numbers, and receipts for everything you maintain
        at home.
      </Text>
      <View style={styles.emptyAction}>
        <Button label="Add equipment" onPress={openAdd} variant="primary" />
      </View>
    </View>
  );

  const renderForm = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={DesignSystem.spacing.xl}
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.sectionLabel,
            { color: colors.textSecondary, marginTop: 0 },
          ]}
        >
          Details
        </Text>
        <FormField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Water heater, mower, router"
          required
          autoCapitalize="sentences"
        />
        <FormField
          label="Model number"
          value={modelNumber}
          onChangeText={setModelNumber}
          placeholder="Optional"
          autoCapitalize="characters"
        />

        <Text
          style={[
            styles.sectionLabel,
            { color: colors.textSecondary },
            isTablet && { fontSize: 13 * fontMultiplier },
          ]}
        >
          Purchase date (optional)
        </Text>
        <TouchableOpacity
          style={[
            styles.dateButton,
            {
              backgroundColor: colors.fieldFill,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setShowPurchasePicker((v) => !v)}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={[styles.dateButtonText, { color: colors.text }]}>
            {purchaseDate
              ? format(purchaseDate, "MMM d, yyyy")
              : "Tap to set date"}
          </Text>
        </TouchableOpacity>
        {purchaseDate ? (
          <TouchableOpacity onPress={clearPurchaseDate} style={{ marginTop: 8 }}>
            <Text style={{ color: colors.error, fontSize: 14 }}>Clear date</Text>
          </TouchableOpacity>
        ) : null}
        {showPurchasePicker ? (
          <DateTimePicker
            value={purchaseDate ?? new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handlePurchaseDateChange}
            themeVariant={isDark ? "dark" : "light"}
          />
        ) : null}
        {Platform.OS === "ios" && showPurchasePicker ? (
          <TouchableOpacity
            onPress={() => setShowPurchasePicker(false)}
            style={{ alignSelf: "flex-end", marginTop: 8 }}
          >
            <Text style={{ color: colors.primary, fontWeight: "600" }}>Done</Text>
          </TouchableOpacity>
        ) : null}

        <Text
          style={[
            styles.sectionLabel,
            { color: colors.textSecondary },
            isTablet && { fontSize: 13 * fontMultiplier },
          ]}
        >
          Attachments
        </Text>
        <View
          style={[
            styles.attachCard,
            {
              backgroundColor: colors.fieldFill,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.attachTitle, { color: colors.text }]}>
            {pendingFileName
              ? pendingFileName
              : editing?.manual_storage_path
                ? "Manual on file"
                : "No manual attached"}
          </Text>
          <Text style={[styles.attachHint, { color: colors.textSecondary }]}>
            Attach a PDF from Files or a photo from your library or camera.
          </Text>
          <View style={styles.rowButtons}>
            <TouchableOpacity
              style={[
                styles.attachButton,
                {
                  borderColor: colors.primary + "44",
                  backgroundColor: colors.primary + "12",
                },
              ]}
              onPress={() => promptAttach("manual")}
            >
              <Text style={[styles.attachButtonText, { color: colors.primary }]}>
                {pendingUri || editing?.manual_storage_path ? "Replace" : "Attach"}
              </Text>
            </TouchableOpacity>
            {editing?.manual_storage_path ? (
              <TouchableOpacity
                style={[
                  styles.attachButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
                onPress={() => handleViewManual(editing)}
              >
                <Text style={[styles.attachButtonText, { color: colors.primary }]}>
                  View
                </Text>
              </TouchableOpacity>
            ) : null}
            {editing?.manual_storage_path ? (
              <TouchableOpacity
                style={[
                  styles.attachButton,
                  {
                    borderColor: colors.error + "40",
                    backgroundColor: colors.error + "10",
                  },
                ]}
                onPress={handleRemoveStoredManual}
              >
                <Text style={[styles.attachButtonText, { color: colors.error }]}>
                  Remove
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <Text
          style={[styles.sectionLabel, { color: colors.textSecondary }]}
        >
          Receipt
        </Text>
        <View
          style={[
            styles.attachCard,
            {
              backgroundColor: colors.fieldFill,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.attachTitle, { color: colors.text }]}>
            {pendingReceiptFileName
              ? pendingReceiptFileName
              : editing?.receipt_storage_path
                ? "Receipt on file"
                : "No receipt attached"}
          </Text>
          <Text style={[styles.attachHint, { color: colors.textSecondary }]}>
            Store your receipt as a PDF or photo for warranty and returns.
          </Text>
          <View style={styles.rowButtons}>
            <TouchableOpacity
              style={[
                styles.attachButton,
                {
                  borderColor: colors.primary + "44",
                  backgroundColor: colors.primary + "12",
                },
              ]}
              onPress={() => promptAttach("receipt")}
            >
              <Text style={[styles.attachButtonText, { color: colors.primary }]}>
                {pendingReceiptUri || editing?.receipt_storage_path
                  ? "Replace"
                  : "Attach"}
              </Text>
            </TouchableOpacity>
            {editing?.receipt_storage_path ? (
              <TouchableOpacity
                style={[
                  styles.attachButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
                onPress={() => handleViewReceipt(editing)}
              >
                <Text style={[styles.attachButtonText, { color: colors.primary }]}>
                  View
                </Text>
              </TouchableOpacity>
            ) : null}
            {editing?.receipt_storage_path ? (
              <TouchableOpacity
                style={[
                  styles.attachButton,
                  {
                    borderColor: colors.error + "40",
                    backgroundColor: colors.error + "10",
                  },
                ]}
                onPress={handleRemoveStoredReceipt}
              >
                <Text style={[styles.attachButtonText, { color: colors.error }]}>
                  Remove
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </ScrollView>
      <View style={[styles.formFooter, { borderTopColor: colors.border }]}>
        <Button
          label="Save equipment"
          onPress={() => void handleSave()}
          loading={saving}
          disabled={saving}
        />
      </View>
    </KeyboardAvoidingView>
  );

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <Pressable
          style={styles.backdropPressable}
          onPress={handleClose}
          accessibilityLabel="Dismiss"
        />
        <Animated.View
          style={[
            styles.sheetContainer,
            getTabletSheetContainerStyle(),
            animatedSheetStyle,
          ]}
          pointerEvents="auto"
        >
          <View
            style={[
              styles.sheetSurface,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              DesignSystem.shadows.softKey,
            ]}
          >
            <LinearGradient
              colors={authAtmosphere}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.35 }}
              style={styles.atmosphereFill}
              pointerEvents="none"
            />

            <SafeAreaView edges={["bottom"]} style={styles.sheetSafeArea}>
              <SheetGrabber />

              {screenMode === "hints" ? (
                <>
                  <View style={styles.formNavRow}>
                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={async () => {
                        await triggerLight();
                        setScreenMode("list");
                        setHintEquipmentId(null);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Skip reminders"
                    >
                      <Ionicons
                        name="chevron-back"
                        size={24}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={handleClose}
                      accessibilityRole="button"
                      accessibilityLabel="Close"
                    >
                      <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.formTitleBlock} accessibilityRole="header">
                    <Text style={[styles.formTitle, { color: colors.text }]}>
                      Add reminders for {hintEquipmentName}?
                    </Text>
                    <Text
                      style={[styles.formSubtitle, { color: colors.textSecondary }]}
                    >
                      We’ll attach these to this equipment. Uncheck anything you
                      don’t want.
                    </Text>
                  </View>
                </>
              ) : screenMode === "form" ? (
                <>
                  <View style={styles.formNavRow}>
                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={async () => {
                        await triggerLight();
                        setScreenMode("list");
                        resetForm();
                        setEditing(null);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Back to list"
                    >
                      <Ionicons
                        name="chevron-back"
                        size={24}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={handleClose}
                      accessibilityRole="button"
                      accessibilityLabel="Close"
                    >
                      <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.formTitleBlock} accessibilityRole="header">
                    <Text style={[styles.formTitle, { color: colors.text }]}>
                      {editing ? "Edit equipment" : "Add equipment"}
                    </Text>
                    <Text
                      style={[styles.formSubtitle, { color: colors.textSecondary }]}
                    >
                      {editing
                        ? "Update details or replace attached files."
                        : "Name it, then attach a manual or receipt."}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.titleRow} accessibilityRole="header">
                  <View style={styles.titleBlock}>
                    <Text style={[styles.sheetTitle, { color: colors.text }]}>
                      Equipment & manuals
                    </Text>
                    <Text
                      style={[styles.sheetSubtitle, { color: colors.textSecondary }]}
                    >
                      {listSubtitle}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={handleClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}

              {!isConfigured ? (
                <View style={styles.emptyState}>
                  <View
                    style={[
                      styles.emptyIconCircle,
                      { backgroundColor: colors.primary + "14" },
                    ]}
                  >
                    <Ionicons
                      name="cloud-offline-outline"
                      size={32}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    Sign in required
                  </Text>
                  <Text
                    style={[styles.emptySubtext, { color: colors.textSecondary }]}
                  >
                    Connect Supabase in your environment to sync manuals.
                  </Text>
                </View>
              ) : screenMode === "hints" ? (
                <ScrollView
                  style={styles.list}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                >
                  {hintCreate.map((item, index) =>
                    renderHintRow({
                      key: `create-${item.title}`,
                      title: item.title,
                      meta: "New reminder",
                      checked: !!hintMask[index],
                      onToggle: () =>
                        setHintMask((prev) => {
                          const next = [...prev];
                          next[index] = !next[index];
                          return next;
                        }),
                    })
                  )}
                  {hintLinkTitles.map((title, index) => {
                    const maskIndex = hintCreate.length + index;
                    return renderHintRow({
                      key: `link-${hintLinkIds[index]}`,
                      title,
                      meta: "Already on your schedule — link to this equipment",
                      checked: !!hintMask[maskIndex],
                      onToggle: () =>
                        setHintMask((prev) => {
                          const next = [...prev];
                          next[maskIndex] = !next[maskIndex];
                          return next;
                        }),
                    });
                  })}
                  <Button
                    label={saving ? "Adding…" : "Add selected"}
                    onPress={() => void applyEquipmentHints()}
                    disabled={saving}
                  />
                  {onAddRecurringTask && hintEquipmentId ? (
                    <Button
                      label="Add a different task"
                      onPress={() => onAddRecurringTask(hintEquipmentId)}
                      variant="ghost"
                    />
                  ) : null}
                </ScrollView>
              ) : screenMode === "list" ? (
                loading ? (
                  <View style={styles.emptyState}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : (
                  <>
                    <FlatList
                      data={items}
                      keyExtractor={(it) => it.id}
                      renderItem={renderItem}
                      contentContainerStyle={styles.listContent}
                      style={styles.list}
                      showsVerticalScrollIndicator={false}
                      ListEmptyComponent={renderEmptyList}
                    />
                    {items.length > 0 ? (
                      <View
                        style={[
                          styles.listFooter,
                          { borderTopColor: colors.border },
                        ]}
                      >
                        <Button
                          label="Add equipment"
                          onPress={openAdd}
                          variant="primary"
                        />
                      </View>
                    ) : null}
                  </>
                )
              ) : (
                renderForm()
              )}
            </SafeAreaView>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
