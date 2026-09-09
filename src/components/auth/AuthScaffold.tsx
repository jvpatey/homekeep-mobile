import React, { ReactNode, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
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
  const {
    isRegularWidth,
    width,
    height,
    getAuthContentWidth,
    getMaxContentWidth,
    getResponsiveValue,
  } = useDevice();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardOpen(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const isTabletPortrait = isRegularWidth && height >= width;
  const formWidth = getAuthContentWidth("form");
  const splitWidth = getMaxContentWidth();
  const gutter = isRegularWidth
    ? getResponsiveValue(
        DesignSystem.spacing.xl,
        DesignSystem.spacing.xxl,
        DesignSystem.spacing.xxl
      )
    : DesignSystem.spacing.lg;
  const cardPadding = isRegularWidth
    ? getResponsiveValue(
        DesignSystem.spacing.xl,
        DesignSystem.spacing.xl,
        DesignSystem.spacing.xxl
      )
    : DesignSystem.spacing.lg;
  const splitGap = isRegularWidth
    ? getResponsiveValue(
        DesignSystem.spacing.xl,
        DesignSystem.spacing.xxl,
        DesignSystem.spacing.xxl
      )
    : DesignSystem.spacing.xl;
  // Brand should read as the hero of the split — scale with the form card, not under it.
  const brandMarkSize = isRegularWidth
    ? getResponsiveValue(isTabletPortrait ? 104 : 120, 132, 152)
    : getResponsiveValue(72, 88, 108);
  const brandTitleSize = isRegularWidth
    ? getResponsiveValue(isTabletPortrait ? 42 : 46, 50, 56)
    : getResponsiveValue(36, 40, 46);
  const brandTitleLine = isRegularWidth
    ? getResponsiveValue(isTabletPortrait ? 48 : 52, 56, 62)
    : getResponsiveValue(42, 46, 52);
  const brandSubtitleSize = isRegularWidth
    ? getResponsiveValue(17, 18, 19)
    : undefined;
  const brandSubtitleLine = isRegularWidth
    ? getResponsiveValue(24, 26, 28)
    : undefined;
  const edgePadding = {
    paddingTop: insets.top + DesignSystem.spacing.sm,
    paddingBottom:
      insets.bottom +
      DesignSystem.spacing.lg +
      (keyboardOpen && !isRegularWidth ? DesignSystem.spacing.xl : 0),
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
        keyboardOpen && styles.splitKeyboardOpen,
      ]}
    >
      <AuthHeader onBack={onBack} />
      <View
        style={[
          styles.heroStage,
          keyboardOpen && styles.heroStageKeyboardOpen,
        ]}
      >
        <View style={[styles.splitRow, { gap: splitGap }]}>
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
                style={[
                  styles.brandSubtitle,
                  {
                    color: colors.textSecondary,
                    ...(brandSubtitleSize != null && {
                      fontSize: brandSubtitleSize,
                      lineHeight: brandSubtitleLine,
                    }),
                  },
                ]}
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
            style={[
              styles.card,
              {
                padding: cardPadding,
                width: "100%",
                flex: keyboardOpen ? undefined : 1,
                justifyContent: keyboardOpen ? "flex-start" : "center",
              },
            ]}
          >
            {form}
          </HearthSurfaceCard>
        </View>
      </View>
    </View>
  ) : (
    <View style={styles.column}>
      <AuthHeader title={title} subtitle={subtitle} onBack={onBack} />
      {form}
    </View>
  );

  // iOS: ScrollView insets avoid the keyboard without shrinking a flex-centered stage.
  // Android: keep KeyboardAvoidingView — window soft input needs the height nudge.
  const frame = (
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
          contentContainerStyle={[styles.scrollContent, edgePadding]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.staticContent, edgePadding]}>{body}</View>
      )}
    </View>
  );

  if (Platform.OS === "android") {
    return (
      <KeyboardAvoidingView
        behavior="height"
        style={[styles.root, { backgroundColor: colors.background }]}
        keyboardVerticalOffset={20}
      >
        {frame}
      </KeyboardAvoidingView>
    );
  }

  return frame;
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
  column: {
    width: "100%",
    flexGrow: 1,
  },
  split: {
    width: "100%",
    flexGrow: 1,
    alignSelf: "center",
  },
  splitKeyboardOpen: {
    // Keep the split from re-centering inside a shorter viewport.
    flexGrow: 0,
  },
  heroStage: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: DesignSystem.spacing.xl,
  },
  heroStageKeyboardOpen: {
    flex: 0,
    justifyContent: "flex-start",
    paddingTop: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.lg,
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
  },
  brand: {
    flex: 1.35,
    minWidth: 0,
    justifyContent: "center",
    gap: DesignSystem.spacing.lg,
  },
  brandTitle: {
    ...DesignSystem.typography.display,
    letterSpacing: -1.2,
  },
  brandSubtitle: {
    ...DesignSystem.typography.callout,
    maxWidth: 360,
  },
  cardContainer: {
    flex: 1,
    minWidth: 280,
    maxWidth: 440,
    alignSelf: "stretch",
  },
  card: {
    overflow: "visible",
    minHeight: 280,
  },
  formGrow: {
    flex: 1,
  },
});
