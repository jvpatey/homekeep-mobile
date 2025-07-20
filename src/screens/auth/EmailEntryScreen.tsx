import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Button, TextInput, Card } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogoSection } from "../../components/LogoSection/LogoSection";

export const EmailEntryScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(email);
  };

  const handleContinue = () => {
    if (!email) {
      setError("Email is required");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    (navigation as any).navigate("CodeVerification", { email });
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <LogoSection showText={false} compact={true} />

        <Card
          style={[styles.formCard, { backgroundColor: colors.surface }]}
          elevation={2}
        >
          <Card.Content style={styles.formContent}>
            <View style={styles.headerContainer}>
              <Text style={[styles.title, { color: colors.text }]}>
                Email Verification
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Enter your email address to verify your account
              </Text>
            </View>

            <TextInput
              label="Email Address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError("");
              }}
              mode="outlined"
              style={styles.input}
              error={!!error}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              left={<TextInput.Icon icon="email" />}
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
                onPress={handleContinue}
                style={styles.continueButton}
                contentStyle={styles.buttonContent}
                labelStyle={[
                  styles.buttonLabel,
                  { color: isDark ? colors.text : "white" },
                ]}
              >
                Continue
              </Button>
            </LinearGradient>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={handleBackPress}
            style={[styles.backButton, { borderColor: colors.primary }]}
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
  continueButton: {
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
});
