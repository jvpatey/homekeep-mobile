import React, { ReactNode } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useGradients } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { AuthHeader } from "./AuthHeader";

interface AuthScaffoldProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function AuthScaffold({
  title,
  subtitle,
  onBack,
  children,
  footer,
  scrollable = true,
  contentStyle,
}: AuthScaffoldProps) {
  const { colors, isDark } = useTheme();
  const { authAtmosphere } = useGradients();
  const insets = useSafeAreaInsets();

  const body = (
    <>
      <AuthHeader title={title} subtitle={subtitle} onBack={onBack} />
      <View style={[styles.form, contentStyle]}>{children}</View>
      {footer}
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.root, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          <StatusBar style={isDark ? "light" : "dark"} />

          <LinearGradient
            colors={authAtmosphere}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.55 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {scrollable ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.scrollContent,
                {
                  paddingTop: insets.top + DesignSystem.spacing.sm,
                  paddingBottom: insets.bottom + DesignSystem.spacing.lg,
                },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {body}
            </ScrollView>
          ) : (
            <View
              style={[
                styles.staticContent,
                {
                  paddingTop: insets.top + DesignSystem.spacing.sm,
                  paddingBottom: insets.bottom + DesignSystem.spacing.lg,
                },
              ]}
            >
              {body}
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  staticContent: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  form: {
    flex: 1,
  },
});
