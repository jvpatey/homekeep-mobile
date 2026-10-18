import React, { useEffect, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  SharedValue,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
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

/** iOS-style segmented control with a sliding thumb and soft label crossfade. */
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
      ? withSpring(target, DesignSystem.motion.spring.snappy)
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
        {
          backgroundColor: colors.fieldFill,
          borderColor: colors.border,
        },
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
              backgroundColor: colors.surface,
              borderColor: isDark ? colors.border : "transparent",
            },
            DesignSystem.shadows.softAmbient,
            !isDark && DesignSystem.shadows.softKey,
            thumbStyle,
          ]}
        />
      ) : null}
      {options.map((option, i) => (
        <SegmentLabel
          key={option.value}
          option={option}
          index={i}
          segmentWidth={segmentWidth}
          offset={offset}
          selected={option.value === value}
          activeColor={colors.text}
          idleColor={colors.textSecondary}
          onPress={() => {
            if (option.value === value) return;
            void Haptics.selectionAsync();
            onChange(option.value);
          }}
        />
      ))}
    </View>
  );
}

function SegmentLabel<T extends string>({
  option,
  index,
  segmentWidth,
  offset,
  selected,
  activeColor,
  idleColor,
  onPress,
}: {
  option: SegmentOption<T>;
  index: number;
  segmentWidth: number;
  offset: SharedValue<number>;
  selected: boolean;
  activeColor: string;
  idleColor: string;
  onPress: () => void;
}) {
  const press = useSharedValue(0);

  const colorStyle = useAnimatedStyle(() => {
    if (segmentWidth <= 0) {
      return { color: selected ? activeColor : idleColor };
    }
    const center = index * segmentWidth + segmentWidth / 2;
    const thumbCenter = offset.value + segmentWidth / 2;
    const dist = Math.abs(center - thumbCenter) / segmentWidth;
    const t = Math.min(1, Math.max(0, dist));
    return {
      color: interpolateColor(t, [0, 1], [activeColor, idleColor]),
    };
  });

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.04 }],
    opacity: 1 - press.value * 0.1,
  }));

  return (
    <Pressable
      style={styles.segment}
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(1, {
          duration: DesignSystem.motion.duration.instant,
        });
      }}
      onPressOut={() => {
        press.value = withTiming(0, {
          duration: DesignSystem.motion.duration.fast,
        });
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={option.label}
    >
      <Animated.View style={[styles.segmentInner, pressStyle]}>
        {option.icon ? (
          <Ionicons
            name={option.icon}
            size={15}
            color={selected ? activeColor : idleColor}
          />
        ) : null}
        <Animated.Text
          style={[styles.label, selected && styles.labelSelected, colorStyle]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}
        >
          {option.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const TRACK_PADDING = 3;

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    borderRadius: DesignSystem.borders.radius.large,
    padding: TRACK_PADDING,
    minHeight: 42,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    position: "absolute",
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: TRACK_PADDING,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  segment: {
    flex: 1,
    minHeight: 36,
  },
  segmentInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: DesignSystem.spacing.sm,
  },
  label: {
    ...DesignSystem.typography.smallMedium,
  },
  labelSelected: {
    fontWeight: "600",
  },
});
