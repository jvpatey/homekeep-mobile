import React, { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import {
  useFeatureAnimation,
  useHaptics,
  useDevice,
  useScalePress,
} from "../../../hooks";
import { styles } from "./styles";
import { ActionButtons, GlassCard } from "../../ui";
import { DesignSystem } from "../../../theme/designSystem";

interface FeatureRowProps {
  icon: string;
  text: string;
  subtitle: string;
  onPress: () => void;
  divider?: boolean;
}

/**
 * One row inside the grouped glass list (iOS Settings style).
 */
function FeatureRow({
  icon,
  text,
  subtitle,
  onPress,
  divider = false,
}: FeatureRowProps) {
  const { colors } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = useScalePress();

  return (
    <View style={{ width: "100%" }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={{ width: "100%" }}
      >
        <Animated.View style={[animatedStyle, { width: "100%" }]}>
          <View style={styles.row}>
            <View
              style={[
                styles.rowIcon,
                {
                  backgroundColor: colors.glassTint,
                  borderColor: colors.glassStroke,
                },
              ]}
            >
              <Ionicons name={icon as any} size={18} color={colors.primary} />
            </View>

            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                {text}
              </Text>
              <Text
                style={[styles.rowSubtitle, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textSecondary}
              style={styles.rowChevron}
            />
          </View>
        </Animated.View>
      </Pressable>

      {divider ? (
        <View style={[styles.divider, { backgroundColor: colors.glassStroke }]} />
      ) : null}
    </View>
  );
}

/**
 * FeaturesSection — 2026 redesign.
 *
 * - One grouped glass list (iOS Settings style), better space usage than
 *   three separate pill cards.
 * - Rows have leading icon chips, title/subtitle, trailing chevron, and
 *   hairline dividers aligned under the text.
 * - Press states use scale + spring instead of activeOpacity.
 */
export function FeaturesSection() {
  const { colors, isDark } = useTheme();
  const { entering: featuresEntering } = useFeatureAnimation(120);
  const { triggerLight } = useHaptics();
  const { isTablet, getMaxContentWidth, getFontMultiplier, getResponsiveValue } =
    useDevice();
  const {
    animatedStyle: closeAnimatedStyle,
    onPressIn,
    onPressOut,
  } = useScalePress();

  const maxContentWidth = getMaxContentWidth();
  const fontMultiplier = getFontMultiplier();

  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Modal entrance animation values — snappy spring per iOS 26 patterns.
  const modalScale = useSharedValue(0.96);
  const modalOpacity = useSharedValue(0);

  const features = [
    {
      icon: "list-outline",
      text: "Organize",
      subtitle: "Manage all tasks in one place",
      description:
        "Create, organize, and manage all your home maintenance tasks in one place. Set priorities, due dates, and categories to keep everything organized.",
    },
    {
      icon: "time-outline",
      text: "Schedule",
      subtitle: "Never miss important maintenance",
      description:
        "Never forget when to clean your gutters, change filters, or service your HVAC again. Get automatic reminders for all your home maintenance needs.",
    },
    {
      icon: "trophy-outline",
      text: "Track",
      subtitle: "See your maintenance progress",
      description:
        "Celebrate your achievements and track your home maintenance progress. Build a complete history of completed tasks and maintenance milestones.",
    },
  ];

  const handleFeaturePress = (index: number) => {
    setSelectedFeature(index);
    setIsModalVisible(true);
    triggerLight();

    modalScale.value = withSpring(1, DesignSystem.motion.spring.snappy);
    modalOpacity.value = withTiming(1, {
      duration: DesignSystem.motion.duration.fast,
      easing: Easing.out(Easing.quad),
    });
  };

  const closeModal = () => {
    modalOpacity.value = withTiming(0, {
      duration: DesignSystem.motion.duration.instant,
      easing: Easing.in(Easing.quad),
    });
    modalScale.value = withTiming(0.96, {
      duration: DesignSystem.motion.duration.instant,
    });

    setTimeout(() => {
      setIsModalVisible(false);
      setSelectedFeature(null);
    }, DesignSystem.motion.duration.instant);
  };

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  return (
    <View
      style={[
        styles.cardContainer,
        maxContentWidth && {
          maxWidth: maxContentWidth,
          alignSelf: "center",
          width: "100%",
        },
        isTablet && {
          paddingTop: getResponsiveValue(
            0,
            DesignSystem.spacing.lg,
            DesignSystem.spacing.xl,
          ),
        },
      ]}
    >
      {/* Feature Highlights — animate as one group */}
      <Animated.View
        style={[
          styles.featuresContainer,
          isTablet && {
            marginBottom: getResponsiveValue(
              DesignSystem.spacing.xxl,
              DesignSystem.spacing.xxl,
              DesignSystem.spacing.xxl + DesignSystem.spacing.md,
            ),
          },
        ]}
        entering={featuresEntering}
      >
        <GlassCard style={styles.groupedCard}>
          {features.map((feature, index) => (
            <FeatureRow
              key={index}
              icon={feature.icon}
              text={feature.text}
              subtitle={feature.subtitle}
              onPress={() => handleFeaturePress(index)}
              divider={index !== features.length - 1}
            />
          ))}
        </GlassCard>
      </Animated.View>

      {/* Feature Detail Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Animated.View
            style={[
              {
                width: "100%",
                maxWidth: isTablet ? getResponsiveValue(320, 450, 550) : 320,
              },
              modalAnimatedStyle,
            ]}
          >
            <GlassCard
              material="chrome"
              style={styles.modalContent}
            >
              {selectedFeature !== null && (
                <>
                  <View
                    style={[
                      styles.modalGrabber,
                      {
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.22)"
                          : "rgba(0, 0, 0, 0.14)",
                      },
                    ]}
                  />

                  <View style={styles.modalHeader}>
                    <View
                      style={[
                        styles.modalIcon,
                        {
                          backgroundColor: colors.glassTint,
                          borderColor: colors.glassStroke,
                        },
                      ]}
                    >
                      <Ionicons
                        name={features[selectedFeature].icon as any}
                        size={20}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.modalHeaderText}>
                      <Text
                        style={[
                          styles.modalTitle,
                          { color: colors.text },
                          isTablet && {
                            fontSize: styles.modalTitle.fontSize * fontMultiplier,
                            lineHeight:
                              styles.modalTitle.lineHeight * fontMultiplier,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {features[selectedFeature].text}
                      </Text>
                      <Text
                        style={[
                          styles.modalSubtitle,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {features[selectedFeature].subtitle}
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {selectedFeature !== null && (
                <Text
                  style={[
                    styles.modalDescription,
                    { color: colors.textSecondary },
                    isTablet && {
                      fontSize:
                        styles.modalDescription.fontSize * fontMultiplier,
                      lineHeight:
                        (styles.modalDescription.lineHeight ||
                          styles.modalDescription.fontSize * 1.4) *
                        fontMultiplier,
                    },
                  ]}
                >
                  {features[selectedFeature].description}
                </Text>
              )}

              <Pressable
                onPress={closeModal}
                style={[
                  styles.modalCloseIconHit,
                  {
                    backgroundColor: colors.glassTint,
                    borderColor: colors.glassStroke,
                    borderWidth: DesignSystem.borders.hairline,
                  },
                ]}
                hitSlop={10}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>

              <Pressable
                onPress={closeModal}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={{ width: "100%" }}
              >
                <Animated.View
                  style={[
                    styles.closeButton,
                    {
                      backgroundColor: colors.primary,
                    },
                    closeAnimatedStyle,
                  ]}
                >
                  <Text style={[styles.closeButtonText, { color: "white" }]}>
                    Got it
                  </Text>
                </Animated.View>
              </Pressable>
            </GlassCard>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Action Buttons */}
      <ActionButtons />
    </View>
  );
}
