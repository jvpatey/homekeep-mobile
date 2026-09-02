// DesignSystem for the home screen
import { StyleSheet } from "react-native";
import { Easing } from "react-native-reanimated";
import { FontFamily } from "./fonts";

export const DesignSystem = {
  fonts: FontFamily,

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
    xxxl: 48,
  },

  typography: {
    display: {
      fontFamily: FontFamily.display,
      fontSize: 42,
      fontWeight: "700" as const,
      lineHeight: 48,
      letterSpacing: -1.2,
    },
    title1: {
      fontFamily: FontFamily.display,
      fontSize: 32,
      fontWeight: "700" as const,
      lineHeight: 38,
      letterSpacing: -0.8,
    },
    title2: {
      fontFamily: FontFamily.displaySemiBold,
      fontSize: 24,
      fontWeight: "600" as const,
      lineHeight: 30,
      letterSpacing: -0.5,
    },
    callout: {
      fontFamily: FontFamily.ui,
      fontSize: 16,
      fontWeight: "500" as const,
      lineHeight: 22,
      letterSpacing: -0.1,
    },
    footnote: {
      fontFamily: FontFamily.ui,
      fontSize: 13,
      fontWeight: "400" as const,
      lineHeight: 18,
      letterSpacing: 0,
    },
    h1: {
      fontSize: 32,
      fontWeight: "800" as const,
      lineHeight: 38,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 24,
      fontWeight: "700" as const,
      lineHeight: 30,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 20,
      fontWeight: "600" as const,
      lineHeight: 26,
      letterSpacing: -0.2,
    },
    h4: {
      fontSize: 18,
      fontWeight: "600" as const,
      lineHeight: 24,
      letterSpacing: -0.1,
    },

    body: {
      fontSize: 16,
      fontWeight: "400" as const,
      lineHeight: 22,
      letterSpacing: 0,
    },
    bodyMedium: {
      fontSize: 16,
      fontWeight: "500" as const,
      lineHeight: 22,
      letterSpacing: -0.1,
    },
    bodySemiBold: {
      fontSize: 16,
      fontWeight: "600" as const,
      lineHeight: 22,
      letterSpacing: -0.1,
    },

    small: {
      fontSize: 14,
      fontWeight: "400" as const,
      lineHeight: 20,
      letterSpacing: 0,
    },
    smallMedium: {
      fontSize: 14,
      fontWeight: "500" as const,
      lineHeight: 20,
      letterSpacing: -0.1,
    },
    smallSemiBold: {
      fontSize: 14,
      fontWeight: "600" as const,
      lineHeight: 20,
      letterSpacing: -0.1,
    },

    caption: {
      fontSize: 12,
      fontWeight: "400" as const,
      lineHeight: 16,
      letterSpacing: 0,
    },
    captionMedium: {
      fontSize: 12,
      fontWeight: "500" as const,
      lineHeight: 16,
      letterSpacing: 0,
    },
    captionSemiBold: {
      fontSize: 12,
      fontWeight: "600" as const,
      lineHeight: 16,
      letterSpacing: 0,
    },

    button: {
      fontSize: 16,
      fontWeight: "600" as const,
      lineHeight: 20,
      letterSpacing: -0.1,
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: "600" as const,
      lineHeight: 18,
      letterSpacing: -0.1,
    },
  },

  components: {
    minTouchTarget: 44,

    buttonLarge: 56,
    buttonMedium: 44,
    buttonSmall: 36,

    inputLarge: 56,
    inputMedium: 44,

    cardPadding: 20,
    cardRadius: 16,
    cardRadiusSmall: 12,

    listItemMinHeight: 60,
    listItemPadding: 16,

    tabHeight: 44,
    tabPadding: 16,
  },

  shadows: {
    small: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    glass: {
      shadowColor: "#C45C26",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 3,
    },
    glassStrong: {
      shadowColor: "#C45C26",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 5,
    },
    // 2026 layered, monochrome shadows. Soft ambient + soft key.
    softAmbient: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    softKey: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
      elevation: 4,
    },
  },

  glass: {
    blur: 10,
    opacity: 0.7,
    strongOpacity: 0.85,
    borderWidth: 1,
    borderOpacity: 0.3,
  },

  // 2026 Liquid Glass material intensities for expo-blur BlurView.
  materials: {
    regular: { intensity: 25, tintOpacity: 0.55 },
    thick: { intensity: 40, tintOpacity: 0.7 },
    chrome: { intensity: 60, tintOpacity: 0.8 },
  },

  borders: {
    width: 1,
    widthThick: 2,
    hairline: StyleSheet.hairlineWidth,
    radius: {
      small: 8,
      medium: 12,
      large: 16,
      xlarge: 20,
      glass: 22,
      round: 999,
    },
  },

  // 2026 motion tokens. Map to SwiftUI named springs (.smooth/.snappy/.bouncy).
  motion: {
    duration: {
      instant: 120,
      fast: 220,
      base: 280,
      slow: 360,
    },
    easing: {
      // iOS 26 default deceleration curve
      standard: Easing.bezier(0.2, 0.0, 0.0, 1.0),
      emphasized: Easing.bezier(0.3, 0.0, 0.0, 1.0),
    },
    spring: {
      // No overshoot; entrance + dismissal
      smooth: { mass: 1, damping: 30, stiffness: 280 },
      // Tactile, slight bounce; press states + modal opens
      snappy: { mass: 1, damping: 22, stiffness: 320 },
      // Playful; reserved for celebratory/empty-state moments
      bouncy: { mass: 1, damping: 16, stiffness: 240 },
    },
    // Maximum gap between staggered groups (we use two groups max).
    stagger: 60,
  },
} as const;

// getSpacing for the home screen
export const getSpacing = (size: keyof typeof DesignSystem.spacing) => {
  return DesignSystem.spacing[size];
};

// Helper function to get typography styles
export const getTypography = (
  variant: keyof typeof DesignSystem.typography
) => {
  return DesignSystem.typography[variant];
};
