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
import { useHaptics } from "../../../hooks";
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
  const { selectedGradient } = useUserPreferences();
  const { triggerLight, triggerMedium } = useHaptics();

  const [previewGradient, setPreviewGradient] =
    useState<GradientPreset>(selectedGradient);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(screenHeight);

  // useEffect hook to animate the modal
  React.useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 120 });
    } else {
      scale.value = withTiming(0, { duration: 250 });
      opacity.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(screenHeight, { duration: 250 });
    }
  }, [visible]);

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
    transform: [
      { scale: interpolate(scale.value, [0, 1], [0.8, 1]) },
      { translateY: translateY.value },
    ],
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
              { backgroundColor: colors.surface },
              animatedModalStyle,
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Customize Avatar
                </Text>
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    { backgroundColor: colors.background },
                  ]}
                  onPress={handleClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Preview Section */}
            <View style={styles.previewSection}>
              <Text
                style={[styles.previewLabel, { color: colors.textSecondary }]}
              >
                Preview
              </Text>
              <View style={styles.previewContainer}>
                <LinearGradient
                  colors={previewGradient.colors}
                  style={styles.previewAvatar}
                  start={previewGradient.start}
                  end={previewGradient.end}
                >
                  <Text style={styles.previewInitial}>{getUserInitial()}</Text>
                </LinearGradient>
                <View style={styles.previewInfo}>
                  <Text
                    style={[styles.previewGradientName, { color: colors.text }]}
                  >
                    {previewGradient.name}
                  </Text>
                  <Text
                    style={[
                      styles.previewDescription,
                      { color: colors.textSecondary },
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
            <View style={styles.footerActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={handleClose}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
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
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}
