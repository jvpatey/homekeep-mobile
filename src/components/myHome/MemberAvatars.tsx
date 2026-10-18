import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import {
  resolveGradientPreset,
  useUserPreferences,
} from "../../context/UserPreferencesContext";
import { DesignSystem } from "../../theme/designSystem";
import { TintedGlassAvatar } from "../ui";
import type { HouseholdMemberView } from "../../services/HouseholdService";

const SIZE = 26;
const MAX_SHOWN = 3;

/** Overlapping avatars for the people sharing the home. */
export function MemberAvatars({
  members,
  currentUserId,
}: {
  members: HouseholdMemberView[];
  currentUserId: string | null | undefined;
}) {
  const { colors } = useTheme();
  const { avatarUrl } = useProfile();
  const { selectedGradient } = useUserPreferences();
  const shown = members.slice(0, MAX_SHOWN);
  const extra = members.length - shown.length;

  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {shown.map((member, index) => {
        const isSelf = member.user_id === currentUserId;
        return (
          <View
            key={member.user_id}
            style={[
              styles.slot,
              index > 0 && styles.overlap,
              { borderColor: colors.surface },
            ]}
          >
            <TintedGlassAvatar
              size={SIZE}
              gradient={
                isSelf ? selectedGradient : resolveGradientPreset(member.avatarStyle)
              }
              initial={member.initial}
              imageUri={isSelf ? avatarUrl ?? member.avatarUrl : member.avatarUrl}
              pressable={false}
            />
          </View>
        );
      })}
      {extra > 0 ? (
        <View
          style={[
            styles.slot,
            styles.overlap,
            styles.extra,
            { backgroundColor: colors.fieldFill, borderColor: colors.surface },
          ]}
        >
          <Text style={[styles.extraText, { color: colors.textSecondary }]}>
            +{extra}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  slot: {
    borderRadius: (SIZE + 4) / 2,
    borderWidth: 2,
  },
  overlap: {
    marginLeft: -8,
  },
  extra: {
    width: SIZE + 4,
    height: SIZE + 4,
    alignItems: "center",
    justifyContent: "center",
  },
  extraText: {
    ...DesignSystem.typography.caption,
    fontWeight: "700",
    fontSize: 10,
  },
});
