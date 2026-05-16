import React from "react";
import { Image, Text, View, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";

const LOGO = require("../../../assets/images/homekeep-logo.png");

interface HomeKeepBrandProps {
  size?: "sm" | "md" | "lg";
  style?: StyleProp<ViewStyle>;
}

const FONT_SIZE = { sm: 16, md: 18, lg: 20 } as const;

export function HomeKeepBrand({ size = "md", style }: HomeKeepBrandProps) {
  const { colors } = useTheme();
  const fontSize = FONT_SIZE[size];
  const logoSize = fontSize + 2;

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
      <Image
        source={LOGO}
        style={{
          width: logoSize,
          height: logoSize,
          marginRight: 6,
        }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        accessible
        accessibilityRole="image"
        accessibilityLabel="HomeKeep"
      />
      <Text
        style={{
          color: colors.text,
          fontWeight: "800",
          letterSpacing: -0.6,
          fontSize,
          lineHeight: fontSize + 2,
        }}
      >
        Home
        <Text style={{ color: colors.accent }}>Keep</Text>
      </Text>
    </View>
  );
}
