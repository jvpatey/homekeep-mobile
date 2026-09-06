import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useTheme } from "../../context/ThemeContext";
import { useAppleAuthenticationAvailable } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";

interface AppleContinueButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function AppleContinueButton({
  onPress,
  style,
}: AppleContinueButtonProps) {
  const { isDark } = useTheme();
  const available = useAppleAuthenticationAvailable();

  if (!available) {
    return null;
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={
        isDark
          ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
          : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
      }
      cornerRadius={DesignSystem.borders.radius.round}
      style={[{ width: "100%", height: DesignSystem.components.buttonLarge }, style]}
      onPress={onPress}
    />
  );
}
