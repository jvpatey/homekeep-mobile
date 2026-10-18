import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useDevice, useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { IconChip, SectionHeader } from "../ui";

export interface HomeTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  /** Saved count; null while loading. */
  count: number | null;
  descriptor: string;
  locked?: boolean;
  onPress: () => void;
}

/** Things kept about the home, as a two-column grid of tiles. */
export function ThingsGrid({ tiles }: { tiles: HomeTileProps[] }) {
  const { isRegularWidth } = useDevice();
  return (
    <View>
      <SectionHeader title="Things" />
      <View style={styles.grid}>
        {tiles.map((tile) => (
          <HomeTile
            key={tile.title}
            {...tile}
            wide={isRegularWidth}
          />
        ))}
      </View>
    </View>
  );
}

export function HomeTile({
  icon,
  tint,
  title,
  count,
  descriptor,
  locked,
  onPress,
  wide = false,
}: HomeTileProps & { wide?: boolean }) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  const countLabel = count == null ? "—" : String(count);

  return (
    <Pressable
      onPress={() => {
        void triggerLight();
        onPress();
      }}
      style={({ pressed }) => [
        styles.tile,
        wide && styles.tileWide,
        { backgroundColor: colors.surface, borderColor: colors.border },
        DesignSystem.shadows.softAmbient,
        pressed && { opacity: 0.7 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={[
        title,
        locked ? "HomeKeep Plus" : `${countLabel} saved`,
        descriptor,
      ].join(". ")}
    >
      <View style={styles.top}>
        <IconChip icon={icon} tint={tint} size={34} />
        {locked ? (
          <Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
        ) : (
          <Text
            style={[styles.count, { color: colors.text }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
          >
            {countLabel}
          </Text>
        )}
      </View>
      <View style={styles.text}>
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}
        >
          {title}
        </Text>
        <Text
          style={[styles.descriptor, { color: colors.textSecondary }]}
          numberOfLines={2}
          maxFontSizeMultiplier={1.3}
        >
          {descriptor}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm + 2,
  },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 112,
    padding: DesignSystem.spacing.md - 2,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "space-between",
    gap: DesignSystem.spacing.sm,
  },
  /** Regular-width iPad: three columns inside the centered tab column. */
  tileWide: {
    flexBasis: "31%",
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  count: {
    fontFamily: DesignSystem.fonts.displaySemiBold,
    fontSize: 24,
    lineHeight: 30,
    fontVariant: ["tabular-nums"],
  },
  text: {
    gap: 2,
  },
  title: {
    ...DesignSystem.typography.subhead,
    fontWeight: "600",
  },
  descriptor: {
    ...DesignSystem.typography.caption,
  },
});
