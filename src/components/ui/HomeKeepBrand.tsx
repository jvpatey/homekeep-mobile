import React from "react";
import { Text, View, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { HouseMark } from "./HouseMark";

interface HomeKeepBrandProps {
  size?: "sm" | "md" | "lg";
  style?: StyleProp<ViewStyle>;
}

const FONT_SIZE = { sm: 16, md: 18, lg: 20 } as const;

export function HomeKeepBrand({ size = "md", style }: HomeKeepBrandProps) {
  const { colors } = useTheme();
  const fontSize = FONT_SIZE[size];
  const markSize = fontSize + 2;

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <HouseMark size={markSize} inline style={{ marginRight: 6 }} />
      <Text
        style={{
          color: colors.text,
          fontWeight: "800",
          letterSpacing: -0.6,
          fontSize,
          lineHeight: fontSize + 2,
        }}
      >
        HomeKeep
      </Text>
    </View>
  );
}
