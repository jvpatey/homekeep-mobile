import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { Button, TextInput, HelperText } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientDivider } from "../../components/GradientDivider/GradientDivider";

export const LoginScreen: React.FC = () => {
  const { colors } = useTheme();
  const { isConfigured, signIn } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

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
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        Alert.alert("Sign In Error", error.message);
      } else {
        // Success - user will be automatically redirected by the auth state change
        Alert.alert("Welcome Back!", "You have successfully signed in.");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 20,
      }}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in to your account
        </Text>
        <GradientDivider />

        {!isConfigured ? (
          <View style={styles.configMessage}>
            <Text style={[styles.configTitle, { color: colors.primary }]}>
              Supabase Setup Required
            </Text>
            <Text style={[styles.configText, { color: colors.textSecondary }]}>
              To enable authentication, you need to configure your Supabase
              credentials.
              {"\n\n"}Check the SUPABASE_SETUP.md file in your project root for
              setup instructions.
            </Text>
          </View>
        ) : (
          <View style={styles.form}>
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
            />
            <HelperText type="error" visible={!!errors.email}>
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
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              autoComplete="password"
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleSignIn}
              loading={loading}
              disabled={loading}
              style={styles.signInButton}
            >
              Sign In
            </Button>
          </View>
        )}

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          disabled={loading}
        >
          Back to Home
        </Button>
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
  form: {
    marginBottom: 48,
  },
  input: {
    marginBottom: 8,
  },
  signInButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
  backButton: {
    marginTop: 16,
  },
});
