import { UserProfile } from "../context/ProfileContext";
import { lookupCountryIso, lookupRegionIso } from "./countryRegionData";

function trimOrNull(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

/** Returns true when the profile has at least one address field saved. */
export function profileHasAddress(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return !!(
    trimOrNull(profile.address_line1) ||
    trimOrNull(profile.city) ||
    trimOrNull(profile.postal_code)
  );
}

/** Multi-line mailing-style address for reports and previews. */
export function formatProfileAddressLines(
  profile: UserProfile | null
): string[] {
  if (!profile || !profileHasAddress(profile)) {
    return [];
  }

  const lines: string[] = [];
  const line1 = trimOrNull(profile.address_line1);
  const line2 = trimOrNull(profile.address_line2);
  if (line1) lines.push(line1);
  if (line2) lines.push(line2);

  const city = trimOrNull(profile.city);
  const region = trimOrNull(profile.region);
  const postal = trimOrNull(profile.postal_code);
  const localityParts = [city, region].filter((v): v is string => !!v);
  let localityLine = localityParts.join(", ");
  if (postal) {
    localityLine = localityLine
      ? `${localityLine} ${postal}`
      : postal;
  }
  if (localityLine) lines.push(localityLine);

  const country = trimOrNull(profile.country);
  if (country) lines.push(country);

  return lines;
}

/** Short locality for dashboard chrome: city + abbreviated region. Never street. */
export function formatProfileLocality(
  profile: UserProfile | null
): string | null {
  if (!profile) return null;
  const city = trimOrNull(profile.city);
  const region = trimOrNull(profile.region);
  const countryIso = lookupCountryIso(profile.country);
  const regionAbbr = region
    ? lookupRegionIso(countryIso, region) ||
      (region.length <= 3 ? region.toUpperCase() : region)
    : null;
  if (city && regionAbbr) return `${city}, ${regionAbbr}`;
  return city || regionAbbr;
}
