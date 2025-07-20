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

export const LoginScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { isConfigured, signIn } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get("window");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
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

  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
    };

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Sign In Error", error.message);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Welcome Back!", "You have successfully signed in.");
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
            Welcome Back
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to your account
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
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
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
                  autoComplete="password"
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
                onPress={handleSignIn}
                loading={loading}
                disabled={loading}
                style={styles.signInButton}
                contentStyle={styles.buttonContent}
                labelStyle={[
                  styles.buttonLabel,
                  { color: isDark ? colors.text : "white" },
                ]}
              >
                Sign In
              </Button>
            </LinearGradient>
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

          {/* Email Verification Link */}
          {isConfigured && (
            <View style={styles.verificationContainer}>
              <Button
                mode="text"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  (navigation as any).navigate("EmailEntry");
                }}
                disabled={loading}
                labelStyle={[
                  styles.verificationText,
                  { color: colors.textSecondary },
                ]}
              >
                Need to verify your email?
              </Button>
            </View>
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
  signInButton: {
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
  verificationContainer: {
    marginTop: 8,
    alignItems: "center",
  },
  verificationText: {
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
