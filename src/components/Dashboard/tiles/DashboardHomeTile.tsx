import React from "react";
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useProfile } from "../../../context/ProfileContext";
import { tileStyles } from "./styles";

interface DashboardHomeTileProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

function formatLocality(
  city?: string | null,
  region?: string | null
): string {
  const parts = [city, region].filter(
    (v): v is string => !!v && v.trim().length > 0
  );
  return parts.join(", ");
}

export function DashboardHomeTile({ onPress, style }: DashboardHomeTileProps) {
  const { colors, isDark } = useTheme();
  const { profile } = useProfile();

  const surface = isDark
    ? "rgba(35, 37, 38, 0.4)"
    : "rgba(255, 255, 255, 0.45)";
  const border = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(255, 255, 255, 0.5)";

  const hasAddress =
    !!profile &&
    (profile.address_line1?.trim() ||
      profile.city?.trim() ||
      profile.postal_code?.trim());

  const primary = hasAddress
    ? profile?.address_line1?.trim() ||
      formatLocality(profile?.city, profile?.region) ||
      "Your home"
    : "Add your home address";

  const secondary = hasAddress
    ? profile?.address_line1?.trim()
      ? formatLocality(profile?.city, profile?.region)
      : profile?.country?.trim() || ""
    : "Tap to set it up";

  return (
    <TouchableOpacity
      style={[
        tileStyles.tile,
        { backgroundColor: surface, borderColor: border },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={hasAddress ? "Edit home address" : "Add home address"}
    >
      <View
        style={[
          tileStyles.iconWrap,
          { backgroundColor: colors.primary + "15" },
        ]}
      >
        <Ionicons name="home-outline" size={18} color={colors.primary} />
      </View>
      <View style={tileStyles.textCol}>
        <Text
          style={[tileStyles.primaryText, { color: colors.text }]}
          numberOfLines={1}
        >
          {primary}
        </Text>
        {secondary ? (
          <Text
            style={[
              tileStyles.secondaryText,
              { color: colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {secondary}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
