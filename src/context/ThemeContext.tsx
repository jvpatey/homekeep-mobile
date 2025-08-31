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

  // Function to detect system theme using multiple methods
  const detectSystemTheme = (): Theme => {
    if (systemColorScheme) {
      return systemColorScheme;
    }

    try {
      const appearanceTheme = Appearance.getColorScheme();
      if (appearanceTheme) {
        return appearanceTheme;
      }
    } catch (error) {
      // silently handle errors in production
    }

    // fallback to light theme
    return "light";
  };

  // update theme when system preference changes
  useEffect(() => {
    const detectedTheme = detectSystemTheme();
    setTheme(detectedTheme);
  }, [systemColorScheme]);

  // set initial theme when component mounts
  useEffect(() => {
    const detectedTheme = detectSystemTheme();
    setTheme(detectedTheme);
  }, []);

  // listen for appearance changes
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

// useTheme hook for the useTheme on the home screen
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
