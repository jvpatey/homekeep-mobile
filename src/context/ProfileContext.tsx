import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth, supabase } from "./AuthContext";
import { GeocodingService } from "../services/GeocodingService";
import {
  HomeSystems,
  mergeHomeSystems,
  parseHomeSystems,
} from "../data/maintenancePlans";

export interface UserProfile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address_set_at?: string | null;
  home_systems?: HomeSystems | null;
}

export interface AddressInput {
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

interface UpdateAddressResult {
  success: boolean;
  error?: string;
  geocoded: boolean;
}

export interface AddressCoords {
  latitude: number;
  longitude: number;
}

interface ProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  /** True when the user has neither saved nor explicitly skipped the address onboarding. */
  addressNeeded: boolean;
  refresh: () => Promise<void>;
  /** Persists the address row. Pass `coords` when they come from a richer
   * source (e.g. Mapbox autocomplete pick) to skip the Open-Meteo fallback. */
  updateAddress: (
    address: AddressInput,
    coords?: AddressCoords
  ) => Promise<UpdateAddressResult>;
  /** Persists address_set_at without saving any address — used by "Skip for now". */
  skipAddressOnboarding: () => Promise<void>;
  /** Merge-patch home systems answers used by maintenance plan questionnaires. */
  updateHomeSystems: (
    patch: HomeSystems
  ) => Promise<{ success: boolean; error?: string }>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const PROFILE_SELECT = `id, full_name, email, address_line1, address_line2, city, region, postal_code, country, latitude, longitude, address_set_at, home_systems`;
const PROFILE_SELECT_LEGACY = `id, full_name, email, address_line1, address_line2, city, region, postal_code, country, latitude, longitude, address_set_at`;

function normalizeProfile(data: unknown, fallbackId: string): UserProfile {
  if (!data || typeof data !== "object") {
    return { id: fallbackId };
  }
  const row = data as UserProfile & { home_systems?: unknown };
  return {
    ...row,
    id: row.id || fallbackId,
    home_systems: parseHomeSystems(row.home_systems),
  };
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!supabase || !user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_SELECT)
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.warn(
          "Failed to load profile (home_systems column may be missing); retrying without it",
          error
        );
        const fallback = await supabase
          .from("profiles")
          .select(PROFILE_SELECT_LEGACY)
          .eq("id", user.id)
          .maybeSingle();
        if (fallback.data) {
          setProfile(normalizeProfile(fallback.data, user.id));
          return;
        }
        setProfile({ id: user.id, home_systems: {} });
        return;
      }

      setProfile(normalizeProfile(data, user.id));
    } catch (err) {
      console.warn("Profile load threw", err);
      setProfile({ id: user.id, home_systems: {} });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id !== userIdRef.current) {
      userIdRef.current = user?.id ?? null;
      void loadProfile();
    } else if (!user) {
      setProfile(null);
      setLoading(false);
    }
  }, [user, loadProfile]);

  const updateAddress = useCallback(
    async (
      address: AddressInput,
      coords?: AddressCoords
    ): Promise<UpdateAddressResult> => {
      if (!supabase || !user) {
        return { success: false, error: "Not signed in", geocoded: false };
      }

      // Prefer caller-supplied coords (e.g. from Mapbox autocomplete) — only
      // fall back to the city-precision Open-Meteo geocoder when they're absent.
      let resolvedCoords: AddressCoords | null = coords ?? null;
      if (!resolvedCoords) {
        const geocode = await GeocodingService.geocodeAddress({
          line1: address.address_line1,
          city: address.city,
          region: address.region,
          postal_code: address.postal_code,
          country: address.country,
        });
        if (geocode) {
          resolvedCoords = {
            latitude: geocode.latitude,
            longitude: geocode.longitude,
          };
        }
      }

      const payload = {
        id: user.id,
        address_line1: address.address_line1?.trim() || null,
        address_line2: address.address_line2?.trim() || null,
        city: address.city?.trim() || null,
        region: address.region?.trim() || null,
        postal_code: address.postal_code?.trim() || null,
        country: address.country?.trim() || null,
        latitude: resolvedCoords?.latitude ?? null,
        longitude: resolvedCoords?.longitude ?? null,
        address_set_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" })
        .select(PROFILE_SELECT)
        .maybeSingle();

      if (error) {
        console.warn("Failed to update address", error);
        return { success: false, error: error.message, geocoded: false };
      }

      if (data) {
        setProfile(normalizeProfile(data, user.id));
      }
      return { success: true, geocoded: !!resolvedCoords };
    },
    [user]
  );

  const skipAddressOnboarding = useCallback(async () => {
    if (!supabase || !user) return;
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          address_set_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: "id" }
      )
      .select(PROFILE_SELECT)
      .maybeSingle();

    if (error) {
      console.warn("Failed to mark address onboarding as skipped", error);
      return;
    }
    if (data) {
      setProfile(normalizeProfile(data, user.id));
    }
  }, [user]);

  const updateHomeSystems = useCallback(
    async (
      patch: HomeSystems
    ): Promise<{ success: boolean; error?: string }> => {
      const merged = mergeHomeSystems(profile?.home_systems, patch);
      setProfile((prev) =>
        prev
          ? { ...prev, home_systems: merged }
          : user
            ? { id: user.id, home_systems: merged }
            : prev
      );

      if (!supabase || !user) {
        return { success: false, error: "Not signed in" };
      }

      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            home_systems: merged,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select(PROFILE_SELECT)
        .maybeSingle();

      if (error) {
        console.warn(
          "Failed to persist home_systems (column may be missing); keeping in-memory merge",
          error
        );
        return { success: false, error: error.message };
      }

      if (data) {
        setProfile(normalizeProfile(data, user.id));
      }
      return { success: true };
    },
    [profile?.home_systems, user]
  );

  const addressNeeded = useMemo(() => {
    if (!user) return false;
    if (loading) return false;
    if (!profile) return true;
    return !profile.address_set_at;
  }, [user, loading, profile]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      loading,
      addressNeeded,
      refresh: loadProfile,
      updateAddress,
      skipAddressOnboarding,
      updateHomeSystems,
    }),
    [
      profile,
      loading,
      addressNeeded,
      loadProfile,
      updateAddress,
      skipAddressOnboarding,
      updateHomeSystems,
    ]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return ctx;
}
