import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import { DesignSystem } from "../../../../theme/designSystem";
import { styles } from "./styles";

// interface ModalHeaderProps
interface ModalHeaderProps {
  title: string;
  onClose: () => void;
}

// ModalHeader component for the CreateTaskModal
export function ModalHeader({ title, onClose }: ModalHeaderProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.modalHeader,
        {
          backgroundColor: colors.glass,
          borderBottomColor: colors.glassBorder,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onClose}
        style={[styles.closeButton, { backgroundColor: colors.glass }]}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}
