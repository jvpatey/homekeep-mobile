import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { HearthSheet } from "../ui/HearthSheet";
import { WifiDetails, wifiQrPayload } from "./noteTemplates";

export function WifiQrSheet({
  wifi,
  onClose,
}: {
  wifi: WifiDetails | null;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { triggerSuccess } = useHaptics();
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState<WifiDetails | null>(wifi);

  if (wifi && wifi !== shown) {
    setShown(wifi);
    setCopied(false);
  }

  const copyPassword = async () => {
    if (!shown?.password) return;
    await Clipboard.setStringAsync(shown.password);
    triggerSuccess();
    setCopied(true);
  };

  return (
    <HearthSheet
      visible={wifi != null}
      onClose={onClose}
      title="Join Wi‑Fi"
      keyboardAvoiding={false}
    >
      {shown ? (
        <View style={styles.body}>
          <View style={styles.qrCard}>
            <QRCode
              value={wifiQrPayload(shown)}
              size={208}
              color="#1A1612"
              backgroundColor="#FFFFFF"
            />
          </View>
          <Text
            style={[styles.network, { color: colors.text }]}
            numberOfLines={1}
          >
            {shown.network}
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Guests can open the Camera and point it here to join.
          </Text>
          {shown.password ? (
            <Pressable
              onPress={() => void copyPassword()}
              style={({ pressed }) => [
                styles.copy,
                {
                  backgroundColor: colors.fieldFill,
                  borderColor: colors.border,
                },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Copy password"
            >
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={16}
                color={copied ? colors.success : colors.primary}
              />
              <Text style={[styles.copyText, { color: colors.text }]}>
                {copied ? "Password copied" : "Copy password"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: "center",
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.lg,
  },
  qrCard: {
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.xlarge,
    backgroundColor: "#FFFFFF",
    ...DesignSystem.shadows.softKey,
  },
  network: {
    ...DesignSystem.typography.title2,
    fontSize: 20,
    lineHeight: 26,
    marginTop: DesignSystem.spacing.lg,
  },
  hint: {
    ...DesignSystem.typography.footnote,
    textAlign: "center",
    marginTop: DesignSystem.spacing.xs,
  },
  copy: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs + 2,
    marginTop: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 2,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  copyText: {
    ...DesignSystem.typography.smallSemiBold,
  },
});
