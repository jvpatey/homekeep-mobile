// Design System - 2025 UI Standards
// Following 8pt grid system and modern typography scales

export const DesignSystem = {
  // SPACING - 8pt grid system
  spacing: {
    xs: 4, // 0.25rem
    sm: 8, // 0.5rem
    md: 16, // 1rem
    lg: 24, // 1.5rem
    xl: 32, // 2rem
    xxl: 40, // 2.5rem
    xxxl: 48, // 3rem
  },

  // TYPOGRAPHY - Optimized for mobile readability
  typography: {
    // Headers
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

    // Body text
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

    // Small text
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

    // Caption
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

    // Button text
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

  // COMPONENT SIZING
  components: {
    // Minimum touch targets (44pt iOS standard)
    minTouchTarget: 44,

    // Button heights
    buttonLarge: 52,
    buttonMedium: 44,
    buttonSmall: 36,

    // Input heights
    inputLarge: 52,
    inputMedium: 44,

    // Card spacing
    cardPadding: 20,
    cardRadius: 16,
    cardRadiusSmall: 12,

    // List item heights
    listItemMinHeight: 60,
    listItemPadding: 16,

    // Tab heights
    tabHeight: 44,
    tabPadding: 16,
  },

  // SHADOWS - Consistent elevation system
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
  },

  // BORDERS
  borders: {
    width: 1,
    widthThick: 2,
    radius: {
      small: 8,
      medium: 12,
      large: 16,
      xlarge: 20,
      round: 999,
    },
  },
} as const;

// Helper function to get spacing values
export const getSpacing = (size: keyof typeof DesignSystem.spacing) => {
  return DesignSystem.spacing[size];
};

// Helper function to get typography styles
export const getTypography = (
  variant: keyof typeof DesignSystem.typography
) => {
  return DesignSystem.typography[variant];
};
