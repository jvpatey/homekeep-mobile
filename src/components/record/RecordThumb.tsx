import React, { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

/**
 * Rounded photo thumbnail. `uri` is null while the signed URL resolves, so the
 * tile keeps its footprint instead of reflowing the row.
 */
export function RecordThumb({
  uri,
  size = 44,
  onPress,
  accessibilityLabel = "View photo",
}: {
  uri: string | null | undefined;
  size?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const radius = Math.round(size * 0.24);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.fieldFill,
          borderColor: colors.border,
        },
        pressed && { opacity: 0.75 },
      ]}
      accessibilityRole="imagebutton"
      accessibilityLabel={accessibilityLabel}
    >
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons
            name={failed ? "image-outline" : "camera-outline"}
            size={Math.round(size * 0.4)}
            color={colors.textSecondary}
          />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
