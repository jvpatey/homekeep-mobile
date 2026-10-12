import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { HearthSheet } from "../ui/HearthSheet";
import { Button } from "../ui/Button";
import { DesignSystem } from "../../theme/designSystem";
import { HomeContactService } from "../../services/HomeContactService";
import { upsertHomeContact } from "../../hooks/useHomeContacts";
import {
  CONTACT_TRADES,
  CONTACT_TRADE_META,
  ContactTrade,
  HomeContact,
} from "../../types/homeContact";

interface FormState {
  name: string;
  company: string;
  trade: ContactTrade | null;
  phone: string;
  email: string;
  website: string;
  notes: string;
}

function toForm(contact: HomeContact | null): FormState {
  return {
    name: contact?.name ?? "",
    company: contact?.company ?? "",
    trade: contact?.trade ?? null,
    phone: contact?.phone ?? "",
    email: contact?.email ?? "",
    website: contact?.website ?? "",
    notes: contact?.notes ?? "",
  };
}

/** Add or edit a pro. Shared with every household member. */
export function ProFormSheet({
  visible,
  contact,
  onClose,
  onSaved,
}: {
  visible: boolean;
  /** Null to add a new pro. */
  contact: HomeContact | null;
  onClose: () => void;
  onSaved?: (contact: HomeContact) => void;
}) {
  const { colors } = useTheme();
  const { triggerLight, triggerSuccess } = useHaptics();
  const [form, setForm] = useState<FormState>(() => toForm(contact));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm(toForm(contact));
      setSaving(false);
    }
  }, [visible, contact]);

  const set = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const save = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    const input = { ...form };
    const result = contact
      ? await HomeContactService.update(contact.id, input)
      : await HomeContactService.create(input);
    setSaving(false);
    if (result.error || !result.data) {
      Alert.alert(
        "Couldn't save",
        result.error?.message ?? "Please try again."
      );
      return;
    }
    await triggerSuccess();
    upsertHomeContact(result.data);
    onSaved?.(result.data);
    onClose();
  };

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      title={contact ? "Edit pro" : "Add a pro"}
      maxHeightRatio={0.94}
      footer={
        <Button
          label={saving ? "Saving…" : contact ? "Save changes" : "Add pro"}
          onPress={() => void save()}
          disabled={!form.name.trim() || saving}
          loading={saving}
        />
      }
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Field
          label="Name"
          value={form.name}
          onChangeText={(name) => set({ name })}
          placeholder="e.g. Dana Ruiz"
          autoCapitalize="words"
          autoFocus={!contact}
          textContentType="name"
        />
        <Field
          label="Company"
          value={form.company}
          onChangeText={(company) => set({ company })}
          placeholder="Optional"
          autoCapitalize="words"
          textContentType="organizationName"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Trade
        </Text>
        <View style={styles.tradeGrid}>
          {CONTACT_TRADES.map((trade) => {
            const meta = CONTACT_TRADE_META[trade];
            const active = form.trade === trade;
            return (
              <Pressable
                key={trade}
                onPress={() => {
                  triggerLight();
                  set({ trade: active ? null : trade });
                }}
                style={[
                  styles.tradeChip,
                  {
                    backgroundColor: active
                      ? meta.tint + "1F"
                      : colors.fieldFill,
                    borderColor: active ? meta.tint : colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={meta.label}
              >
                <Ionicons name={meta.icon} size={14} color={meta.tint} />
                <Text
                  style={[
                    styles.tradeText,
                    { color: active ? meta.tint : colors.text },
                  ]}
                >
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Field
          label="Phone"
          value={form.phone}
          onChangeText={(phone) => set({ phone })}
          placeholder="Optional"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
        />
        <Field
          label="Email"
          value={form.email}
          onChangeText={(email) => set({ email })}
          placeholder="Optional"
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
        />
        <Field
          label="Website"
          value={form.website}
          onChangeText={(website) => set({ website })}
          placeholder="Optional"
          keyboardType="url"
          autoCapitalize="none"
          textContentType="URL"
        />
        <Field
          label="Notes"
          value={form.notes}
          onChangeText={(notes) => set({ notes })}
          placeholder="Rates, availability, who recommended them…"
          multiline
          style={styles.notes}
        />
      </ScrollView>
    </HearthSheet>
  );
}

function Field({ label, style, ...input }: TextInputProps & { label: string }) {
  const { colors } = useTheme();
  return (
    <>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <TextInput
        {...input}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={label}
        style={[
          styles.input,
          {
            backgroundColor: colors.fieldFill,
            borderColor: colors.border,
            color: colors.text,
          },
          style,
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: DesignSystem.spacing.md,
  },
  label: {
    ...DesignSystem.typography.captionSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: DesignSystem.borders.radius.medium,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 4,
    ...DesignSystem.typography.body,
  },
  notes: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  tradeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
  },
  tradeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs + 3,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tradeText: {
    ...DesignSystem.typography.smallSemiBold,
  },
});
