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

// FeaturesSection component for the FeaturesSection on the onboarding screen
export function FeaturesSection() {
  const { colors } = useTheme();
  const { iconGradient } = useGradients();
  const featureAnimatedStyles = useFeatureAnimation(3, 600);
  const { triggerLight } = useHaptics();

  // State for modal
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Animation values for tap effect
  const tapScale = useSharedValue(1);
  const tapRotation = useSharedValue(0);

  // Animation values for modal
  const modalScale = useSharedValue(0.8);
  const modalTranslateY = useSharedValue(50);
  const modalOpacity = useSharedValue(0);

  const features = [
    {
      icon: "list-outline",
      text: "Task Organization",
      description:
        "Create, organize, and manage all your home maintenance tasks in one place. Set priorities, due dates, and categories to keep everything organized.",
      animatedStyle: featureAnimatedStyles[0],
    },
    {
      icon: "time-outline",
      text: "Timeline View",
      description:
        "Visualize your maintenance schedule with our intuitive timeline. See upcoming tasks, track progress, and never miss important deadlines again.",
      animatedStyle: featureAnimatedStyles[1],
    },
    {
      icon: "trophy-outline",
      text: "Completion Tracking",
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
    tapScale.value = withSequence(
      withSpring(0.92, {
        damping: 15,
        stiffness: 300,
      }),
      withSpring(1, {
        damping: 20,
        stiffness: 200,
      })
    );

    // tapRotation function to trigger the rotation of the tap
    tapRotation.value = withSequence(
      withSpring(-2, { damping: 15 }),
      withSpring(0, { damping: 20 })
    );

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

  const tapAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: tapScale.value },
      { rotate: `${tapRotation.value}deg` },
    ],
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [
      { scale: modalScale.value },
      { translateY: modalTranslateY.value },
    ],
  }));

  return (
    <View style={styles.cardContainer}>
      {/* Feature Highlights */}
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleFeaturePress(index)}
            activeOpacity={0.9}
            style={styles.featureTouchable}
          >
            <Animated.View
              style={[
                styles.featureItem,
                { backgroundColor: colors.surface },
                feature.animatedStyle,
                tapAnimatedStyle,
              ]}
            >
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
              <Text style={[styles.featureText, { color: colors.text }]}>
                {feature.text}
              </Text>
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
              { backgroundColor: colors.surface },
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

            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeModal}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.closeButtonGradient}
              >
                <Text style={styles.closeButtonText}>Got it</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Action Buttons */}
      <ActionButtons />
    </View>
  );
}
