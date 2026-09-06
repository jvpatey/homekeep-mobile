import React, { ReactNode } from "react";
import {
  View,
  Text,
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
import { useDevice, useGradients } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { HearthSurfaceCard, HouseMark } from "../ui";
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
  const { isRegularWidth, getAuthContentWidth, getMaxContentWidth, getResponsiveValue } =
    useDevice();

  const formWidth = getAuthContentWidth("form");
  const splitWidth = getMaxContentWidth();
  const gutter = isRegularWidth
    ? DesignSystem.spacing.xl
    : DesignSystem.spacing.lg;
  const cardPadding = isRegularWidth
    ? getResponsiveValue(
        DesignSystem.spacing.lg,
        DesignSystem.spacing.xl,
        DesignSystem.spacing.xxl,
      )
    : DesignSystem.spacing.lg;
  const brandMarkSize = getResponsiveValue(72, 88, 108);
  const brandTitleSize = getResponsiveValue(36, 40, 46);
  const brandTitleLine = getResponsiveValue(42, 46, 52);
  const edgePadding = {
    paddingTop: insets.top + DesignSystem.spacing.sm,
    paddingBottom: insets.bottom + DesignSystem.spacing.lg,
    paddingHorizontal: gutter,
  };

  const form = (
    <>
      <View style={[!isRegularWidth && styles.formGrow, contentStyle]}>
        {children}
      </View>
      {footer}
    </>
  );

  const body = isRegularWidth ? (
    <View
      style={[
        styles.split,
        splitWidth != null && { maxWidth: splitWidth },
      ]}
    >
      <AuthHeader onBack={onBack} />
      <View style={styles.splitRow}>
        <View style={styles.brand}>
          <HouseMark size={brandMarkSize} />
          <Text
            style={[
              styles.brandTitle,
              {
                color: colors.text,
                fontSize: brandTitleSize,
                lineHeight: brandTitleLine,
              },
            ]}
            maxFontSizeMultiplier={1.3}
          >
            {title}
          </Text>
          {!!subtitle && (
            <Text
              style={[styles.brandSubtitle, { color: colors.textSecondary }]}
              maxFontSizeMultiplier={1.4}
            >
              {subtitle}
            </Text>
          )}
        </View>
        <HearthSurfaceCard
          containerStyle={[
            styles.cardContainer,
            formWidth != null && { maxWidth: formWidth },
          ]}
          style={[styles.card, { padding: cardPadding, width: "100%" }]}
        >
          {form}
        </HearthSurfaceCard>
      </View>
    </View>
  ) : (
    <View style={styles.column}>
      <AuthHeader title={title} subtitle={subtitle} onBack={onBack} />
      {form}
    </View>
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
                edgePadding,
                isRegularWidth && styles.regularAlign,
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
                edgePadding,
                isRegularWidth && styles.regularAlign,
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
  },
  staticContent: {
    flex: 1,
  },
  regularAlign: {
    justifyContent: "center",
  },
  column: {
    width: "100%",
    flexGrow: 1,
  },
  split: {
    width: "100%",
    alignSelf: "center",
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xl,
  },
  brand: {
    flex: 1,
    paddingRight: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md,
  },
  brandTitle: {
    ...DesignSystem.typography.display,
    letterSpacing: -1,
  },
  brandSubtitle: {
    ...DesignSystem.typography.callout,
  },
  cardContainer: {
    flex: 1.15,
    minWidth: 320,
    width: "100%",
  },
  card: {
    overflow: "visible",
  },
  formGrow: {
    flex: 1,
  },
});
