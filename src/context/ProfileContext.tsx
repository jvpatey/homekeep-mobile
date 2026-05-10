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

interface ProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  /** True when the user has neither saved nor explicitly skipped the address onboarding. */
  addressNeeded: boolean;
  refresh: () => Promise<void>;
  updateAddress: (address: AddressInput) => Promise<UpdateAddressResult>;
  /** Persists address_set_at without saving any address — used by "Skip for now". */
  skipAddressOnboarding: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const PROFILE_SELECT = `id, full_name, email, address_line1, address_line2, city, region, postal_code, country, latitude, longitude, address_set_at`;

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
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_SELECT)
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        // Use warn so a missing column / RLS hiccup doesn't surface as a
        // RedBox in development.
        console.warn("Failed to load profile", error);
        setProfile({ id: user.id });
        return;
      }

      setProfile((data as UserProfile) ?? { id: user.id });
    } catch (err) {
      console.warn("Profile load threw", err);
      setProfile({ id: user.id });
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
    async (address: AddressInput): Promise<UpdateAddressResult> => {
      if (!supabase || !user) {
        return { success: false, error: "Not signed in", geocoded: false };
      }

      const geocode = await GeocodingService.geocodeAddress({
        line1: address.address_line1,
        city: address.city,
        region: address.region,
        postal_code: address.postal_code,
        country: address.country,
      });

      const payload = {
        id: user.id,
        address_line1: address.address_line1?.trim() || null,
        address_line2: address.address_line2?.trim() || null,
        city: address.city?.trim() || null,
        region: address.region?.trim() || null,
        postal_code: address.postal_code?.trim() || null,
        country: address.country?.trim() || null,
        latitude: geocode?.latitude ?? null,
        longitude: geocode?.longitude ?? null,
        address_set_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" })
        .select(PROFILE_SELECT)
        .maybeSingle();

      if (error) {
        console.error("Failed to update address", error);
        return { success: false, error: error.message, geocoded: false };
      }

      if (data) {
        setProfile(data as UserProfile);
      }
      return { success: true, geocoded: !!geocode };
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
      setProfile(data as UserProfile);
    }
  }, [user]);

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
    }),
    [profile, loading, addressNeeded, loadProfile, updateAddress, skipAddressOnboarding]
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
