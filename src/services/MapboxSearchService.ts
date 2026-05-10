/**
 * Mapbox Search Box API wrapper for address autocomplete.
 *
 * Two-step flow per session (Mapbox bills per session, not per request):
 *   1. suggest(query, sessionToken)   → list of suggestions (mapbox_id)
 *   2. retrieve(mapbox_id, sessionToken) → full structured address + coords
 *
 * Generate one sessionToken (uuid) per "user composing an address" session;
 * pass it through both calls so they're billed together.
 *
 * Docs: https://docs.mapbox.com/api/search/search-box/
 */

const SUGGEST_ENDPOINT = "https://api.mapbox.com/search/searchbox/v1/suggest";
const RETRIEVE_ENDPOINT = "https://api.mapbox.com/search/searchbox/v1/retrieve";

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";

export const isMapboxConfigured = (): boolean => TOKEN.length > 0;

export interface MapboxSuggestion {
  mapboxId: string;
  name: string;
  fullAddress: string;
  placeFormatted: string;
}

export interface MapboxResolvedAddress {
  addressLine1?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  /** ISO 3166-1 alpha-2 country code (e.g. "US"), uppercased. */
  countryCode?: string;
  countryName?: string;
  latitude?: number;
  longitude?: number;
}

interface SuggestResponse {
  suggestions?: Array<{
    mapbox_id: string;
    name?: string;
    full_address?: string;
    place_formatted?: string;
  }>;
}

interface RetrieveFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    address?: string;
    full_address?: string;
    feature_type?: string;
    context?: {
      address?: { name?: string; address_number?: string; street_name?: string };
      street?: { name?: string };
      neighborhood?: { name?: string };
      postcode?: { name?: string };
      place?: { name?: string };
      district?: { name?: string };
      region?: { name?: string; region_code?: string };
      country?: { name?: string; country_code?: string };
    };
  };
}

interface RetrieveResponse {
  features?: RetrieveFeature[];
}

export class MapboxSearchService {
  /**
   * Generate a UUIDv4 for the session token. Mapbox requires a string per
   * "session" so charges aggregate; we don't need crypto-grade randomness.
   */
  static newSessionToken(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  static async suggest(
    query: string,
    sessionToken: string,
    options: {
      proximity?: { latitude: number; longitude: number };
      country?: string;
      signal?: AbortSignal;
    } = {}
  ): Promise<MapboxSuggestion[]> {
    if (!isMapboxConfigured()) return [];
    const trimmed = query.trim();
    if (trimmed.length < 3) return [];

    const params = new URLSearchParams({
      q: trimmed,
      access_token: TOKEN,
      session_token: sessionToken,
      types: "address,street,place",
      limit: "6",
      language: "en",
    });
    if (options.proximity) {
      params.set(
        "proximity",
        `${options.proximity.longitude},${options.proximity.latitude}`
      );
    }
    if (options.country) {
      params.set("country", options.country.toLowerCase());
    }

    try {
      const response = await fetch(`${SUGGEST_ENDPOINT}?${params.toString()}`, {
        signal: options.signal,
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.warn(
          `[Mapbox] suggest ${response.status} ${response.statusText}`,
          body
        );
        return [];
      }
      const payload = (await response.json()) as SuggestResponse;
      const suggestions = payload.suggestions ?? [];
      if (__DEV__) {
        console.log(
          `[Mapbox] suggest "${trimmed}" -> ${suggestions.length} result(s)`
        );
      }
      return suggestions.map((s) => ({
        mapboxId: s.mapbox_id,
        name: s.name ?? "",
        fullAddress: s.full_address ?? s.place_formatted ?? "",
        placeFormatted: s.place_formatted ?? "",
      }));
    } catch (error) {
      if ((error as { name?: string }).name === "AbortError") return [];
      console.warn("[Mapbox] suggest failed", error);
      return [];
    }
  }

  static async retrieve(
    mapboxId: string,
    sessionToken: string
  ): Promise<MapboxResolvedAddress | null> {
    if (!isMapboxConfigured()) return null;

    const params = new URLSearchParams({
      access_token: TOKEN,
      session_token: sessionToken,
      language: "en",
    });

    try {
      const response = await fetch(
        `${RETRIEVE_ENDPOINT}/${encodeURIComponent(mapboxId)}?${params.toString()}`
      );
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.warn(
          `[Mapbox] retrieve ${response.status} ${response.statusText}`,
          body
        );
        return null;
      }
      const payload = (await response.json()) as RetrieveResponse;
      const feature = payload.features?.[0];
      if (!feature) return null;

      const ctx = feature.properties?.context ?? {};
      const coords = feature.geometry?.coordinates;

      // Mapbox returns address line as either properties.address or
      // (for "address" type features) name === full street + number.
      const addressLine1 =
        ctx.address?.name ||
        feature.properties?.address ||
        feature.properties?.name ||
        undefined;

      return {
        addressLine1,
        city: ctx.place?.name || ctx.district?.name,
        region: ctx.region?.name,
        postalCode: ctx.postcode?.name,
        countryCode: ctx.country?.country_code?.toUpperCase(),
        countryName: ctx.country?.name,
        latitude: coords?.[1],
        longitude: coords?.[0],
      };
    } catch (error) {
      console.warn("[Mapbox] retrieve failed", error);
      return null;
    }
  }
}
