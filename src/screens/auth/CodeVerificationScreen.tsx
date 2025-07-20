import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Button, TextInput, Surface, Card } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogoSection } from "../../components/LogoSection/LogoSection";

export const CodeVerificationScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { supabase } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get("window");

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get email from route params (passed from signup)
  const params = route.params as any;
  const email = params?.email || "";

  // Animation values
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);

  React.useEffect(() => {
    formOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(200, withTiming(0, { duration: 600 }));
  }, []);

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const isLargeScreen = screenHeight > 900;
  const isMediumScreen = screenHeight > 800 && screenHeight <= 900;

  let dynamicTopSpacing;
  if (isLargeScreen) {
    dynamicTopSpacing = insets.top + 20;
  } else if (isMediumScreen) {
    dynamicTopSpacing = insets.top + 10;
  } else {
    dynamicTopSpacing = insets.top + 5;
  }

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Email Verified!",
          "Your account has been verified successfully. Welcome to HomeKeep!",
          [
            {
              text: "Continue",
              onPress: () => {},
            },
          ]
        );
      } else {
        throw new Error("Verification completed but no session created");
      }
    } catch (error: any) {
      console.error("Code verification error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      let errorMessage = "Invalid or expired code. Please try again.";
      if (error.message?.includes("expired")) {
        errorMessage =
          "This verification code has expired. Please request a new one.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleResendCode = async () => {
    if (!email) {
      Alert.alert(
        "Error",
        "Email address not found. Please go back and sign up again."
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: "homekeep://auth/verify",
        },
      });

      if (error) {
        throw error;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Code Sent",
        "A new verification code has been sent to your email."
      );
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Error",
        error.message || "Failed to resend code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const gradientColors = (
    isDark
      ? [colors.primary, colors.secondary]
      : [colors.primary, colors.secondary]
  ) as [string, string];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingTop: dynamicTopSpacing }]}>
        <LogoSection showText={false} compact={true} />

        <Animated.View style={formAnimatedStyle}>
          <Card
            style={[styles.formCard, { backgroundColor: colors.surface }]}
            elevation={2}
          >
            <Card.Content style={styles.formContent}>
              <View style={styles.headerContainer}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Verify Your Email
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  Enter the 6-digit code sent to
                </Text>
                <Text style={[styles.email, { color: colors.primary }]}>
                  {email}
                </Text>
              </View>

              <TextInput
                label="Verification Code"
                value={code}
                onChangeText={(text) => {
                  setCode(text.replace(/[^0-9]/g, "").substring(0, 6));
                  setError("");
                }}
                mode="outlined"
                style={styles.input}
                error={!!error}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="123456"
                autoComplete="one-time-code"
                left={<TextInput.Icon icon="lock-check" />}
                theme={{
                  colors: {
                    primary: colors.primary,
                    outline: error ? colors.error : colors.border,
                    surface: colors.surface,
                    background: colors.surface,
                    onSurface: colors.text,
                    onSurfaceVariant: colors.textSecondary,
                  },
                }}
              />

              {error ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
              ) : null}

              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradientButton, { marginTop: 24 }]}
              >
                <Button
                  mode="contained"
                  onPress={handleVerifyCode}
                  loading={loading}
                  disabled={loading || code.length !== 6}
                  style={styles.verifyButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={[
                    styles.buttonLabel,
                    { color: isDark ? colors.text : "white" },
                  ]}
                >
                  Verify & Sign In
                </Button>
              </LinearGradient>

              <TouchableOpacity
                onPress={handleResendCode}
                disabled={loading}
                style={styles.resendContainer}
              >
                <Text
                  style={[styles.resendText, { color: colors.textSecondary }]}
                >
                  Didn't receive a code?{" "}
                  <Text style={[styles.resendLink, { color: colors.primary }]}>
                    Send again
                  </Text>
                </Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </Animated.View>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={handleBackPress}
            style={[styles.backButton, { borderColor: colors.primary }]}
            disabled={loading}
            contentStyle={styles.buttonContent}
            labelStyle={[styles.outlineButtonLabel, { color: colors.primary }]}
          >
            Back
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "400",
    lineHeight: 20,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  formCard: {
    borderRadius: 16,
    marginBottom: 16,
  },
  formContent: {
    padding: 24,
  },
  input: {
    marginBottom: 8,
    backgroundColor: "transparent",
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 4,
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  gradientButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  verifyButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
    margin: 0,
  },
  buttonContainer: {
    marginTop: 16,
  },
  backButton: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  buttonContent: {
    paddingVertical: 8,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  outlineButtonLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  resendContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    textAlign: "center",
  },
  resendLink: {
    fontWeight: "600",
  },
});
