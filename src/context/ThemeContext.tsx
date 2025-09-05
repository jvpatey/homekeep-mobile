import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme, Appearance } from "react-native";
import { colors } from "../theme/colors";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  colors: typeof colors.light;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ThemeProvider provider for the theme context
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>("light");
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to detect system theme using multiple methods
  const detectSystemTheme = (): Theme => {
    // First try useColorScheme hook
    if (
      systemColorScheme &&
      (systemColorScheme === "light" || systemColorScheme === "dark")
    ) {
      return systemColorScheme;
    }

    // Fallback to Appearance API
    try {
      const appearanceTheme = Appearance.getColorScheme();
      if (
        appearanceTheme &&
        (appearanceTheme === "light" || appearanceTheme === "dark")
      ) {
        return appearanceTheme;
      }
    } catch (error) {
      console.warn("Failed to get appearance theme:", error);
    }

    // Final fallback to light theme
    return "light";
  };

  // Initialize theme on mount and when system scheme changes
  useEffect(() => {
    const detectedTheme = detectSystemTheme();
    setTheme(detectedTheme);
    setIsInitialized(true);
  }, [systemColorScheme]);

  // Listen for appearance changes after initialization
  useEffect(() => {
    if (!isInitialized) return;

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme && (colorScheme === "light" || colorScheme === "dark")) {
        setTheme(colorScheme);
      }
    });

    return () => subscription?.remove();
  }, [isInitialized]);

  const themeColors = colors[theme];
  const isDark = theme === "dark";

  const value = {
    theme,
    colors: themeColors,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// useTheme hook for the useTheme on the home screen
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
