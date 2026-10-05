import React, { ReactNode } from "react";
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Platform,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

/**
 * The same atmosphere wash, placed first inside a list header so it scrolls
 * with the content. Tab roots need the scroll view as the screen's first
 * descendant for native tab re-tap (scroll to top) to find it.
 */
export function ScrollAtmosphere() {
  const { authAtmosphere } = useGradients();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const screenTop =
    height + (Platform.OS === "ios" ? insets.top : 0);
  const fade = height * 0.45;
  const total = screenTop + fade;
  const last = authAtmosphere.length - 1;
  const colors = [authAtmosphere[0], ...authAtmosphere] as [
    string,
    string,
    ...string[],
  ];
  const locations = [
    0,
    ...authAtmosphere.map((_, i) => (screenTop + (fade * i) / last) / total),
  ] as [number, number, ...number[]];

  return (
    <LinearGradient
      colors={colors}
      locations={locations}
      style={[styles.scrollAtmosphere, { top: -screenTop, height: total }]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollAtmosphere: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});
