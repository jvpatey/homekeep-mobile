import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
  AccessibilityRole,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { GradientPreset } from "../../../context/UserPreferencesContext";
import { DesignSystem } from "../../../theme/designSystem";
import { getReadableInitialColor } from "../../../theme/contrast";
import { hexWithAlpha } from "../../Dashboard/popups/popupChrome";
import { styles } from "./styles";

interface TintedGlassAvatarProps {
  size: number;
  gradient: GradientPreset;
  initial: string;
  pressable?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Outer ring thickness in points. */
  ringWidth?: number;
}

/**
 * 2026 tinted-glass avatar: a full-opacity gradient ring + soft tinted fill +
 * gradient-derived initial. Belongs to the same chrome family as `GlassCard`
 * and the `haloGradient` popups, so the avatar reads as part of the glass UI
 * rather than a saturated Material chip.
 */
export function TintedGlassAvatar({
  size,
  gradient,
  initial,
  pressable = true,
  onPress,
  accessibilityLabel = "Open profile menu",
  style,
  ringWidth,
}: TintedGlassAvatarProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const ring = ringWidth ?? Math.max(1.5, Math.round(size * 0.04));
  const radius = size / 2;
  const innerSize = size - ring * 2;
  const innerRadius = innerSize / 2;

  const tintAlpha = isDark ? 0.2 : 0.14;
  const initialColor = getReadableInitialColor(
    gradient.colors,
    isDark,
    colors.text
  );

  // Letter sizing: ~42% of the avatar size feels right at every scale tested.
  const initialFontSize = Math.round(size * 0.42);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!pressable) return;
    scale.value = withSpring(0.96, DesignSystem.motion.spring.snappy);
  };

  const handlePressOut = () => {
    if (!pressable) return;
    scale.value = withSpring(1, DesignSystem.motion.spring.snappy);
  };

  const inner = (
    <Animated.View
      style={[
        styles.pressable,
        { width: size, height: size },
        animatedStyle,
        style,
      ]}
    >
      <LinearGradient
        colors={gradient.colors}
        start={gradient.start}
        end={gradient.end}
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: radius,
            padding: ring,
            borderWidth: DesignSystem.borders.hairline,
            borderColor: colors.glassStroke,
          },
        ]}
      >
        <View
          style={[
            styles.surface,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerRadius,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <LinearGradient
            colors={[
              hexWithAlpha(gradient.colors[0], tintAlpha),
              hexWithAlpha(gradient.colors[1], tintAlpha),
            ]}
            start={gradient.start}
            end={gradient.end}
            style={styles.tint}
          />
          <Text
            style={[
              styles.initial,
              { color: initialColor, fontSize: initialFontSize },
            ]}
            allowFontScaling={false}
          >
            {initial}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  if (!pressable || !onPress) {
    return (
      <View
        accessibilityRole={"image" as AccessibilityRole}
        accessibilityLabel={accessibilityLabel}
        style={{ width: size, height: size }}
      >
        {inner}
      </View>
    );
  }

  // Expand hit target up to 44pt for sub-44 avatars.
  const hitPad = size < 44 ? Math.ceil((44 - size) / 2) : 0;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={hitPad ? hitPad : undefined}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{ width: size, height: size }}
    >
      {inner}
    </Pressable>
  );
}
