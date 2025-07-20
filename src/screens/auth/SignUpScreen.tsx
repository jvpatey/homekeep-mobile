import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientDivider } from "../../components/GradientDivider/GradientDivider";

export const SignUpScreen: React.FC = () => {
  const { colors } = useTheme();
  const { isConfigured } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Create Account
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Join HomeKeep today
        </Text>
        <GradientDivider />

        {/* Configuration status */}
        {!isConfigured ? (
          <View style={styles.configMessage}>
            <Text style={[styles.configTitle, { color: colors.primary }]}>
              Supabase Setup Required
            </Text>
            <Text style={[styles.configText, { color: colors.textSecondary }]}>
              To enable authentication, you need to configure your Supabase
              credentials.
              {"\n\n"}Check the supabase-config.md file in your project root for
              setup instructions.
            </Text>
          </View>
        ) : (
          <View style={styles.placeholderForm}>
            <Text
              style={[styles.placeholderText, { color: colors.textSecondary }]}
            >
              Sign up form will be implemented here
            </Text>
          </View>
        )}

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Back to Home
        </Button>
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
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 48,
  },
  configMessage: {
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 48,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  configText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  placeholderForm: {
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 48,
  },
  placeholderText: {
    fontSize: 16,
    fontStyle: "italic",
  },
  backButton: {
    marginTop: 16,
  },
});
