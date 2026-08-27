/**
 * Helpers around `country-region-data` (MIT). Used for address country/region
 * pickers instead of `country-state-city` (GPL-3.0).
 */
import { allCountries } from "country-region-data";

export { allCountries };

/** Sorted once for stable picker ordering. */
export const sortedCountryRows = [...allCountries].sort((a, b) =>
  a[0].localeCompare(b[0], undefined, { sensitivity: "base" })
);

export interface RegionOption {
  name: string;
  isoCode: string;
}

export function flagEmoji(isoCode: string): string {
  if (isoCode.length !== 2) return "";
  const upper = isoCode.toUpperCase();
  try {
    const codePoints = [...upper].map((ch) => 127397 + ch.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return "";
  }
}

export function getRegionsForCountry(countryIso: string): RegionOption[] {
  const row = allCountries.find((c) => c[1] === countryIso);
  if (!row) return [];
  return row[2].map(([name, slug]) => ({ name, isoCode: slug }));
}

export function countryNameForIso(iso: string): string | undefined {
  return allCountries.find((c) => c[1] === iso)?.[0];
}

/** Resolve a stored country (ISO or full name) to an ISO 3166-1 alpha-2 code. */
export function lookupCountryIso(stored: string | null | undefined): string {
  if (!stored) return "";
  const trimmed = stored.trim();
  if (!trimmed) return "";
  if (trimmed.length === 2) {
    const upper = trimmed.toUpperCase();
    if (allCountries.some((c) => c[1] === upper)) return upper;
  }
  const match = allCountries.find(
    (c) => c[0].toLowerCase() === trimmed.toLowerCase()
  );
  return match?.[1] ?? "";
}

/** Resolve a stored region (ISO slug or full name) to its subdivision code. */
export function lookupRegionIso(
  countryIso: string,
  stored: string | null | undefined
): string {
  if (!countryIso || !stored) return "";
  const trimmed = stored.trim();
  if (!trimmed) return "";
  const states = getRegionsForCountry(countryIso);
  const byIso = states.find(
    (s) => s.isoCode.toLowerCase() === trimmed.toLowerCase()
  );
  if (byIso) return byIso.isoCode;
  const byName = states.find(
    (s) => s.name.toLowerCase() === trimmed.toLowerCase()
  );
  return byName?.isoCode ?? "";
}
