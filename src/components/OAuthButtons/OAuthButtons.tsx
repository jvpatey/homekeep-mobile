import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Button, ActivityIndicator } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { styles } from "./styles";

interface OAuthButtonsProps {
  onSuccess?: () => void;
  disabled?: boolean;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  onSuccess,
  disabled = false,
}) => {
  const { colors, isDark } = useTheme();
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (disabled) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const { data, error } = await signInWithGoogle();

      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          "Sign In Error",
          error.message || "Failed to sign in with Google"
        );
      } else if (data?.session) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess?.();
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const gradientColors = (
    isDark
      ? [colors.primary, colors.accent]
      : [colors.primary, colors.accent]
  ) as [string, string];

  return (
    <View style={styles.container}>
      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View
          style={[styles.dividerLine, { backgroundColor: colors.border }]}
        />
        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
          or
        </Text>
        <View
          style={[styles.dividerLine, { backgroundColor: colors.border }]}
        />
      </View>

      {/* Google Sign In Button */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientButton}
      >
        <Button
          mode="contained"
          onPress={handleGoogleSignIn}
          loading={loading}
          disabled={disabled || loading}
          style={styles.googleButton}
          contentStyle={styles.buttonContent}
          labelStyle={[
            styles.buttonLabel,
            { color: isDark ? colors.text : "white" },
          ]}
          icon={() => (
            <View style={styles.googleIconContainer}>
              {loading ? (
                <ActivityIndicator size={16} color="white" />
              ) : (
                <AntDesign name="google" size={16} color="white" />
              )}
            </View>
          )}
        >
          {loading ? "Signing in..." : "Continue with Google"}
        </Button>
      </LinearGradient>
    </View>
  );
};
