import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import { useGradients } from "../../../../hooks";
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
  const { primaryGradient } = useGradients();

  return (
    <LinearGradient
      colors={primaryGradient}
      style={styles.modalHeader}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <TouchableOpacity
        onPress={onClose}
        style={[
          styles.closeButton,
          { backgroundColor: "rgba(255, 255, 255, 0.2)" },
        ]}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.modalTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </LinearGradient>
  );
}
