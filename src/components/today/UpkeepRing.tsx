import React, { ReactNode, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface UpkeepRingProps {
  /** 0–1 */
  progress: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  delay?: number;
  children?: ReactNode;
}

/** Circular progress arc that springs to `progress`; static when motion is reduced. */
export function UpkeepRing({
  progress,
  color,
  size = 112,
  strokeWidth = 10,
  delay = 120,
  children,
}: UpkeepRingProps) {
  const { colors, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = Math.max(0, Math.min(1, progress));
  const fill = useSharedValue(reducedMotion ? target : 0);

  useEffect(() => {
    fill.value = reducedMotion
      ? target
      : withDelay(delay, withSpring(target, DesignSystem.motion.spring.smooth));
  }, [target, reducedMotion, delay, fill]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - fill.value),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? "rgba(255,255,255,0.10)" : colors.fieldFill}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          fill="none"
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  svg: {
    transform: [{ rotate: "-90deg" }],
  },
  center: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
