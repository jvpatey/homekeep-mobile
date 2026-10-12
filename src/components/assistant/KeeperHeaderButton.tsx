import React, { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useHaptics } from "../../hooks";
import { usePlusFeature } from "../../lib/plusFeatures";
import { DesignSystem } from "../../theme/designSystem";
import { AssistantSheet } from "./AssistantSheet";
import { KeeperMark } from "./KeeperMark";

const SIZE = 36;

/** Logo-only Keeper entry for tab headers; opens the assistant sheet. */
export function KeeperHeaderButton() {
  const { triggerLight } = useHaptics();
  const assistant = usePlusFeature("assistant");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => {
          triggerLight();
          void assistant.unlock().then((ok) => {
            if (ok) setOpen(true);
          });
        }}
        hitSlop={6}
        style={({ pressed }) => [styles.hit, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel="Ask Keeper, your HomeKeep AI"
        accessibilityHint="Ask a question or save something about your home"
      >
        <KeeperMark size={SIZE} badge={false} round />
      </Pressable>
      <AssistantSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  hit: {
    minWidth: DesignSystem.components.minTouchTarget,
    minHeight: DesignSystem.components.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
});
