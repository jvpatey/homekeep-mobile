import React, { useEffect, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  /** `null` renders no thumb (nothing chosen yet). */
  value: T | null;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** iOS-style segmented control with a sliding thumb. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const { colors, isDark } = useTheme();
  const [width, setWidth] = useState(0);
  const matched = options.findIndex((o) => o.value === value);
  const index = Math.max(0, matched);
  const segmentWidth = options.length > 0 ? width / options.length : 0;
  const offset = useSharedValue(0);

  const hadSelection = useRef(matched >= 0);

  useEffect(() => {
    const target = index * segmentWidth;
    offset.value = hadSelection.current
      ? withSpring(target, DesignSystem.motion.spring.smooth)
      : target;
    hadSelection.current = matched >= 0;
  }, [index, matched, segmentWidth, offset]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width - TRACK_PADDING * 2;
    if (Math.abs(next - width) > 0.5) {
      offset.value = index * (next / Math.max(options.length, 1));
      setWidth(next);
    }
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.track,
        { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : colors.fieldFill },
        style,
      ]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {segmentWidth > 0 && matched >= 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              width: segmentWidth,
              backgroundColor: isDark ? "rgba(255,255,255,0.16)" : colors.surface,
            },
            !isDark && DesignSystem.shadows.softAmbient,
            thumbStyle,
          ]}
        />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={styles.segment}
            onPress={() => {
              if (selected) return;
              void Haptics.selectionAsync();
              onChange(option.value);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
          >
            {option.icon ? (
              <Ionicons
                name={option.icon}
                size={14}
                color={selected ? colors.text : colors.textSecondary}
              />
            ) : null}
            <Text
              style={[
                styles.label,
                { color: selected ? colors.text : colors.textSecondary },
                selected && styles.labelSelected,
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const TRACK_PADDING = 2;

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    borderRadius: 10,
    padding: TRACK_PADDING,
    minHeight: 36,
  },
  thumb: {
    position: "absolute",
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: TRACK_PADDING,
    borderRadius: 8,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: DesignSystem.spacing.sm,
    minHeight: 32,
  },
  label: {
    ...DesignSystem.typography.smallMedium,
  },
  labelSelected: {
    fontWeight: "600",
  },
});
