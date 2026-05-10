import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
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
import { useGradients, useHaptics } from "../../../hooks";
import { useProfile, AddressInput } from "../../../context/ProfileContext";
import { DesignSystem } from "../../../theme/designSystem";
import { GlassCard, SheetGrabber } from "../../ui";
import { styles } from "./styles";

const { height: screenHeight } = Dimensions.get("window");

interface HomeAddressOnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  /** When true, "Skip for now" is hidden — used from Settings where the user already has a value (or none) but is just editing. */
  hideSkip?: boolean;
}

interface FormState {
  address_line1: string;
  address_line2: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
}

const EMPTY_FORM: FormState = {
  address_line1: "",
  address_line2: "",
  city: "",
  region: "",
  postal_code: "",
  country: "",
};

function deriveDefaultCountry(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? "";
    const region = locale.split("-")[1];
    return region ? region.toUpperCase() : "";
  } catch {
    return "";
  }
}

export function HomeAddressOnboardingModal({
  visible,
  onClose,
  hideSkip = false,
}: HomeAddressOnboardingModalProps) {
  const { colors, isDark } = useTheme();
  const { haloGradient } = useGradients();
  const { triggerLight, triggerSuccess, triggerError } = useHaptics();
  const { profile, updateAddress, skipAddressOnboarding } = useProfile();

  const [mounted, setMounted] = useState(visible);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(screenHeight);

  // Pre-fill from existing profile when re-opening (Settings edit case).
  useEffect(() => {
    if (visible) {
      setForm({
        address_line1: profile?.address_line1 ?? "",
        address_line2: profile?.address_line2 ?? "",
        city: profile?.city ?? "",
        region: profile?.region ?? "",
        postal_code: profile?.postal_code ?? "",
        country: profile?.country ?? deriveDefaultCountry(),
      });
    }
  }, [visible, profile]);

  useEffect(() => {
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
  }, [visible, opacity, translateY]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const inputBackground = isDark
    ? "rgba(35, 37, 38, 0.55)"
    : "rgba(255, 255, 255, 0.65)";
  const inputBorder = isDark
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(15, 23, 42, 0.08)";

  const canSubmit = useMemo(
    () => form.city.trim().length > 0 || form.address_line1.trim().length > 0,
    [form.city, form.address_line1]
  );

  const handleClose = async () => {
    await triggerLight();
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    await triggerLight();
    setSaving(true);
    try {
      const payload: AddressInput = {
        address_line1: form.address_line1,
        address_line2: form.address_line2,
        city: form.city,
        region: form.region,
        postal_code: form.postal_code,
        country: form.country,
      };
      const result = await updateAddress(payload);
      if (result.success) {
        await triggerSuccess();
        if (!result.geocoded) {
          // Non-blocking — let the user know weather may be unavailable.
          Alert.alert(
            "Address saved",
            "We couldn't find an exact match for the city, so weather may be unavailable. You can edit your address anytime from Settings."
          );
        }
        onClose();
      } else {
        await triggerError();
        Alert.alert("Couldn't save", result.error ?? "Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (skipping) return;
    await triggerLight();
    setSkipping(true);
    try {
      await skipAddressOnboarding();
      onClose();
    } finally {
      setSkipping(false);
    }
  };

  const renderField = (
    label: string,
    field: keyof FormState,
    placeholder: string,
    extra?: { autoCapitalize?: "characters" | "words" | "none"; keyboardType?: "default" | "email-address" }
  ) => (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <TextInput
        value={form[field]}
        onChangeText={(text) =>
          setForm((prev) => ({ ...prev, [field]: text }))
        }
        placeholder={placeholder}
        placeholderTextColor={
          isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(15, 23, 42, 0.35)"
        }
        style={[
          styles.input,
          {
            backgroundColor: inputBackground,
            borderColor: inputBorder,
            color: colors.text,
          },
        ]}
        autoCapitalize={extra?.autoCapitalize ?? "words"}
        keyboardType={extra?.keyboardType ?? "default"}
        keyboardAppearance={isDark ? "dark" : "light"}
        returnKeyType="next"
      />
    </View>
  );

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
          style={[styles.sheetContainer, animatedSheetStyle]}
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

              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
              >
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
                    style={[styles.headerTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    Your home
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
                    ]}
                    onPress={handleClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <Ionicons name="close" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.intro}>
                    <View
                      style={[
                        styles.introIcon,
                        { backgroundColor: colors.primary + "15" },
                      ]}
                    >
                      <Ionicons
                        name="home-outline"
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.introCopy}>
                      <Text
                        style={[styles.introTitle, { color: colors.text }]}
                      >
                        Tell us about your home
                      </Text>
                      <Text
                        style={[
                          styles.introBody,
                          { color: colors.textSecondary },
                        ]}
                      >
                        We'll show your address on the dashboard and use the
                        city to display local weather. You can change this
                        anytime from Settings.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    {renderField(
                      "Address",
                      "address_line1",
                      "123 Main Street"
                    )}
                    {renderField(
                      "Apartment, suite, etc. (optional)",
                      "address_line2",
                      "Apt 4B"
                    )}
                    {renderField("City", "city", "City")}
                    <View style={styles.fieldRow}>
                      <View style={styles.fieldRowItem}>
                        {renderField(
                          "State / Region",
                          "region",
                          "State"
                        )}
                      </View>
                      <View style={styles.fieldRowItem}>
                        {renderField(
                          "Postal code",
                          "postal_code",
                          "Postal",
                          { autoCapitalize: "characters" }
                        )}
                      </View>
                    </View>
                    {renderField("Country", "country", "Country code (US, CA…)", {
                      autoCapitalize: "characters",
                    })}
                  </View>
                </ScrollView>

                <View
                  style={[
                    styles.actions,
                    {
                      borderTopColor: isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.06)",
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor: canSubmit
                          ? colors.primary
                          : colors.primary + "55",
                      },
                    ]}
                    onPress={handleSubmit}
                    disabled={!canSubmit || saving}
                    accessibilityRole="button"
                    accessibilityLabel="Save home address"
                  >
                    <Text style={styles.primaryButtonText}>
                      {saving ? "Saving…" : "Save"}
                    </Text>
                  </TouchableOpacity>

                  {hideSkip ? null : (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={handleSkip}
                      disabled={skipping}
                      accessibilityRole="button"
                      accessibilityLabel="Skip for now"
                    >
                      <Text
                        style={[
                          styles.secondaryButtonText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {skipping ? "Skipping…" : "Skip for now"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
