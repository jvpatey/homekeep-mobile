import React from "react";
import { View, Image } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { styles } from "./styles";

export function LogoSection() {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.logoContainer, { backgroundColor: colors.background }]}
    >
      <Image
        source={require("../../../assets/images/homekeep-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}
