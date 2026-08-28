import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProfile } from "./ProfileContext";

export const GRADIENT_PRESETS = {
  copper: {
    id: "copper",
    name: "Copper",
    colors: ["#C45C26", "#E09A6A"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  terracotta: {
    id: "terracotta",
    name: "Terracotta",
    colors: ["#B5523A", "#E07A5F"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  sage: {
    id: "sage",
    name: "Sage",
    colors: ["#2F5D50", "#6B9B8A"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  olive: {
    id: "olive",
    name: "Olive",
    colors: ["#5C6B3A", "#A3B18A"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  clay: {
    id: "clay",
    name: "Clay",
    colors: ["#8B5E3C", "#C4A484"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  slate: {
    id: "slate",
    name: "Slate",
    colors: ["#4A453F", "#8A8278"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  ink: {
    id: "ink",
    name: "Ink",
    colors: ["#1A1612", "#6B645C"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  roseclay: {
    id: "roseclay",
    name: "Rose clay",
    colors: ["#A64B4B", "#D4A5A5"] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

export type GradientPresetId = keyof typeof GRADIENT_PRESETS;

export type GradientPreset =
  (typeof GRADIENT_PRESETS)[GradientPresetId];

const STORAGE_KEY = "@user_preferences";

/** Map a stored id (including retired presets) to a current Hearth style. */
export function resolveGradientPreset(
  id: string | null | undefined
): GradientPreset {
  if (id && id in GRADIENT_PRESETS) {
    return GRADIENT_PRESETS[id as GradientPresetId];
  }
  return GRADIENT_PRESETS.copper;
}

interface UserPreferencesContextType {
  selectedGradient: GradientPreset;
  updateGradient: (gradient: GradientPreset) => Promise<void>;
  loading: boolean;
}

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined);

interface UserPreferencesProviderProps {
  children: React.ReactNode;
}

async function writeLocalCache(gradientId: string) {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ gradientId })
  );
}

export function UserPreferencesProvider({
  children,
}: UserPreferencesProviderProps) {
  const { profile, loading: profileLoading, updateAvatarStyle } = useProfile();
  const [selectedGradient, setSelectedGradient] = useState<GradientPreset>(
    GRADIENT_PRESETS.copper
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileLoading) return;
    let cancelled = false;

    const hydrate = async () => {
      try {
        const profileId = profile?.avatar_style;
        if (profileId && profileId in GRADIENT_PRESETS) {
          const fromProfile = GRADIENT_PRESETS[profileId as GradientPresetId];
          if (!cancelled) setSelectedGradient(fromProfile);
          await writeLocalCache(fromProfile.id);
          return;
        }

        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        let resolved: GradientPreset = GRADIENT_PRESETS.copper;
        if (stored) {
          try {
            const preferences = JSON.parse(stored) as { gradientId?: string };
            resolved = resolveGradientPreset(preferences.gradientId);
          } catch {
            resolved = GRADIENT_PRESETS.copper;
          }
        }

        if (!cancelled) setSelectedGradient(resolved);
        await writeLocalCache(resolved.id);
        if (profile?.id && profile.avatar_style !== resolved.id) {
          void updateAvatarStyle(resolved.id);
        }
      } catch (error) {
        console.error("Failed to load user preferences:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [
    profileLoading,
    profile?.id,
    profile?.avatar_style,
    updateAvatarStyle,
  ]);

  const updateGradient = useCallback(
    async (gradient: GradientPreset) => {
      setSelectedGradient(gradient);
      try {
        await writeLocalCache(gradient.id);
      } catch (error) {
        console.error("Failed to cache avatar style:", error);
      }
      await updateAvatarStyle(gradient.id);
    },
    [updateAvatarStyle]
  );

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
