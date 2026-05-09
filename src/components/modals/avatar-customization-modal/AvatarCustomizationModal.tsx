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
  runOnJS,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useGradients, useHaptics, useDevice } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import {
  useUserPreferences,
  GradientPreset,
} from "../../../context/UserPreferencesContext";
import { GlassCard, GradientPicker, SheetGrabber, TintedGlassAvatar } from "../../ui";
import { PopupPrimaryButton } from "../../Dashboard/popups/PopupPrimaryButton";
import { styles } from "./styles";

const { height: screenHeight } = Dimensions.get("window");

interface AvatarCustomizationModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AvatarCustomizationModal({
  visible,
  onClose,
}: AvatarCustomizationModalProps) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { selectedGradient, loading: preferencesLoading } =
    useUserPreferences();
  const { haloGradient } = useGradients();
  const { triggerLight } = useHaptics();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const fontMultiplier = getFontMultiplier();

  const [previewGradient, setPreviewGradient] =
    useState<GradientPreset>(selectedGradient);
  const [mounted, setMounted] = useState(visible);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(screenHeight);

  React.useEffect(() => {
    if (visible) {
      setMounted(true);
      opacity.value = withTiming(1, {
        duration: DesignSystem.motion.duration.fast,
        easing: DesignSystem.motion.easing.standard,
      });
      translateY.value = withSpring(0, DesignSystem.motion.spring.snappy);
    } else {
      opacity.value = withTiming(0, {
        duration: DesignSystem.motion.duration.fast,
        easing: DesignSystem.motion.easing.standard,
      });
      translateY.value = withTiming(
        screenHeight,
        {
          duration: DesignSystem.motion.duration.fast,
          easing: DesignSystem.motion.easing.standard,
        },
        (finished) => {
          if (finished) runOnJS(setMounted)(false);
        }
      );
    }
  }, [visible]);

  React.useEffect(() => {
    if (!preferencesLoading && selectedGradient) {
      setPreviewGradient(selectedGradient);
    }
  }, [selectedGradient, preferencesLoading]);

  const getUserInitial = () => {
    const fullName = user?.user_metadata?.full_name;
    if (fullName) return fullName.split(" ")[0].charAt(0).toUpperCase();
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleClose = async () => {
    await triggerLight();
    onClose();
  };

  const handleGradientPreview = async (gradient: GradientPreset) => {
    setPreviewGradient(gradient);
    await triggerLight();
  };

  const previewSize = isTablet ? getResponsiveValue(108, 128, 148) : 96;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <Pressable
          style={styles.backdropPressable}
          onPress={handleClose}
          accessibilityLabel="Dismiss"
        />
        <Animated.View
          style={[
            styles.sheetContainer,
            isTablet && {
              maxWidth: getResponsiveValue(500, 640, 720),
              alignSelf: "center",
              width: "100%",
            },
            animatedSheetStyle,
          ]}
          pointerEvents="auto"
        >
          <GlassCard
            material="thick"
            radius={DesignSystem.borders.radius.glass}
            containerStyle={styles.glassOuter}
            style={styles.glassInner}
          >
            <LinearGradient
              colors={[...haloGradient]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.haloFill}
              pointerEvents="none"
            />

            <SafeAreaView edges={["bottom"]} style={styles.sheetSafeArea}>
              <SheetGrabber />

              {/* Header */}
              <View
                style={[
                  styles.header,
                  {
                    borderBottomColor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.08)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.headerTitle,
                    { color: colors.text },
                    isTablet && {
                      fontSize:
                        (styles.headerTitle.fontSize || 20) * fontMultiplier,
                      lineHeight:
                        (styles.headerTitle.fontSize || 20) *
                        fontMultiplier *
                        1.2,
                    },
                  ]}
                >
                  Customize Avatar
                </Text>
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    {
                      backgroundColor: isDark
                        ? "rgba(35, 37, 38, 0.55)"
                        : "rgba(255, 255, 255, 0.45)",
                      borderWidth: DesignSystem.borders.hairline,
                      borderColor: colors.glassStroke,
                    },
                    isTablet && {
                      width: getResponsiveValue(36, 44, 48),
                      height: getResponsiveValue(36, 44, 48),
                      borderRadius: getResponsiveValue(18, 22, 24),
                    },
                  ]}
                  onPress={handleClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons
                    name="close"
                    size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              {/* Scrollable body */}
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator
              >
                <View
                  style={[
                    styles.previewSection,
                    isTablet && {
                      paddingHorizontal: getResponsiveValue(20, 28, 32),
                      paddingVertical: getResponsiveValue(20, 28, 32),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.previewLabel,
                      { color: colors.textSecondary },
                      isTablet && {
                        fontSize:
                          (styles.previewLabel.fontSize || 13) * fontMultiplier,
                      },
                    ]}
                  >
                    Preview
                  </Text>

                  <View style={styles.previewContainer}>
                    <TintedGlassAvatar
                      size={previewSize}
                      gradient={previewGradient}
                      initial={getUserInitial()}
                      pressable={false}
                    />

                    <View style={styles.previewInfo}>
                      <Text
                        style={[
                          styles.previewGradientName,
                          { color: colors.text },
                          isTablet && {
                            fontSize:
                              (styles.previewGradientName.fontSize || 18) *
                              fontMultiplier,
                            lineHeight:
                              (styles.previewGradientName.fontSize || 18) *
                              fontMultiplier *
                              1.2,
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
                            fontSize:
                              (styles.previewDescription.fontSize || 14) *
                              fontMultiplier,
                            lineHeight:
                              (styles.previewDescription.fontSize || 14) *
                              fontMultiplier *
                              1.4,
                          },
                        ]}
                      >
                        This gradient is used for your avatar across the app.
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.pickerWrap,
                    isTablet && {
                      paddingHorizontal: getResponsiveValue(20, 28, 32),
                      paddingBottom: getResponsiveValue(16, 24, 32),
                    },
                  ]}
                >
                  <GradientPicker
                    onGradientSelect={handleGradientPreview}
                    showLabels={false}
                  />
                </View>
              </ScrollView>

              {/* Footer */}
              <View
                style={[
                  styles.footerActions,
                  {
                    borderTopColor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.08)",
                  },
                  isTablet && {
                    paddingHorizontal: getResponsiveValue(20, 28, 32),
                    paddingTop: getResponsiveValue(14, 18, 22),
                    paddingBottom: getResponsiveValue(14, 20, 26),
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
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: colors.textSecondary },
                      isTablet && {
                        fontSize:
                          (styles.cancelButtonText.fontSize || 16) *
                          fontMultiplier,
                      },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <View style={styles.saveButtonWrap}>
                  <PopupPrimaryButton
                    label="Save Changes"
                    onPress={handleClose}
                    tone="primary"
                  />
                </View>
              </View>
            </SafeAreaView>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
