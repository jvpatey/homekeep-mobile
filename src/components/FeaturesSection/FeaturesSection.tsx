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
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useFeatureAnimation, useGradients } from "../../hooks";
import { styles } from "./styles";
import { ActionButtons } from "../ActionButtons/ActionButtons";
import { DesignSystem } from "../../theme/designSystem";

/**
 * FeaturesSection - Displays key app features with animated icons and descriptions
 * Features staggered animations for each feature item and gradient icon backgrounds
 * Now includes interactive tap effects with descriptive blurbs
 */
export function FeaturesSection() {
  const { colors } = useTheme();
  const { iconGradient } = useGradients();
  const featureAnimatedStyles = useFeatureAnimation(3, 600);

  // State for modal
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Animation values for tap effect
  const tapScale = useSharedValue(1);

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

    // Add tap animation
    tapScale.value = withSequence(
      withSpring(0.95, { duration: 100 }),
      withSpring(1, { duration: 100 })
    );
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedFeature(null);
  };

  const tapAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tapScale.value }],
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
                  color="#2E6B5A"
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
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
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
                    color="#2E6B5A"
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
          </Pressable>
        </Pressable>
      </Modal>

      {/* Action Buttons */}
      <ActionButtons />
    </View>
  );
}
