import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useHaptics } from "../../../hooks";
import {
  GRADIENT_PRESETS,
  GradientPreset,
  useUserPreferences,
} from "../../../context/UserPreferencesContext";
import { styles } from "./styles";
import { ThemeColors } from "../../../types/navigation";

// GradientPickerProps interface for the GradientPicker component
interface GradientPickerProps {
  onGradientSelect?: (gradient: GradientPreset) => void;
  showLabels?: boolean;
}

// GradientPicker component for the GradientPicker on the home screen
export function GradientPicker({
  onGradientSelect,
  showLabels = true,
}: GradientPickerProps) {
  const { colors, isDark } = useTheme();
  const { selectedGradient, updateGradient } = useUserPreferences();
  const { triggerMedium } = useHaptics();

  const gradients = Object.values(GRADIENT_PRESETS);

  // handleGradientSelect function to handle the gradient select
  const handleGradientSelect = async (gradient: GradientPreset) => {
    try {
      await triggerMedium();
      await updateGradient(gradient);
      onGradientSelect?.(gradient);
    } catch (error) {
      console.error("Failed to update gradient:", error);
    }
  };

  return (
    <View style={styles.container}>
      {showLabels && (
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Choose Avatar Style
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Select a gradient that represents you
          </Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gradientContainer}
        decelerationRate="fast"
        snapToInterval={72}
        snapToAlignment="start"
      >
        {gradients.map((gradient) => (
          <GradientOption
            key={gradient.id}
            gradient={gradient}
            isSelected={selectedGradient.id === gradient.id}
            onSelect={handleGradientSelect}
            colors={colors}
            isDark={isDark}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface GradientOptionProps {
  gradient: GradientPreset;
  isSelected: boolean;
  onSelect: (gradient: GradientPreset) => void;
  colors: ThemeColors;
  isDark: boolean;
}

// GradientOption component for the GradientOption on the home screen
function GradientOption({
  gradient,
  isSelected,
  onSelect,
  colors,
}: GradientOptionProps) {
  // Animation values for the gradient option
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(isSelected ? 1 : 0);
  const checkOpacity = useSharedValue(isSelected ? 1 : 0);

  // useEffect hook to handle the selection of the gradient option
  React.useEffect(() => {
    borderOpacity.value = withTiming(isSelected ? 1 : 0, { duration: 200 });
    checkOpacity.value = withTiming(isSelected ? 1 : 0, { duration: 200 });
  }, [isSelected]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedBorderStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  const animatedCheckStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkOpacity.value }],
  }));

  // handlePress function to handle the press of the gradient option
  const handlePress = () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    runOnJS(onSelect)(gradient);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={styles.gradientOption}
    >
      <Animated.View style={[styles.gradientWrapper, animatedContainerStyle]}>
        {/* Selection Border */}
        <Animated.View
          style={[
            styles.selectionBorder,
            { borderColor: colors.primary },
            animatedBorderStyle,
          ]}
        />

        {/* Gradient Circle */}
        <LinearGradient
          colors={gradient.colors}
          style={styles.gradientCircle}
          start={gradient.start}
          end={gradient.end}
        >
          {/* Selection Checkmark */}
          <Animated.View style={[styles.checkContainer, animatedCheckStyle]}>
            <View
              style={[
                styles.checkBackground,
                { backgroundColor: colors.surface },
              ]}
            >
              <Ionicons name="checkmark" size={16} color={colors.primary} />
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Gradient Name */}
        <Text style={[styles.gradientName, { color: colors.text }]}>
          {gradient.name}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}
