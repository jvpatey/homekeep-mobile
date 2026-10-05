import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import {
  upsertHomeContact,
  useHomeContacts,
} from "../../hooks/useHomeContacts";
import { HomeContactService } from "../../services/HomeContactService";
import { tradeMeta } from "../../types/homeContact";
import { usePlusFeature } from "../../lib/plusFeatures";
import { DesignSystem } from "../../theme/designSystem";

/**
 * Who did a hired job: recent pros as chips, plus a two-field inline add so
 * the user never leaves the completion sheet.
 */
export function ProPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (contactId: string | null) => void;
}) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  const { items, loaded } = useHomeContacts({ refreshOnFocus: false });
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const { locked } = usePlusFeature("pros");

  const save = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    const { data, error } = await HomeContactService.create({
      name,
      phone,
    });
    setSaving(false);
    if (error || !data) {
      Alert.alert(
        "Couldn't add this pro",
        error?.message ?? "Please try again."
      );
      return;
    }
    upsertHomeContact(data);
    onChange(data.id);
    setAdding(false);
    setName("");
    setPhone("");
  };

  if (locked && loaded && items.length === 0) return null;

  const fieldStyle = {
    backgroundColor: colors.fieldFill,
    borderColor: colors.border,
    color: colors.text,
  };

  return (
    <View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Which pro?
      </Text>
      {!loaded ? (
        <ActivityIndicator
          color={colors.textSecondary}
          style={styles.loading}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.scroller}
          contentContainerStyle={styles.row}
        >
          {items.map((contact) => {
            const active = contact.id === value;
            const meta = tradeMeta(contact.trade);
            return (
              <Pressable
                key={contact.id}
                onPress={() => {
                  triggerLight();
                  onChange(active ? null : contact.id);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active
                      ? colors.primary + "18"
                      : colors.fieldFill,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${contact.name}${contact.company ? `, ${contact.company}` : ""}`}
              >
                <Ionicons
                  name={active ? "checkmark-circle" : meta.icon}
                  size={15}
                  color={active ? colors.primary : meta.tint}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? colors.primary : colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {contact.name}
                </Text>
              </Pressable>
            );
          })}
          {locked ? null : (
            <Pressable
              onPress={() => {
                triggerLight();
                setAdding((open) => !open);
              }}
              style={[
                styles.chip,
                styles.addChip,
                { borderColor: colors.primary },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Add a new pro"
            >
              <Ionicons
                name={adding ? "close" : "add"}
                size={16}
                color={colors.primary}
              />
              <Text style={[styles.chipText, { color: colors.primary }]}>
                {adding ? "Cancel" : "New pro"}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      {adding ? (
        <View style={styles.addCard}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name or company"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, fieldStyle]}
            autoCapitalize="words"
            autoFocus
            returnKeyType="next"
            accessibilityLabel="Pro name"
          />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone (optional)"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, fieldStyle]}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            returnKeyType="done"
            onSubmitEditing={() => void save()}
            accessibilityLabel="Pro phone"
          />
          <Pressable
            onPress={() => void save()}
            disabled={!name.trim() || saving}
            style={[
              styles.saveButton,
              {
                backgroundColor: name.trim() ? colors.primary : colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save pro"
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>Add pro</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...DesignSystem.typography.captionSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: DesignSystem.spacing.sm,
  },
  loading: {
    alignSelf: "flex-start",
    marginVertical: DesignSystem.spacing.sm,
  },
  scroller: {
    marginHorizontal: -DesignSystem.spacing.lg,
    flexGrow: 0,
  },
  row: {
    paddingHorizontal: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 200,
  },
  addChip: {
    borderStyle: "dashed",
    borderWidth: 1,
  },
  chipText: {
    ...DesignSystem.typography.smallSemiBold,
  },
  addCard: {
    marginTop: DesignSystem.spacing.sm,
    gap: DesignSystem.spacing.sm,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: DesignSystem.borders.radius.medium,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 4,
    ...DesignSystem.typography.body,
  },
  saveButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: DesignSystem.borders.radius.medium,
    paddingVertical: DesignSystem.spacing.sm + 4,
  },
  saveText: {
    ...DesignSystem.typography.bodySemiBold,
    color: "#FFFFFF",
  },
});
