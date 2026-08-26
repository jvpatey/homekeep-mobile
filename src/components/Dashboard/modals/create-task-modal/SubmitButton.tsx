import React from "react";
import { View } from "react-native";
import { Button } from "../../../ui";
import { DesignSystem } from "../../../../theme/designSystem";

interface SubmitButtonProps {
  onPress: () => void;
  disabled: boolean;
  loading?: boolean;
  title: string;
}

export function SubmitButton({
  onPress,
  disabled,
  loading = false,
  title,
}: SubmitButtonProps) {
  return (
    <View style={{ paddingTop: DesignSystem.spacing.sm }}>
      <Button
        label={title}
        onPress={onPress}
        disabled={disabled}
        loading={loading}
        accessibilityLabel={title}
      />
    </View>
  );
}
