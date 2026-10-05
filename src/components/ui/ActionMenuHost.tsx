import React, { useEffect, useRef, useState } from "react";
import { Platform, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";
import {
  ActionMenuOption,
  ActionMenuRequest,
  registerActionMenuHost,
} from "../../utils/actionMenu";
import { HearthSheet } from "./HearthSheet";
import { SheetActionRow } from "./sheet-action-row";

/** Android renderer for `showActionMenu`. Mount once near the app root. */
export function ActionMenuHost() {
  const { colors } = useTheme();
  const [request, setRequest] = useState<ActionMenuRequest | null>(null);
  const [visible, setVisible] = useState(false);
  const pendingRef = useRef<ActionMenuOption | null>(null);

  useEffect(() => {
    if (Platform.OS === "ios") return;
    return registerActionMenuHost((next) => {
      pendingRef.current = null;
      setRequest(next);
      setVisible(true);
    });
  }, []);

  if (Platform.OS === "ios" || !request) return null;

  return (
    <HearthSheet
      visible={visible}
      onClose={() => setVisible(false)}
      onDismissed={() => {
        const chosen = pendingRef.current;
        pendingRef.current = null;
        setRequest(null);
        if (chosen) chosen.onPress();
        else request.onCancel?.();
      }}
      title={request.title ?? "Choose an action"}
      keyboardAvoiding={false}
    >
      {request.message ? (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {request.message}
        </Text>
      ) : null}
      {request.options.map((option, index) => (
        <SheetActionRow
          key={option.label}
          icon={option.icon ?? "ellipse-outline"}
          title={option.label}
          subtitle={option.subtitle}
          destructive={option.destructive}
          showChevron={false}
          showDivider={index < request.options.length - 1}
          onPress={() => {
            pendingRef.current = option;
            setVisible(false);
          }}
        />
      ))}
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
  message: {
    ...DesignSystem.typography.footnote,
    marginBottom: DesignSystem.spacing.sm,
  },
});
