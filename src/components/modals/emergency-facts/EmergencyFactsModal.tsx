import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useProfile } from "../../../context/ProfileContext";
import { HearthSheet } from "../../ui/HearthSheet";
import { Button } from "../../ui/Button";
import { DesignSystem } from "../../../theme/designSystem";
import {
  HomeEmergencyFacts,
  HomeEmergencySpot,
} from "../../../types/homeEmergency";
import { EquipmentManualService } from "../../../services/EquipmentManualService";

interface EmergencyFactsModalProps {
  visible: boolean;
  onClose: () => void;
}

const SPOTS: { key: keyof HomeEmergencyFacts; label: string; hint: string }[] = [
  {
    key: "waterShutoff",
    label: "Main water shutoff",
    hint: "Basement wall, utility room, crawlspace…",
  },
  {
    key: "breakerPanel",
    label: "Breaker panel",
    hint: "Where the main electrical panel lives",
  },
  {
    key: "gasShutoff",
    label: "Gas shutoff",
    hint: "Meter or appliance valve — skip if you have no gas",
  },
];

export function EmergencyFactsModal({
  visible,
  onClose,
}: EmergencyFactsModalProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { profile, updateHomeEmergency } = useProfile();
  const [facts, setFacts] = useState<HomeEmergencyFacts>(
    profile?.home_emergency ?? {}
  );
  const [saving, setSaving] = useState(false);

  const patchSpot = (key: keyof HomeEmergencyFacts, spot: HomeEmergencySpot) => {
    setFacts((prev) => ({ ...prev, [key]: { ...prev[key], ...spot } }));
  };

  const pickPhoto = async (key: keyof HomeEmergencyFacts) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]?.uri || !user) return;
    const path = `${user.id}/emergency/${key}.jpg`;
    const uploaded = await EquipmentManualService.uploadFromUriPublic(
      path,
      result.assets[0].uri,
      "image/jpeg"
    );
    if (uploaded.path) {
      patchSpot(key, { photo_storage_path: uploaded.path });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateHomeEmergency(facts);
      if (!result.success) {
        Alert.alert("Couldn't save", result.error ?? "Please try again.");
        return;
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      title="Emergency map"
      footer={
        <Button
          label={saving ? "Saving…" : "Save"}
          onPress={() => void handleSave()}
          disabled={saving}
        />
      }
    >
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Photos and a short note for shutoffs. When you need them, you will not
        have time to search.
      </Text>
      {SPOTS.map((spot) => (
        <View key={spot.key} style={styles.block}>
          <Text style={[styles.label, { color: colors.text }]}>{spot.label}</Text>
          <TextInput
            value={facts[spot.key]?.note ?? ""}
            onChangeText={(note) => patchSpot(spot.key, { note })}
            placeholder={spot.hint}
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.fieldFill,
              },
            ]}
          />
          <Pressable onPress={() => void pickPhoto(spot.key)}>
            <Text style={{ color: colors.primary, fontWeight: "600" }}>
              {facts[spot.key]?.photo_storage_path
                ? "Photo on file"
                : "Add photo"}
            </Text>
          </Pressable>
        </View>
      ))}
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...DesignSystem.typography.footnote,
    marginBottom: DesignSystem.spacing.lg,
    lineHeight: 20,
  },
  block: {
    marginBottom: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.sm,
  },
  label: {
    ...DesignSystem.typography.body,
    fontWeight: "600",
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.md,
    minHeight: 44,
  },
});
