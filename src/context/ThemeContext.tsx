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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>("light"); // Start with light as default

  // Function to detect system theme using multiple methods
  const detectSystemTheme = (): Theme => {
    // Method 1: useColorScheme hook (works in most cases)
    if (systemColorScheme) {
      return systemColorScheme;
    }

    // Method 2: Appearance API (more reliable in Expo Go)
    try {
      const appearanceTheme = Appearance.getColorScheme();
      if (appearanceTheme) {
        return appearanceTheme;
      }
    } catch (error) {
      // Silently handle errors in production
    }

    // Method 3: Fallback to light theme
    return "light";
  };

  // Update theme when system preference changes
  useEffect(() => {
    const detectedTheme = detectSystemTheme();
    setTheme(detectedTheme);
  }, [systemColorScheme]);

  // Set initial theme when component mounts
  useEffect(() => {
    const detectedTheme = detectSystemTheme();
    setTheme(detectedTheme);
  }, []);

  // Listen for appearance changes (more reliable than useColorScheme in Expo Go)
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) {
        setTheme(colorScheme);
      }
    });

    return () => subscription?.remove();
  }, []);

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

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
