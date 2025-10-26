import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { useFeatureAnimation, useGradients, useHaptics } from "../../../hooks";
import { styles } from "./styles";
import { ActionButtons } from "../../ui";
import { DesignSystem } from "../../../theme/designSystem";

// FeaturesSection component for the FeaturesSection on the onboarding screen
export function FeaturesSection() {
  const { colors, isDark } = useTheme();
  const { iconGradient, glassBorder, glowGradient } = useGradients();
  const featureAnimatedStyles = useFeatureAnimation(3, 600);
  const { triggerLight } = useHaptics();

  // State for modal
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Animation values for modal
  const modalScale = useSharedValue(0.8);
  const modalTranslateY = useSharedValue(50);
  const modalOpacity = useSharedValue(0);

  const features = [
    {
      icon: "list-outline",
      text: "Organize",
      subtitle: "Manage all tasks in one place",
      description:
        "Create, organize, and manage all your home maintenance tasks in one place. Set priorities, due dates, and categories to keep everything organized.",
      animatedStyle: featureAnimatedStyles[0],
    },
    {
      icon: "time-outline",
      text: "Schedule",
      subtitle: "Never miss important maintenance",
      description:
        "Never forget when to clean your gutters, change filters, or service your HVAC again. Get automatic reminders for all your home maintenance needs.",
      animatedStyle: featureAnimatedStyles[1],
    },
    {
      icon: "trophy-outline",
      text: "Track",
      subtitle: "See your maintenance progress",
      description:
        "Celebrate your achievements and track your home maintenance progress. Build a complete history of completed tasks and maintenance milestones.",
      animatedStyle: featureAnimatedStyles[2],
    },
  ];

  const handleFeaturePress = (index: number) => {
    setSelectedFeature(index);
    setIsModalVisible(true);

    // triggerLight function to trigger the light haptic feedback
    triggerLight();

    // Modal entrance animation
    modalScale.value = withSpring(1, { damping: 20, stiffness: 200 });
    modalTranslateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    modalOpacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  };

  const closeModal = () => {
    // Modal exit animation
    modalScale.value = withSpring(0.8, { damping: 20, stiffness: 200 });
    modalTranslateY.value = withSpring(50, { damping: 20, stiffness: 200 });
    modalOpacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.in(Easing.cubic),
    });

    // Delay hiding modal until animation completes
    setTimeout(() => {
      setIsModalVisible(false);
      setSelectedFeature(null);
    }, 200);
  };

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [
      { scale: modalScale.value },
      { translateY: modalTranslateY.value },
    ],
  }));

  return (
    <View style={styles.cardContainer}>
      {/* Feature Highlights - Full Width Stacked Cards */}
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleFeaturePress(index)}
            activeOpacity={0.9}
          >
            <Animated.View
              style={[
                styles.featureItem,
                {
                  backgroundColor: colors.glass,
                  shadowColor: colors.primary,
                },
                feature.animatedStyle,
              ]}
            >
              <View style={styles.featureContentRow}>
                <LinearGradient
                  colors={iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featureIcon}
                >
                  <Ionicons
                    name={feature.icon as any}
                    size={24}
                    color={colors.primary}
                  />
                </LinearGradient>
                <View style={styles.featureTextContainer}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>
                    {feature.text}
                  </Text>
                  <Text
                    style={[
                      styles.featureSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {feature.subtitle}
                  </Text>
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feature Detail Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.glassStrong,
                shadowColor: colors.primary,
              },
              modalAnimatedStyle,
            ]}
          >
            {selectedFeature !== null && (
              <View style={styles.modalHeader}>
                <LinearGradient
                  colors={iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalIcon}
                >
                  <Ionicons
                    name={features[selectedFeature].icon as any}
                    size={32}
                    color={colors.primary}
                  />
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {features[selectedFeature].text}
                </Text>
              </View>
            )}

            {selectedFeature !== null && (
              <Text
                style={[
                  styles.modalDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {features[selectedFeature].description}
              </Text>
            )}

            <TouchableOpacity onPress={closeModal} activeOpacity={0.8}>
              <View
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: isDark
                      ? "rgba(35, 37, 38, 0.5)"
                      : "rgba(255, 255, 255, 0.5)",
                    borderWidth: 1,
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.15)"
                      : "rgba(255, 255, 255, 0.25)",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 2,
                  },
                ]}
              >
                <Text style={[styles.closeButtonText, { color: colors.text }]}>
                  Got it
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Action Buttons */}
      <ActionButtons />
    </View>
  );
}
