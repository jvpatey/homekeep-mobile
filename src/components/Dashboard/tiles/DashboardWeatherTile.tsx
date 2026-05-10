import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useProfile } from "../../../context/ProfileContext";
import { useWeather } from "../../../hooks";
import { tileStyles } from "./styles";

interface DashboardWeatherTileProps {
  /** Called when the tile is tapped while no address is configured. */
  onMissingAddressPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function DashboardWeatherTile({
  onMissingAddressPress,
  style,
}: DashboardWeatherTileProps) {
  const { colors, isDark } = useTheme();
  const { profile } = useProfile();
  const { weather, loading, error, refresh } = useWeather({
    latitude: profile?.latitude ?? null,
    longitude: profile?.longitude ?? null,
  });

  const surface = isDark
    ? "rgba(35, 37, 38, 0.4)"
    : "rgba(255, 255, 255, 0.45)";
  const border = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(255, 255, 255, 0.5)";

  const hasCoords =
    profile?.latitude !== null &&
    profile?.latitude !== undefined &&
    profile?.longitude !== null &&
    profile?.longitude !== undefined;

  const handlePress = () => {
    if (!hasCoords) {
      onMissingAddressPress();
      return;
    }
    refresh();
  };

  const renderBody = () => {
    if (!hasCoords) {
      return (
        <>
          <Text
            style={[tileStyles.primaryText, { color: colors.text }]}
            numberOfLines={1}
          >
            Add your city
          </Text>
          <Text
            style={[
              tileStyles.secondaryText,
              { color: colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            For local weather
          </Text>
        </>
      );
    }

    if (loading && !weather) {
      return (
        <>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text
            style={[
              tileStyles.secondaryText,
              { color: colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            Loading weather…
          </Text>
        </>
      );
    }

    if (error && !weather) {
      return (
        <>
          <Text
            style={[tileStyles.primaryText, { color: colors.text }]}
            numberOfLines={1}
          >
            Weather unavailable
          </Text>
          <Text
            style={[
              tileStyles.secondaryText,
              { color: colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            Tap to retry
          </Text>
        </>
      );
    }

    if (weather) {
      return (
        <>
          <View style={tileStyles.weatherTempRow}>
            <Text style={[tileStyles.weatherTemp, { color: colors.text }]}>
              {weather.temperatureF}
            </Text>
            <Text
              style={[tileStyles.weatherUnit, { color: colors.textSecondary }]}
            >
              °F
            </Text>
          </View>
          <Text
            style={[
              tileStyles.secondaryText,
              { color: colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {weather.conditionLabel}
          </Text>
        </>
      );
    }

    return null;
  };

  return (
    <TouchableOpacity
      style={[
        tileStyles.tile,
        { backgroundColor: surface, borderColor: border },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={
        weather
          ? `Weather: ${weather.temperatureF} degrees, ${weather.conditionLabel}`
          : "Weather"
      }
    >
      <View
        style={[
          tileStyles.iconWrap,
          { backgroundColor: colors.accent + "15" },
        ]}
      >
        <Ionicons
          name={weather?.iconName ?? "partly-sunny-outline"}
          size={18}
          color={colors.accent}
        />
      </View>
      <View style={tileStyles.textCol}>{renderBody()}</View>
    </TouchableOpacity>
  );
}
