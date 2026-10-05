import { lookupCountryIso } from "./countryRegionData";

const EURO_COUNTRIES = new Set([
  "AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT",
  "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK",
]);

const CURRENCY_BY_COUNTRY: Record<string, string> = {
  US: "USD",
  CA: "CAD",
  GB: "GBP",
  AU: "AUD",
  NZ: "NZD",
  IE: "EUR",
  CH: "CHF",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  JP: "JPY",
  MX: "MXN",
  BR: "BRL",
  IN: "INR",
  ZA: "ZAR",
  SG: "SGD",
  HK: "HKD",
  PL: "PLN",
  CZ: "CZK",
  IL: "ILS",
  AR: "ARS",
  CL: "CLP",
  CO: "COP",
  UY: "UYU",
};

export const DEFAULT_CURRENCY = "USD";

/** ISO 4217 code for a stored profile country (ISO or full name). */
export function currencyForCountry(country?: string | null): string {
  const iso = lookupCountryIso(country);
  if (!iso) return DEFAULT_CURRENCY;
  if (EURO_COUNTRIES.has(iso)) return "EUR";
  return CURRENCY_BY_COUNTRY[iso] ?? DEFAULT_CURRENCY;
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function formatter(
  currency: string,
  minimumFractionDigits: number,
  maximumFractionDigits: number
): Intl.NumberFormat | null {
  const key = `${currency}:${minimumFractionDigits}:${maximumFractionDigits}`;
  const cached = formatterCache.get(key);
  if (cached) return cached;
  try {
    const next = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    });
    formatterCache.set(key, next);
    return next;
  } catch {
    return null;
  }
}

/**
 * Locale-aware currency string. Whole amounts drop the cents ("$120"),
 * fractional amounts keep them ("$120.50"). `whole` always rounds.
 */
export function formatMoney(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  options?: { whole?: boolean }
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const rounded = Math.round(safe * 100) / 100;
  const isWhole = options?.whole || Number.isInteger(rounded);
  const fmt = formatter(currency, isWhole ? 0 : 2, isWhole ? 0 : 2);
  if (fmt) return fmt.format(options?.whole ? Math.round(rounded) : rounded);
  const body = isWhole ? String(Math.round(rounded)) : rounded.toFixed(2);
  return currency === "USD" ? `$${body}` : `${body} ${currency}`;
}

/** Narrow symbol for input prefixes, e.g. "$", "€", "£". */
export function currencySymbol(currency: string = DEFAULT_CURRENCY): string {
  const fmt = formatter(currency, 0, 0);
  if (!fmt) return "$";
  try {
    const part = fmt
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value;
    return part ?? currency;
  } catch {
    return currency;
  }
}

/** Parse a user-typed amount ("1,250.50", "1250,5") into a number or null. */
export function parseMoneyInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const lastComma = trimmed.lastIndexOf(",");
  const lastDot = trimmed.lastIndexOf(".");
  let normalized = trimmed.replace(/[^\d.,-]/g, "");
  if (lastComma > lastDot) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = normalized.replace(/,/g, "");
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}
