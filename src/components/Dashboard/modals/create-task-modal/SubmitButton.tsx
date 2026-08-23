import React from "react";
import { View } from "react-native";
import { Button } from "../../../ui";
import { DesignSystem } from "../../../../theme/designSystem";

interface SubmitButtonProps {
  onPress: () => void;
  disabled: boolean;
  title: string;
}

export function SubmitButton({ onPress, disabled, title }: SubmitButtonProps) {
  return (
    <View style={{ paddingTop: DesignSystem.spacing.md }}>
      <Button
        label={title}
        onPress={onPress}
        disabled={disabled}
        variant="primary"
      />
    </View>
  );
}
