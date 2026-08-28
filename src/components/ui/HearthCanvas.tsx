import React, { ReactNode } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { useGradients } from "../../hooks";

interface HearthCanvasProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Bone/espresso canvas with a quiet atmosphere wash — same policy as auth. */
export function HearthCanvas({ children, style }: HearthCanvasProps) {
  const { colors } = useTheme();
  const { authAtmosphere } = useGradients();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }, style]}>
      <LinearGradient
        colors={authAtmosphere}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
