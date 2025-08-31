import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
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
    <View style={styles.modalHeader}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
      <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}
