// DesignSystem for the home screen

export const DesignSystem = {
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

    buttonLarge: 52,
    buttonMedium: 44,
    buttonSmall: 36,

    inputLarge: 52,
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
  },

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
