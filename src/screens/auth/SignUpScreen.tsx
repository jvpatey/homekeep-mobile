import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import {
  Button,
  TextInput,
  HelperText,
  Surface,
  Card,
  ProgressBar,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientDivider } from "../../components/GradientDivider/GradientDivider";
import { LogoSection } from "../../components/LogoSection/LogoSection";
import { OAuthButtons } from "../../components/OAuthButtons/OAuthButtons";

export const SignUpScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { isConfigured, signUp } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get("window");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(20);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);

  const isLargeScreen = screenHeight > 900;
  const isMediumScreen = screenHeight > 800 && screenHeight <= 900;

  let dynamicTopSpacing, dynamicBottomSpacing;

  if (isLargeScreen) {
    dynamicTopSpacing = insets.top + 20;
    dynamicBottomSpacing = 40;
  } else if (isMediumScreen) {
    dynamicTopSpacing = insets.top + 10;
    dynamicBottomSpacing = 20;
  } else {
    dynamicTopSpacing = insets.top + 5;
    dynamicBottomSpacing = 16;
  }

  useEffect(() => {
    // Staggered animations
    headerOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    headerTranslateY.value = withDelay(200, withTiming(0, { duration: 600 }));

    formOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(400, withTiming(0, { duration: 600 }));

    buttonOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    buttonTranslateY.value = withDelay(600, withTiming(0, { duration: 600 }));
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  // Calculate form completion progress
  const getFormProgress = () => {
    const fields = [fullName, email, password, confirmPassword];
    const filledFields = fields.filter((field) => field.trim() !== "").length;
    return filledFields / fields.length;
  };

  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    };

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    // Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case "fullName":
        if (!value.trim()) {
          newErrors.fullName = "Full name is required";
        } else if (value.trim().length < 2) {
          newErrors.fullName = "Full name must be at least 2 characters";
        } else {
          newErrors.fullName = "";
        }
        break;
      case "email":
        if (!value) {
          newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = "Please enter a valid email";
        } else {
          newErrors.email = "";
        }
        break;
      case "password":
        if (!value) {
          newErrors.password = "Password is required";
        } else if (value.length < 6) {
          newErrors.password = "Password must be at least 6 characters";
        } else {
          newErrors.password = "";
        }
        // Re-validate confirm password if it exists
        if (confirmPassword) {
          if (value !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
          } else {
            newErrors.confirmPassword = "";
          }
        }
        break;
      case "confirmPassword":
        if (!value) {
          newErrors.confirmPassword = "Please confirm your password";
        } else if (password !== value) {
          newErrors.confirmPassword = "Passwords do not match";
        } else {
          newErrors.confirmPassword = "";
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleSignUp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await signUp(email, password, fullName);

      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Sign Up Error", error.message);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Account Created!",
          "Please check your email to verify your account. You can click the verification link for automatic sign-in, or use the 6-digit code manually in the app.",
          [
            {
              text: "Enter Code Manually",
              style: "default",
              onPress: () =>
                (navigation as any).navigate("CodeVerification", { email }),
            },
            {
              text: "OK",
              style: "default",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const gradientColors = (
    isDark
      ? [colors.primary, colors.secondary]
      : [colors.primary, colors.secondary]
  ) as [string, string];

  const formProgress = getFormProgress();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: dynamicTopSpacing,
        paddingBottom: dynamicBottomSpacing,
        flexGrow: 1,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Logo Section */}
        <LogoSection showText={false} compact={true} />

        {/* Header */}
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join HomeKeep today
          </Text>
        </Animated.View>

        <GradientDivider />

        {!isConfigured ? (
          <Animated.View style={[formAnimatedStyle]}>
            <Card
              style={[styles.configCard, { backgroundColor: colors.surface }]}
            >
              <Card.Content style={styles.configContent}>
                <Text style={[styles.configTitle, { color: colors.primary }]}>
                  Supabase Setup Required
                </Text>
                <Text
                  style={[styles.configText, { color: colors.textSecondary }]}
                >
                  To enable authentication, you need to configure your Supabase
                  credentials.
                  {"\n\n"}Check the SUPABASE_SETUP.md file in your project root
                  for setup instructions.
                </Text>
              </Card.Content>
            </Card>
          </Animated.View>
        ) : (
          <Animated.View style={[formAnimatedStyle]}>
            <Card
              style={[styles.formCard, { backgroundColor: colors.surface }]}
              elevation={2}
            >
              <Card.Content style={styles.formContent}>
                {/* Progress indicator */}
                <View style={styles.progressContainer}>
                  <Text
                    style={[
                      styles.progressLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Profile completion: {Math.round(formProgress * 100)}%
                  </Text>
                  <ProgressBar
                    progress={formProgress}
                    color={colors.primary}
                    style={styles.progressBar}
                  />
                </View>

                <TextInput
                  label="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  onBlur={() => validateField("fullName", fullName)}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors.fullName}
                  autoCapitalize="words"
                  autoComplete="name"
                  left={<TextInput.Icon icon="account" />}
                  theme={{
                    colors: {
                      primary: colors.primary,
                      outline: errors.fullName ? colors.error : colors.border,
                      surface: colors.surface,
                      background: colors.surface,
                      onSurface: colors.text,
                      onSurfaceVariant: colors.textSecondary,
                    },
                  }}
                />
                <HelperText
                  type="error"
                  visible={!!errors.fullName}
                  style={styles.helperText}
                >
                  {errors.fullName}
                </HelperText>

                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => validateField("email", email)}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  left={<TextInput.Icon icon="email" />}
                  theme={{
                    colors: {
                      primary: colors.primary,
                      outline: errors.email ? colors.error : colors.border,
                      surface: colors.surface,
                      background: colors.surface,
                      onSurface: colors.text,
                      onSurfaceVariant: colors.textSecondary,
                    },
                  }}
                />
                <HelperText
                  type="error"
                  visible={!!errors.email}
                  style={styles.helperText}
                >
                  {errors.email}
                </HelperText>

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => validateField("password", password)}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors.password}
                  secureTextEntry={!showPassword}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowPassword(!showPassword);
                      }}
                    />
                  }
                  autoComplete="new-password"
                  theme={{
                    colors: {
                      primary: colors.primary,
                      outline: errors.password ? colors.error : colors.border,
                      surface: colors.surface,
                      background: colors.surface,
                      onSurface: colors.text,
                      onSurfaceVariant: colors.textSecondary,
                    },
                  }}
                />
                <HelperText
                  type="error"
                  visible={!!errors.password}
                  style={styles.helperText}
                >
                  {errors.password}
                </HelperText>

                <TextInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onBlur={() =>
                    validateField("confirmPassword", confirmPassword)
                  }
                  mode="outlined"
                  style={styles.input}
                  error={!!errors.confirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  left={<TextInput.Icon icon="lock-check" />}
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? "eye-off" : "eye"}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowConfirmPassword(!showConfirmPassword);
                      }}
                    />
                  }
                  autoComplete="new-password"
                  theme={{
                    colors: {
                      primary: colors.primary,
                      outline: errors.confirmPassword
                        ? colors.error
                        : colors.border,
                      surface: colors.surface,
                      background: colors.surface,
                      onSurface: colors.text,
                      onSurfaceVariant: colors.textSecondary,
                    },
                  }}
                />
                <HelperText
                  type="error"
                  visible={!!errors.confirmPassword}
                  style={styles.helperText}
                >
                  {errors.confirmPassword}
                </HelperText>
              </Card.Content>
            </Card>
          </Animated.View>
        )}

        {/* Buttons */}
        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          {isConfigured && (
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <Button
                mode="contained"
                onPress={handleSignUp}
                loading={loading}
                disabled={loading}
                style={styles.signUpButton}
                contentStyle={styles.buttonContent}
                labelStyle={[
                  styles.buttonLabel,
                  { color: isDark ? colors.text : "white" },
                ]}
              >
                Create Account
              </Button>
            </LinearGradient>
          )}

          {/* OAuth Buttons */}
          {isConfigured && (
            <OAuthButtons
              disabled={loading}
              onSuccess={() => {
                // User will be automatically navigated by AuthContext
              }}
            />
          )}

          <Button
            mode="outlined"
            onPress={handleBackPress}
            style={[styles.backButton, { borderColor: colors.primary }]}
            disabled={loading}
            contentStyle={styles.buttonContent}
            labelStyle={[styles.outlineButtonLabel, { color: colors.primary }]}
          >
            Back to Home
          </Button>

          {isConfigured && (
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              By creating an account, you agree to our Terms of Service
            </Text>
          )}
        </Animated.View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerContainer: {
    marginVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    fontWeight: "400",
    lineHeight: 20,
  },
  configCard: {
    borderRadius: 16,
    marginBottom: 20,
  },
  configContent: {
    padding: 20,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  configText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  formCard: {
    borderRadius: 16,
    marginBottom: 16,
  },
  formContent: {
    padding: 16,
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    textAlign: "center",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  input: {
    marginBottom: 0,
    backgroundColor: "transparent",
  },
  helperText: {
    marginBottom: 2,
    fontSize: 13,
  },
  buttonContainer: {
    gap: 12,
  },
  gradientButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  signUpButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
    margin: 0,
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
  footerText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 8,
  },
});
