import React from "react";
import {
  Pressable,
  Text,
  View,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from "react-native";
import Animated from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useScalePress } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { styles as oauthStyles } from "./styles";

interface GoogleContinueButtonProps {
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GoogleContinueButton({
  onPress,
  disabled = false,
  style,
}: GoogleContinueButtonProps) {
  const { colors, isDark } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = useScalePress();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      style={[{ width: "100%", opacity: disabled ? 0.5 : 1 }, style]}
    >
      <Animated.View
        style={[
          oauthStyles.googleButton,
          localStyles.button,
          {
            backgroundColor: isDark ? colors.surface : "#FFFFFF",
            borderColor: colors.border,
          },
          animatedStyle,
        ]}
      >
        <View style={oauthStyles.buttonContent}>
          <View style={oauthStyles.googleIconContainer}>
            <Ionicons name="logo-google" size={20} color="#4285F4" />
          </View>
          <Text style={[oauthStyles.buttonLabel, { color: colors.text }]}>
            Continue with Google
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const localStyles = StyleSheet.create({
  button: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: DesignSystem.borders.radius.round,
  },
});
