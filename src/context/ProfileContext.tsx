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
  isHomeSystemsComplete,
} from "../data/maintenancePlans";
import {
  HomeEmergencyFacts,
  parseHomeEmergency,
} from "../types/homeEmergency";

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
  avatar_style?: string | null;
  home_setup_set_at?: string | null;
  home_emergency?: HomeEmergencyFacts | null;
  household_id?: string | null;
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
  /** Owner can edit address/systems/emergency; members see the owner's home. */
  canEditHome: boolean;
  householdRole: "owner" | "member" | null;
  /** True when the user has neither saved nor explicitly skipped the address onboarding. */
  addressNeeded: boolean;
  /** True when home systems have not been completed or skipped. */
  homeSetupNeeded: boolean;
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
  /** Marks home setup finished (complete or skipped) so the modal does not return. */
  markHomeSetupDone: () => Promise<void>;
  /** Replace emergency shutoff / panel facts. */
  updateHomeEmergency: (
    facts: HomeEmergencyFacts
  ) => Promise<{ success: boolean; error?: string }>;
  /** Persist the chosen avatar style id. */
  updateAvatarStyle: (
    avatarStyle: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const PROFILE_SELECT = `id, full_name, email, address_line1, address_line2, city, region, postal_code, country, latitude, longitude, address_set_at, home_systems, avatar_style, home_setup_set_at, home_emergency, household_id`;
const PROFILE_SELECT_LEGACY = `id, full_name, email, address_line1, address_line2, city, region, postal_code, country, latitude, longitude, address_set_at`;

function applyOwnerHomeFields(
  own: UserProfile,
  owner: UserProfile
): UserProfile {
  return {
    ...own,
    address_line1: owner.address_line1,
    address_line2: owner.address_line2,
    city: owner.city,
    region: owner.region,
    postal_code: owner.postal_code,
    country: owner.country,
    latitude: owner.latitude,
    longitude: owner.longitude,
    address_set_at: owner.address_set_at,
    home_systems: owner.home_systems,
    home_setup_set_at: owner.home_setup_set_at,
    home_emergency: owner.home_emergency,
  };
}

async function overlayHouseholdHome(
  own: UserProfile
): Promise<{
  profile: UserProfile;
  canEditHome: boolean;
  householdRole: "owner" | "member" | null;
}> {
  if (!supabase || !own.household_id) {
    return { profile: own, canEditHome: true, householdRole: null };
  }
  const { data: household } = await supabase
    .from("households")
    .select("created_by")
    .eq("id", own.household_id)
    .maybeSingle();
  const ownerId =
    typeof household?.created_by === "string" ? household.created_by : null;
  if (!ownerId) {
    return { profile: own, canEditHome: true, householdRole: null };
  }
  if (ownerId === own.id) {
    return { profile: own, canEditHome: true, householdRole: "owner" };
  }
  const { data: ownerRow } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", ownerId)
    .maybeSingle();
  if (!ownerRow) {
    return { profile: own, canEditHome: false, householdRole: "member" };
  }
  return {
    profile: applyOwnerHomeFields(own, normalizeProfile(ownerRow, ownerId)),
    canEditHome: false,
    householdRole: "member",
  };
}

function normalizeProfile(data: unknown, fallbackId: string): UserProfile {
  if (!data || typeof data !== "object") {
    return { id: fallbackId };
  }
  const row = data as UserProfile & {
    home_systems?: unknown;
    avatar_style?: unknown;
    home_emergency?: unknown;
  };
  return {
    ...row,
    id: row.id || fallbackId,
    home_systems: parseHomeSystems(row.home_systems),
    avatar_style:
      typeof row.avatar_style === "string" ? row.avatar_style : null,
    home_setup_set_at:
      typeof row.home_setup_set_at === "string" ? row.home_setup_set_at : null,
    home_emergency: parseHomeEmergency(row.home_emergency),
    household_id:
      typeof row.household_id === "string" ? row.household_id : null,
  };
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [canEditHome, setCanEditHome] = useState(true);
  const [householdRole, setHouseholdRole] = useState<
    "owner" | "member" | null
  >(null);
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
          "Failed to load profile (home_systems or avatar_style column may be missing); retrying without them",
          error
        );
        const fallback = await supabase
          .from("profiles")
          .select(PROFILE_SELECT_LEGACY)
          .eq("id", user.id)
          .maybeSingle();
        if (fallback.data) {
          const overlaid = await overlayHouseholdHome(
            normalizeProfile(fallback.data, user.id)
          );
          setProfile(overlaid.profile);
          setCanEditHome(overlaid.canEditHome);
          setHouseholdRole(overlaid.householdRole);
          return;
        }
        setProfile({ id: user.id, home_systems: {} });
        setCanEditHome(true);
        setHouseholdRole(null);
        return;
      }

      const overlaid = await overlayHouseholdHome(
        normalizeProfile(data, user.id)
      );
      setProfile(overlaid.profile);
      setCanEditHome(overlaid.canEditHome);
      setHouseholdRole(overlaid.householdRole);
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
      if (!canEditHome) {
        return {
          success: false,
          error: "Only the household owner can edit this home.",
          geocoded: false,
        };
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
    [user, canEditHome]
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
      if (!canEditHome) {
        return {
          success: false,
          error: "Only the household owner can edit this home.",
        };
      }
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
    [profile?.home_systems, user, canEditHome]
  );

  const markHomeSetupDone = useCallback(async () => {
    const nowIso = new Date().toISOString();
    setProfile((prev) =>
      prev ? { ...prev, home_setup_set_at: nowIso } : prev
    );
    if (!supabase || !user) return;
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          home_setup_set_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: "id" }
      )
      .select(PROFILE_SELECT)
      .maybeSingle();
    if (error) {
      console.warn("Failed to persist home_setup_set_at", error);
      return;
    }
    if (data) {
      setProfile(normalizeProfile(data, user.id));
    }
  }, [user]);

  const updateHomeEmergency = useCallback(
    async (
      facts: HomeEmergencyFacts
    ): Promise<{ success: boolean; error?: string }> => {
      if (!canEditHome) {
        return {
          success: false,
          error: "Only the household owner can edit this home.",
        };
      }
      setProfile((prev) =>
        prev ? { ...prev, home_emergency: facts } : prev
      );
      if (!supabase || !user) {
        return { success: false, error: "Not signed in" };
      }
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            home_emergency: facts,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select(PROFILE_SELECT)
        .maybeSingle();
      if (error) {
        console.warn("Failed to persist home_emergency", error);
        return { success: false, error: error.message };
      }
      if (data) {
        setProfile(normalizeProfile(data, user.id));
      }
      return { success: true };
    },
    [user, canEditHome]
  );

  const updateAvatarStyle = useCallback(
    async (
      avatarStyle: string
    ): Promise<{ success: boolean; error?: string }> => {
      setProfile((prev) =>
        prev
          ? { ...prev, avatar_style: avatarStyle }
          : user
            ? { id: user.id, avatar_style: avatarStyle }
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
            avatar_style: avatarStyle,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select(PROFILE_SELECT)
        .maybeSingle();

      if (error) {
        console.warn(
          "Failed to persist avatar_style (column may be missing); keeping in-memory value",
          error
        );
        return { success: false, error: error.message };
      }

      if (data) {
        setProfile(normalizeProfile(data, user.id));
      }
      return { success: true };
    },
    [user]
  );

  const addressNeeded = useMemo(() => {
    if (!user) return false;
    if (loading) return false;
    if (!profile) return true;
    return !profile.address_set_at;
  }, [user, loading, profile]);

  const homeSetupNeeded = useMemo(() => {
    if (!user) return false;
    if (loading) return false;
    if (addressNeeded) return false;
    if (!profile) return true;
    if (profile.home_setup_set_at) return false;
    if (isHomeSystemsComplete(profile.home_systems)) return false;
    return true;
  }, [user, loading, profile, addressNeeded]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      loading,
      canEditHome,
      householdRole,
      addressNeeded,
      homeSetupNeeded,
      refresh: loadProfile,
      updateAddress,
      skipAddressOnboarding,
      updateHomeSystems,
      markHomeSetupDone,
      updateHomeEmergency,
      updateAvatarStyle,
    }),
    [
      profile,
      loading,
      canEditHome,
      householdRole,
      addressNeeded,
      homeSetupNeeded,
      loadProfile,
      updateAddress,
      skipAddressOnboarding,
      updateHomeSystems,
      markHomeSetupDone,
      updateHomeEmergency,
      updateAvatarStyle,
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
