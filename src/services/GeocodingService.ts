/**
 * Lightweight geocoding via Open-Meteo's free Geocoding API. We only need
 * city-level precision (weather is interpolated to a few km), so we feed
 * the city + country and pick the first match. No API key required.
 *
 * https://open-meteo.com/en/docs/geocoding-api
 */

export interface GeocodeAddressInput {
  line1?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  resolvedName?: string;
  resolvedCountry?: string;
  resolvedRegion?: string;
}

interface OpenMeteoGeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
}

interface OpenMeteoGeocodingResponse {
  results?: OpenMeteoGeocodingResult[];
}

const GEOCODING_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";

export class GeocodingService {
  /**
   * Best-effort geocode. Returns null when no match is found or the request
   * fails — callers should treat that as "save the address without coords"
   * rather than blocking the user.
   */
  static async geocodeAddress(
    address: GeocodeAddressInput
  ): Promise<GeocodeResult | null> {
    const query = address.city?.trim() || address.postal_code?.trim();
    if (!query) {
      return null;
    }

    const params = new URLSearchParams({
      name: query,
      count: "5",
      language: "en",
      format: "json",
    });

    try {
      const response = await fetch(`${GEOCODING_ENDPOINT}?${params.toString()}`);
      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as OpenMeteoGeocodingResponse;
      const results = payload.results ?? [];
      if (results.length === 0) {
        return null;
      }

      const country = address.country?.trim().toLowerCase();
      const region = address.region?.trim().toLowerCase();

      // Prefer a result whose country (and ideally region) matches the input
      // — Open-Meteo can return same-name cities across the world.
      const ranked = [...results].sort((a, b) => {
        const score = (r: OpenMeteoGeocodingResult) => {
          let s = 0;
          if (country) {
            const rc = (r.country_code || "").toLowerCase();
            const rn = (r.country || "").toLowerCase();
            if (rc === country || rn === country) s += 2;
          }
          if (region) {
            const rr = (r.admin1 || "").toLowerCase();
            if (rr === region) s += 1;
          }
          return s;
        };
        return score(b) - score(a);
      });

      const best = ranked[0];
      return {
        latitude: best.latitude,
        longitude: best.longitude,
        resolvedName: best.name,
        resolvedCountry: best.country,
        resolvedRegion: best.admin1,
      };
    } catch (error) {
      console.warn("Geocoding failed", error);
      return null;
    }
  }
}
