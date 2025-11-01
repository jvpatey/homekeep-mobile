import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useHaptics, useDevice } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import {
  useUserPreferences,
  GradientPreset,
} from "../../../context/UserPreferencesContext";
import { GradientPicker } from "../../ui";
import { styles } from "./styles";

const { height: screenHeight } = Dimensions.get("window");

// AvatarCustomizationModalProps interface for the AvatarCustomizationModal component
interface AvatarCustomizationModalProps {
  visible: boolean;
  onClose: () => void;
}

// AvatarCustomizationModal component for the AvatarCustomizationModal
export function AvatarCustomizationModal({
  visible,
  onClose,
}: AvatarCustomizationModalProps) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { selectedGradient, loading: preferencesLoading } =
    useUserPreferences();
  const { triggerLight, triggerMedium } = useHaptics();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const fontMultiplier = getFontMultiplier();

  const [previewGradient, setPreviewGradient] =
    useState<GradientPreset>(selectedGradient);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  // useEffect hook to animate the modal
  React.useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withTiming(0, { duration: 250 });
      opacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible]);

  // Update preview gradient when selectedGradient changes and loading is complete
  React.useEffect(() => {
    if (!preferencesLoading && selectedGradient) {
      setPreviewGradient(selectedGradient);
    }
  }, [selectedGradient, preferencesLoading]);

  // getUserInitial function to get the user's initial from Supabase
  const getUserInitial = () => {
    const fullName = user?.user_metadata?.full_name;
    if (fullName) {
      return fullName.split(" ")[0].charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  // animatedBackdropStyle function to animate the backdrop
  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // animatedModalStyle function to animate the modal
  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scale.value, [0, 1], [0.9, 1]) }],
    opacity: opacity.value,
  }));

  // handleClose function to handle the close of the modal
  const handleClose = async () => {
    await triggerLight();
    onClose();
  };

  // handleGradientPreview function to handle the preview of the gradient
  const handleGradientPreview = async (gradient: GradientPreset) => {
    setPreviewGradient(gradient);
    await triggerLight();
  };

  // handleBackdropPress function to handle the press of the backdrop
  const handleBackdropPress = () => {
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <Pressable
          style={styles.backdropPressable}
          onPress={handleBackdropPress}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: isDark
                  ? "rgba(35, 37, 38, 0.85)"
                  : "rgba(255, 255, 255, 0.85)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.25)"
                  : "rgba(255, 255, 255, 0.9)",
              },
              isTablet && {
                maxWidth: getResponsiveValue(420, 600, 700),
              },
              animatedModalStyle,
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.08)",
                },
              ]}
            >
              <View style={[
                styles.headerContent,
                isTablet && {
                  paddingTop: getResponsiveValue(20, 28, 32),
                  paddingHorizontal: getResponsiveValue(20, 28, 32),
                  paddingBottom: getResponsiveValue(16, 20, 24),
                },
              ]}>
                <Text style={[
                  styles.headerTitle, 
                  { color: colors.text },
                  isTablet && {
                    fontSize: ((styles.headerTitle.fontSize || 22) * fontMultiplier),
                    lineHeight: ((styles.headerTitle.fontSize || 22) * fontMultiplier) * 1.2,
                  },
                ]}>
                  Customize Avatar
                </Text>
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    { backgroundColor: colors.background },
                    isTablet && {
                      width: getResponsiveValue(36, 44, 48),
                      height: getResponsiveValue(36, 44, 48),
                      borderRadius: getResponsiveValue(18, 22, 24),
                    },
                  ]}
                  onPress={handleClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="close"
                    size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Preview Section */}
            <View style={[
              styles.previewSection,
              isTablet && {
                paddingHorizontal: getResponsiveValue(20, 28, 32),
                paddingVertical: getResponsiveValue(24, 32, 36),
              },
            ]}>
              <Text
                style={[
                  styles.previewLabel, 
                  { color: colors.textSecondary },
                  isTablet && {
                    fontSize: ((styles.previewLabel.fontSize || 14) * fontMultiplier),
                  },
                ]}
              >
                Preview
              </Text>
              <View style={styles.previewContainer}>
                <LinearGradient
                  colors={previewGradient.colors}
                  style={[
                    styles.previewAvatar,
                    isTablet && {
                      width: getResponsiveValue(100, 120, 140),
                      height: getResponsiveValue(100, 120, 140),
                      borderRadius: getResponsiveValue(50, 60, 70),
                      marginBottom: getResponsiveValue(16, 20, 24),
                    },
                  ]}
                  start={previewGradient.start}
                  end={previewGradient.end}
                >
                  <Text style={[
                    styles.previewInitial,
                    isTablet && {
                      fontSize: getResponsiveValue(36, 44, 52),
                    },
                  ]}>{getUserInitial()}</Text>
                </LinearGradient>
                <View style={styles.previewInfo}>
                  <Text
                    style={[
                      styles.previewGradientName, 
                      { color: colors.text },
                      isTablet && {
                        fontSize: ((styles.previewGradientName.fontSize || 18) * fontMultiplier),
                        lineHeight: ((styles.previewGradientName.fontSize || 18) * fontMultiplier) * 1.2,
                      },
                    ]}
                  >
                    {previewGradient.name}
                  </Text>
                  <Text
                    style={[
                      styles.previewDescription,
                      { color: colors.textSecondary },
                      isTablet && {
                        fontSize: ((styles.previewDescription.fontSize || 14) * fontMultiplier),
                        lineHeight: ((styles.previewDescription.fontSize || 14) * fontMultiplier) * 1.4,
                      },
                    ]}
                  >
                    This gradient will be used for your avatar across the app
                  </Text>
                </View>
              </View>
            </View>

            {/* Gradient Picker */}
            <ScrollView
              style={styles.pickerScrollView}
              showsVerticalScrollIndicator={false}
            >
              <GradientPicker
                onGradientSelect={handleGradientPreview}
                showLabels={false}
              />
            </ScrollView>

            {/* Footer Actions */}
            <View
              style={[
                styles.footerActions,
                {
                  borderTopWidth: 1,
                  borderTopColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.08)",
                },
                isTablet && {
                  paddingHorizontal: getResponsiveValue(20, 28, 32),
                  paddingVertical: getResponsiveValue(20, 28, 32),
                  paddingBottom: getResponsiveValue(32, 40, 48),
                  gap: getResponsiveValue(12, 16, 20),
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.cancelButton, 
                  { borderColor: colors.border },
                  isTablet && {
                    height: getResponsiveValue(52, 60, 64),
                    borderRadius: getResponsiveValue(16, 20, 24),
                  },
                ]}
                onPress={handleClose}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: colors.textSecondary },
                    isTablet && {
                      fontSize: ((styles.cancelButtonText.fontSize || 16) * fontMultiplier),
                    },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isTablet && {
                    height: getResponsiveValue(52, 60, 64),
                    borderRadius: getResponsiveValue(16, 20, 24),
                  },
                ]}
                onPress={async () => {
                  await triggerMedium();
                  handleClose();
                }}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[
                    styles.saveButtonText,
                    isTablet && {
                      fontSize: ((styles.saveButtonText.fontSize || 16) * fontMultiplier),
                    },
                  ]}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}
