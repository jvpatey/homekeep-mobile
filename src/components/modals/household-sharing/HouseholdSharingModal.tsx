import React, { useEffect, useState } from "react";
import { Text, TextInput, StyleSheet, Alert } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useProfile } from "../../../context/ProfileContext";
import { HearthSheet } from "../../ui/HearthSheet";
import { Button } from "../../ui/Button";
import { DesignSystem } from "../../../theme/designSystem";
import { HouseholdService } from "../../../services/HouseholdService";

interface HouseholdSharingModalProps {
  visible: boolean;
  onClose: () => void;
}

export function HouseholdSharingModal({
  visible,
  onClose,
}: HouseholdSharingModalProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible || !profile?.household_id) {
      setInvite(null);
      return;
    }
    void HouseholdService.getHousehold(profile.household_id).then((result) => {
      setInvite(result.data?.invite_code ?? null);
    });
  }, [visible, profile?.household_id]);

  const create = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const result = await HouseholdService.createHousehold(user.id);
      if (result.error) {
        Alert.alert("Couldn't create household", result.error.message);
        return;
      }
      setInvite(result.data?.invite_code ?? null);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await HouseholdService.joinHousehold(code);
      if (result.error) {
        Alert.alert("Couldn't join", result.error.message);
        return;
      }
      await refresh();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      await HouseholdService.leaveHousehold(user.id);
      setInvite(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      title="Household"
      footer={<Button label="Close" variant="ghost" onPress={onClose} />}
    >
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Share this home with a partner. They use your invite code to see the
        same house.
      </Text>
      {profile?.household_id ? (
        <>
          <Text style={[styles.label, { color: colors.text }]}>
            Invite code
          </Text>
          <Text style={[styles.code, { color: colors.primary }]}>
            {invite ?? "…"}
          </Text>
          <Button label="Leave household" variant="ghost" onPress={() => void leave()} />
        </>
      ) : (
        <>
          <Button
            label={busy ? "Working…" : "Create household"}
            onPress={() => void create()}
            disabled={busy}
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Or join with a code
          </Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            placeholder="ABC123"
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
          <Button
            label="Join"
            variant="ghost"
            onPress={() => void join()}
            disabled={busy || code.trim().length < 4}
          />
        </>
      )}
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...DesignSystem.typography.footnote,
    marginBottom: DesignSystem.spacing.lg,
    lineHeight: 20,
  },
  label: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
    marginBottom: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.md,
  },
  code: {
    ...DesignSystem.typography.title2,
    letterSpacing: 2,
    marginBottom: DesignSystem.spacing.md,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.md,
    minHeight: 44,
  },
});
