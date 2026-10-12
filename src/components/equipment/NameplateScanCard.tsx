import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { useAiScanAccess } from "../../hooks/useAiScanAccess";
import {
  AiError,
  AiService,
  NameplateScanResult,
} from "../../services/AiService";
import { DesignSystem } from "../../theme/designSystem";
import { showActionMenu } from "../../utils/actionMenu";

const MAX_EDGE = 1600;

type Source = "camera" | "library";

async function pickLabelPhoto(source: Source): Promise<string | null> {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      "Permission needed",
      source === "camera"
        ? "Allow camera access to scan an equipment label."
        : "Allow photo library access to pick a label photo."
    );
    return null;
  }
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync({ quality: 0.9 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.9,
        });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const longEdge = Math.max(asset.width ?? 0, asset.height ?? 0);
  const resize =
    longEdge > MAX_EDGE
      ? (asset.width ?? 0) >= (asset.height ?? 0)
        ? [{ resize: { width: MAX_EDGE } }]
        : [{ resize: { height: MAX_EDGE } }]
      : [];
  const prepared = await ImageManipulator.manipulateAsync(asset.uri, resize, {
    compress: 0.75,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  return prepared.base64 ?? null;
}

function chooseSource(): Promise<Source | null> {
  return new Promise((resolve) => {
    showActionMenu({
      title: "Scan the label",
      message: "Get the whole rating plate in frame, without glare.",
      onCancel: () => resolve(null),
      options: [
        {
          label: "Take photo",
          icon: "camera-outline",
          onPress: () => resolve("camera"),
        },
        {
          label: "Photo library",
          icon: "images-outline",
          onPress: () => resolve("library"),
        },
      ],
    });
  });
}

const FRIENDLY_REJECTION: Record<string, string> = {
  not_nameplate:
    "That doesn't look like an equipment label. Try the sticker with the model and serial numbers.",
  unreadable:
    "We couldn't read that label. Try again closer up, with less glare.",
  too_large: "That photo is too large. Try again.",
};

/**
 * "Scan the label" card for the add-equipment form. Reads the rating plate
 * and hands the fields back; the form decides what to fill.
 */
export function NameplateScanCard({
  onResult,
  autoStart = false,
}: {
  onResult: (result: NameplateScanResult) => void;
  /** Open the source picker as soon as the card mounts. */
  autoStart?: boolean;
}) {
  const { colors } = useTheme();
  const { triggerLight, triggerSuccess } = useHaptics();
  const { remaining, requireAccess, recordRemaining } = useAiScanAccess();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const started = useRef(false);

  const scan = async () => {
    if (scanning) return;
    triggerLight();
    if (!(await requireAccess())) return;
    const source = await chooseSource();
    if (!source) return;
    let base64: string | null = null;
    try {
      base64 = await pickLabelPhoto(source);
    } catch {
      Alert.alert(source === "camera" ? "Camera" : "Photos", "Please try again.");
      return;
    }
    if (!base64) return;

    setScanning(true);
    try {
      const { result, remaining: left } = await AiService.scanNameplate(base64);
      recordRemaining(left);
      await triggerSuccess();
      setScanned(true);
      onResult(result);
    } catch (error) {
      if (error instanceof AiError && error.code === "quota_exhausted") {
        recordRemaining(0);
        void requireAccess();
        return;
      }
      const message =
        error instanceof AiError
          ? (error.reason && FRIENDLY_REJECTION[error.reason]) || error.message
          : "Please try again.";
      Alert.alert("Couldn't scan", message);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (!autoStart || started.current) return;
    started.current = true;
    void scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const caption = scanning
    ? "Reading the label…"
    : scanned
      ? "Check the details below, then add it."
      : remaining !== null
        ? `Fills in brand, model, and serial. ${remaining} free scan${remaining === 1 ? "" : "s"} left.`
        : "Fills in brand, model, and serial from the rating plate.";

  return (
    <Pressable
      onPress={() => void scan()}
      disabled={scanning}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.primary + "10",
          borderColor: colors.primary + "40",
        },
        pressed && { opacity: 0.8 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={scanned ? "Scan the label again" : "Scan the label"}
      accessibilityHint="Uses a photo of the equipment's rating plate to fill in the details"
    >
      <View style={[styles.icon, { backgroundColor: colors.primary + "1F" }]}>
        {scanning ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Ionicons
            name={scanned ? "checkmark" : "scan"}
            size={22}
            color={colors.primary}
          />
        )}
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.text }]}>
          {scanned ? "Scanned" : "Scan the label"}
        </Text>
        <Text style={[styles.caption, { color: colors.textSecondary }]}>
          {caption}
        </Text>
      </View>
      {!scanning ? (
        <Text style={[styles.action, { color: colors.primary }]}>
          {scanned ? "Rescan" : "Scan"}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm + 4,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: 1,
    marginBottom: DesignSystem.spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
  },
  title: {
    ...DesignSystem.typography.bodySemiBold,
  },
  caption: {
    ...DesignSystem.typography.caption,
    marginTop: 2,
  },
  action: {
    ...DesignSystem.typography.bodySemiBold,
  },
});
