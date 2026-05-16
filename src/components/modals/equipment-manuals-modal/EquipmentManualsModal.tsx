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
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
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
import { useGradients, useHaptics, useDevice } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import { GlassCard, SheetGrabber } from "../../ui";
import { FormField } from "../../Dashboard/modals/create-task-modal/FormField";
import { formControlFill } from "../../Dashboard/modals/create-task-modal/formChrome";
import { EquipmentManual } from "../../../types/equipmentManual";
import { EquipmentManualService } from "../../../services/EquipmentManualService";
import { styles } from "./styles";

const { height: screenHeight } = Dimensions.get("window");

type ScreenMode = "list" | "form";

interface EquipmentManualsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EquipmentManualsModal({
  visible,
  onClose,
}: EquipmentManualsModalProps) {
  const { colors, isDark } = useTheme();
  const { isConfigured } = useAuth();
  const { haloGradient } = useGradients();
  const { triggerLight, triggerMedium } = useHaptics();
  const { isTablet, getFontMultiplier, getResponsiveValue, getTabletSheetContainerStyle } =
    useDevice();
  const fontMultiplier = getFontMultiplier();

  const [mounted, setMounted] = useState(visible);
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

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(screenHeight);

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
      setMounted(true);
      loadItems();
    }
  }, [visible, loadItems]);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, {
        duration: DesignSystem.motion.duration.fast,
        easing: DesignSystem.motion.easing.standard,
      });
      translateY.value = withSpring(0, DesignSystem.motion.spring.snappy);
    } else {
      opacity.value = withTiming(0, {
        duration: DesignSystem.motion.duration.fast,
        easing: DesignSystem.motion.easing.standard,
      });
      translateY.value = withTiming(
        screenHeight,
        {
          duration: DesignSystem.motion.duration.fast,
          easing: DesignSystem.motion.easing.standard,
        },
        (finished) => {
          if (finished) runOnJS(setMounted)(false);
        }
      );
    }
  }, [visible]);

  useEffect(() => {
    if (!visible && mounted === false) {
      setScreenMode("list");
      setEditing(null);
      resetForm();
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

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleClose = async () => {
    await triggerLight();
    onClose();
  };

  const openAdd = async () => {
    await triggerLight();
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
      setScreenMode("list");
      resetForm();
      setEditing(null);
    } catch (e) {
      Alert.alert(
        "Save failed",
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

  const renderItem = ({ item }: { item: EquipmentManual }) => {
    const isDeleting = deletingIds.has(item.id);
    const purchaseLabel = formatPurchase(item.purchase_date);
    const iconHit = isTablet ? getResponsiveValue(20, 22, 24) : 20;
    const actionSize = isTablet ? getResponsiveValue(40, 44, 48) : 40;
    const actionRadius = actionSize / 2;

    return (
      <View
        style={[
          styles.equipmentRow,
          {
            backgroundColor: formControlFill(isDark),
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(255, 255, 255, 0.6)",
          },
          isTablet && {
            padding: getResponsiveValue(16, 20, 24),
            marginBottom: getResponsiveValue(12, 16, 20),
            minHeight: getResponsiveValue(152, 164, 176),
          },
        ]}
      >
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
                  isTablet && {
                    fontSize:
                      (styles.equipmentMeta.fontSize || 14) * fontMultiplier,
                  },
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
                  isTablet && {
                    fontSize:
                      (styles.equipmentMeta.fontSize || 14) * fontMultiplier,
                  },
                ]}
              >
                Purchased {purchaseLabel}
              </Text>
            ) : null}
            <Text
              style={[
                styles.equipmentMeta,
                {
                  color: item.manual_storage_path
                    ? colors.primary
                    : colors.textSecondary,
                },
                isTablet && {
                  fontSize:
                    (styles.equipmentMeta.fontSize || 14) * fontMultiplier,
                },
              ]}
            >
              {item.manual_storage_path ? "Manual attached" : "No manual yet"}
            </Text>
            <Text
              style={[
                styles.equipmentMeta,
                {
                  color: item.receipt_storage_path
                    ? colors.primary
                    : colors.textSecondary,
                },
                isTablet && {
                  fontSize:
                    (styles.equipmentMeta.fontSize || 14) * fontMultiplier,
                },
              ]}
            >
              {item.receipt_storage_path
                ? "Receipt attached"
                : "No receipt yet"}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.equipmentRowActions}>
          {item.receipt_storage_path ? (
            <TouchableOpacity
              style={[
                styles.viewManualButton,
                {
                  backgroundColor: colors.primary + "18",
                  width: actionSize,
                  height: actionSize,
                  borderRadius: actionRadius,
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
                styles.viewManualButton,
                {
                  backgroundColor: colors.primary + "18",
                  width: actionSize,
                  height: actionSize,
                  borderRadius: actionRadius,
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
              styles.deleteButton,
              {
                backgroundColor: colors.error + "15",
                width: actionSize,
                height: actionSize,
                borderRadius: actionRadius,
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
    );
  };

  const formFooter = (
    <TouchableOpacity
      style={[
        styles.saveButton,
        {
          backgroundColor: colors.primary,
          opacity: saving ? 0.6 : 1,
        },
      ]}
      onPress={handleSave}
      disabled={saving}
    >
      {saving ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.saveButtonText, { color: "#fff" }]}>
          Save
        </Text>
      )}
    </TouchableOpacity>
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
      >
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
              backgroundColor: formControlFill(isDark),
              borderColor: colors.glassStroke,
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
          Manual (PDF or photo)
        </Text>
        <View
          style={[
            styles.attachCard,
            {
              backgroundColor: formControlFill(isDark),
              borderColor: colors.glassStroke,
            },
          ]}
        >
          <Text style={{ color: colors.text, fontWeight: "600" }}>
            {pendingFileName
              ? `Ready to upload: ${pendingFileName}`
              : editing?.manual_storage_path
                ? "Manual saved"
                : "No file selected"}
          </Text>
          <Text style={[styles.attachHint, { color: colors.textSecondary }]}>
            Attach a PDF from Files or a photo from your library or camera.
          </Text>
          <View style={styles.rowButtons}>
            <TouchableOpacity
              style={[
                styles.textButton,
                {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary + "12",
                },
              ]}
              onPress={() => promptAttach("manual")}
            >
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                {pendingUri || editing?.manual_storage_path
                  ? "Replace"
                  : "Attach"}
              </Text>
            </TouchableOpacity>
            {editing?.manual_storage_path ? (
              <TouchableOpacity
                style={[styles.textButton, { borderColor: colors.glassStroke }]}
                onPress={() => handleViewManual(editing)}
              >
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  View
                </Text>
              </TouchableOpacity>
            ) : null}
            {editing?.manual_storage_path ? (
              <TouchableOpacity
                style={[styles.textButton, { borderColor: colors.error + "40" }]}
                onPress={handleRemoveStoredManual}
              >
                <Text style={{ color: colors.error, fontWeight: "600" }}>
                  Remove file
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <Text
          style={[
            styles.sectionLabel,
            { color: colors.textSecondary },
            isTablet && { fontSize: 13 * fontMultiplier },
          ]}
        >
          Purchase receipt (optional)
        </Text>
        <View
          style={[
            styles.attachCard,
            {
              backgroundColor: formControlFill(isDark),
              borderColor: colors.glassStroke,
            },
          ]}
        >
          <Text style={{ color: colors.text, fontWeight: "600" }}>
            {pendingReceiptFileName
              ? `Ready to upload: ${pendingReceiptFileName}`
              : editing?.receipt_storage_path
                ? "Receipt saved"
                : "No file selected"}
          </Text>
          <Text style={[styles.attachHint, { color: colors.textSecondary }]}>
            Store your receipt as a PDF or photo for warranty and returns.
          </Text>
          <View style={styles.rowButtons}>
            <TouchableOpacity
              style={[
                styles.textButton,
                {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary + "12",
                },
              ]}
              onPress={() => promptAttach("receipt")}
            >
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                {pendingReceiptUri || editing?.receipt_storage_path
                  ? "Replace"
                  : "Attach"}
              </Text>
            </TouchableOpacity>
            {editing?.receipt_storage_path ? (
              <TouchableOpacity
                style={[styles.textButton, { borderColor: colors.glassStroke }]}
                onPress={() => handleViewReceipt(editing)}
              >
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  View
                </Text>
              </TouchableOpacity>
            ) : null}
            {editing?.receipt_storage_path ? (
              <TouchableOpacity
                style={[styles.textButton, { borderColor: colors.error + "40" }]}
                onPress={handleRemoveStoredReceipt}
              >
                <Text style={{ color: colors.error, fontWeight: "600" }}>
                  Remove file
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {formFooter}
      </ScrollView>
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
          <GlassCard
            material="thick"
            radius={DesignSystem.borders.radius.glass}
            containerStyle={styles.glassOuter}
            style={styles.glassInner}
          >
            <LinearGradient
              colors={[...haloGradient]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.haloFill}
              pointerEvents="none"
            />

            <SafeAreaView edges={["bottom"]} style={styles.sheetSafeArea}>
              <SheetGrabber />

              <View
                style={[
                  styles.header,
                  screenMode === "form" ? styles.headerForm : styles.headerList,
                  { borderBottomColor: colors.border },
                ]}
              >
                {screenMode === "form" ? (
                  <>
                    <View style={styles.headerFormToolbar}>
                      <TouchableOpacity
                        style={styles.closeButton}
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
                      <View style={styles.headerToolbarSpacer} />
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClose}
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                      >
                        <Ionicons name="close" size={22} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                    <View
                      style={[
                        styles.headerTitleBlock,
                        styles.headerTitleBlockForm,
                      ]}
                      accessibilityRole="header"
                    >
                      <Text
                        style={[
                          styles.headerHeroTitle,
                          { color: colors.text },
                          isTablet && {
                            fontSize: getResponsiveValue(24, 26, 28),
                            lineHeight: getResponsiveValue(30, 32, 34),
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {editing ? "Edit equipment" : "Add equipment"}
                      </Text>
                      <Text
                        style={[
                          styles.headerHeroSubtitle,
                          { color: colors.textSecondary },
                          isTablet && {
                            fontSize: 15 * fontMultiplier,
                            lineHeight: 21 * fontMultiplier,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {editing
                          ? "Update details or replace the manual file."
                          : "Name it, add model and purchase date, then attach a PDF or photo."}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.headerCloseRow}>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClose}
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                      >
                        <Ionicons name="close" size={22} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                    <View
                      style={[
                        styles.headerTitleBlock,
                        styles.headerTitleBlockForm,
                      ]}
                      accessibilityRole="header"
                    >
                      <Text
                        style={[
                          styles.headerHeroTitle,
                          { color: colors.text },
                          isTablet && {
                            fontSize: getResponsiveValue(24, 26, 28),
                            lineHeight: getResponsiveValue(30, 32, 34),
                          },
                        ]}
                        numberOfLines={2}
                      >
                        Equipment & manuals
                      </Text>
                      <Text
                        style={[
                          styles.headerHeroSubtitle,
                          { color: colors.textSecondary },
                          isTablet && {
                            fontSize: 15 * fontMultiplier,
                            lineHeight: 21 * fontMultiplier,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        Everything you maintain—manuals, models, and dates—in
                        one list.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.addEquipmentButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={openAdd}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Add equipment"
                    >
                      <Text
                        style={[
                          styles.addEquipmentButtonText,
                          { color: "#fff" },
                          isTablet && {
                            fontSize: 17 * fontMultiplier,
                          },
                        ]}
                      >
                        Add equipment
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {!isConfigured ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.emptyText, { color: colors.text }]}>
                    Sign in required
                  </Text>
                  <Text
                    style={[styles.emptySubtext, { color: colors.textSecondary }]}
                  >
                    Connect Supabase in your environment to sync manuals.
                  </Text>
                </View>
              ) : screenMode === "list" ? (
                loading ? (
                  <View style={styles.emptyState}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : (
                  <FlatList
                    data={items}
                    keyExtractor={(it) => it.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    style={styles.list}
                    ListEmptyComponent={
                      <View style={styles.emptyState}>
                        <Ionicons
                          name="hardware-chip-outline"
                          size={48}
                          color={colors.textSecondary}
                        />
                        <Text style={[styles.emptyText, { color: colors.text }]}>
                          No equipment yet
                        </Text>
                        <Text
                          style={[
                            styles.emptySubtext,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Tap Add equipment above to attach a manual.
                        </Text>
                      </View>
                    }
                  />
                )
              ) : (
                renderForm()
              )}
            </SafeAreaView>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
