import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Modern gradient presets following 2025 design trends
export const GRADIENT_PRESETS = {
  ocean: {
    id: "ocean",
    name: "Ocean",
    colors: ["#667eea", "#764ba2"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  sunset: {
    id: "sunset",
    name: "Sunset",
    colors: ["#f093fb", "#f5576c"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  forest: {
    id: "forest",
    name: "Forest",
    colors: ["#56ab2f", "#a8e6cf"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  cosmic: {
    id: "cosmic",
    name: "Cosmic",
    colors: ["#667eea", "#764ba2"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  aurora: {
    id: "aurora",
    name: "Aurora",
    colors: ["#a8edea", "#fed6e3"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  lavender: {
    id: "lavender",
    name: "Lavender",
    colors: ["#d299c2", "#fef9d7"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  mint: {
    id: "mint",
    name: "Mint",
    colors: ["#89f7fe", "#66a6ff"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  peach: {
    id: "peach",
    name: "Peach",
    colors: ["#ffecd2", "#fcb69f"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  slate: {
    id: "slate",
    name: "Slate",
    colors: ["#bdc3c7", "#2c3e50"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  rose: {
    id: "rose",
    name: "Rose",
    colors: ["#ff9a9e", "#fecfef"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

export type GradientPreset =
  (typeof GRADIENT_PRESETS)[keyof typeof GRADIENT_PRESETS];

interface UserPreferencesContextType {
  selectedGradient: GradientPreset;
  updateGradient: (gradient: GradientPreset) => Promise<void>;
  loading: boolean;
}

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined);

const STORAGE_KEY = "@user_preferences";

interface UserPreferencesProviderProps {
  children: React.ReactNode;
}

export function UserPreferencesProvider({
  children,
}: UserPreferencesProviderProps) {
  const [selectedGradient, setSelectedGradient] = useState<GradientPreset>(
    GRADIENT_PRESETS.ocean
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const preferences = JSON.parse(stored);
        if (
          preferences.gradientId &&
          GRADIENT_PRESETS[
            preferences.gradientId as keyof typeof GRADIENT_PRESETS
          ]
        ) {
          setSelectedGradient(
            GRADIENT_PRESETS[
              preferences.gradientId as keyof typeof GRADIENT_PRESETS
            ]
          );
        }
      }
    } catch (error) {
      console.error("Failed to load user preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateGradient = async (gradient: GradientPreset) => {
    try {
      setSelectedGradient(gradient);
      const preferences = { gradientId: gradient.id };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error("Failed to save user preferences:", error);
    }
  };

  const value = {
    selectedGradient,
    updateGradient,
    loading,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider"
    );
  }
  return context;
}
