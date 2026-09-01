import React, { useRef, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useProfile } from "../../../context/ProfileContext";
import { HearthSheet } from "../../ui/HearthSheet";
import { Button } from "../../ui/Button";
import { DesignSystem } from "../../../theme/designSystem";
import {
  HomeAddressFields,
  HomeAddressFieldsHandle,
} from "./HomeAddressFields";

interface HomeAddressOnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  /** When true, "Skip for now" is hidden — used from Settings. */
  hideSkip?: boolean;
}

/** Standalone address sheet. Prefer HomeSetupModal for first-run onboarding. */
export function HomeAddressOnboardingModal({
  visible,
  onClose,
  hideSkip = false,
}: HomeAddressOnboardingModalProps) {
  const { skipAddressOnboarding } = useProfile();
  const addressRef = useRef<HomeAddressFieldsHandle>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const ok = await addressRef.current?.save();
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await skipAddressOnboarding();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      title="Your home"
      fillMaxHeight
      footer={
        <View style={styles.footerInner}>
          <Button
            label={saving ? "Saving…" : "Save"}
            onPress={() => void handleSave()}
            disabled={!canSubmit || saving}
            accessibilityLabel="Save home address"
          />
          {hideSkip ? (
            <Button label="Cancel" onPress={onClose} variant="ghost" />
          ) : (
            <Button
              label="Skip for now"
              onPress={() => void handleSkip()}
              variant="ghost"
              disabled={saving}
            />
          )}
        </View>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <HomeAddressFields
          ref={addressRef}
          active={visible}
          onCanSubmitChange={setCanSubmit}
        />
      </ScrollView>
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
  footerInner: {
    gap: DesignSystem.spacing.xs,
  },
});
