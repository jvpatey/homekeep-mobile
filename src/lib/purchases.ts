import { Linking, Platform } from "react-native";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  PurchasesError,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

/** Customer-facing name. Never "Plus" in UI. */
export const HOMEKEEP_PLUS_NAME = "HomeKeep +";

export const HOMEKEEP_PLUS_ENTITLEMENT = "homekeep_plus";
export const HOMEKEEP_PLUS_MONTHLY_ID = "homekeep_plus_monthly";
export const HOMEKEEP_PLUS_YEARLY_ID = "homekeep_plus_yearly";

/** Fallbacks when the store has not returned a localized price yet. CAD. */
export const FALLBACK_MONTHLY_PRICE = "CA$5.99";
export const FALLBACK_YEARLY_PRICE = "CA$29.99";
export const FALLBACK_YEARLY_PER_MONTH = "CA$2.50";
const STORE_CURRENCY = "CAD";

/** Show CAD explicitly so a bare "$" is not read as USD. */
export function displayPrice(
  priceString: string | null | undefined,
  currencyCode?: string | null
): string {
  const raw = (priceString ?? "").trim();
  const code = (currencyCode ?? STORE_CURRENCY).toUpperCase();
  if (!raw) return FALLBACK_YEARLY_PRICE;
  if (code === "CAD") {
    if (/CA\$|CAD/i.test(raw)) return raw;
    if (raw.startsWith("C$")) return `CA$${raw.slice(2)}`;
    if (raw.startsWith("$")) return `CA${raw}`;
    return `${raw} CAD`;
  }
  if (raw.includes(code)) return raw;
  return `${raw} ${code}`;
}

export function packagePriceLabel(
  pkg: PurchasesPackage | null,
  fallback: string
): string {
  if (!pkg) return displayPrice(fallback, STORE_CURRENCY);
  return displayPrice(pkg.product.priceString, pkg.product.currencyCode);
}

export type PlusPlanLabel = "Yearly" | "Monthly";

export function plusPlanLabel(productId: string | null): PlusPlanLabel | null {
  if (!productId) return null;
  if (
    productId === HOMEKEEP_PLUS_YEARLY_ID ||
    productId.includes("yearly") ||
    productId.includes("annual")
  ) {
    return "Yearly";
  }
  if (
    productId === HOMEKEEP_PLUS_MONTHLY_ID ||
    productId.includes("monthly")
  ) {
    return "Monthly";
  }
  return null;
}

export function plusStatusSubtitle({
  status,
  daysRemaining,
  expirationDate,
  productId,
  includedViaHousehold,
}: {
  status: string;
  daysRemaining: number | null;
  expirationDate: Date | null;
  productId: string | null;
  includedViaHousehold: boolean;
}): string {
  if (includedViaHousehold) return "Included with this home";
  const plan = plusPlanLabel(productId);
  const days =
    daysRemaining != null
      ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`
      : null;
  const renews = expirationDate
    ? `Renews ${expirationDate.toLocaleDateString()}`
    : null;

  if (status === "trialing") {
    const trial = days ? `Free trial · ${days}` : "Free trial";
    return plan ? `${plan} · ${trial}` : trial;
  }
  if (status === "promo") {
    const promo = days ? `Complimentary · ${days}` : "Complimentary access";
    return plan ? `${plan} · ${promo}` : promo;
  }
  if (status === "grace") {
    return plan
      ? `${plan} · Billing issue · access continues`
      : "Billing issue · access continues";
  }
  if (status === "active") {
    if (plan && renews) return `${plan} · ${renews}`;
    if (plan) return plan;
    if (renews) return renews;
    return HOMEKEEP_PLUS_NAME;
  }
  if (status === "expired") {
    return plan ? `${plan} · Expired` : "Expired";
  }
  return `Not subscribed · ${FALLBACK_YEARLY_PRICE}/year or ${FALLBACK_MONTHLY_PRICE}/month`;
}

const APPLE_STANDARD_EULA =
  "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

export function getRcApiKey(): string {
  const key =
    Platform.OS === "ios"
      ? (process.env.EXPO_PUBLIC_RC_IOS_API_KEY ?? "").trim()
      : (process.env.EXPO_PUBLIC_RC_ANDROID_API_KEY ?? "").trim();
  return key;
}

export function getPrivacyUrl(): string {
  return (process.env.EXPO_PUBLIC_LEGAL_PRIVACY_URL ?? "").trim();
}

export function getTermsUrl(): string {
  return (
    (process.env.EXPO_PUBLIC_LEGAL_TERMS_URL ?? "").trim() || APPLE_STANDARD_EULA
  );
}

export function isExpoGo(): boolean {
  return (
    Constants.appOwnership === "expo" ||
    Constants.executionEnvironment === "storeClient"
  );
}

export function isPurchasesError(error: unknown): error is PurchasesError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

export function isPurchaseCancelled(error: unknown): boolean {
  if (!isPurchasesError(error)) return false;
  return (
    error.userCancelled === true ||
    error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
  );
}

export function packageHasIntroTrial(pkg: PurchasesPackage | null): boolean {
  if (!pkg) return false;
  const intro = pkg.product.introPrice;
  if (!intro) return false;
  return intro.price === 0 || intro.periodNumberOfUnits > 0;
}

export function pickYearlyPackage(
  offering: PurchasesOffering | null
): PurchasesPackage | null {
  if (!offering) return null;
  const byId = offering.availablePackages.find(
    (pkg) => pkg.product.identifier === HOMEKEEP_PLUS_YEARLY_ID
  );
  return byId ?? offering.annual ?? null;
}

export function pickMonthlyPackage(
  offering: PurchasesOffering | null
): PurchasesPackage | null {
  if (!offering) return null;
  const byId = offering.availablePackages.find(
    (pkg) => pkg.product.identifier === HOMEKEEP_PLUS_MONTHLY_ID
  );
  return byId ?? offering.monthly ?? null;
}

export function monthlyEquivalentLabel(pkg: PurchasesPackage): string | null {
  const price = pkg.product.price;
  if (!price || price <= 0) return null;
  const perMonth = price / 12;
  const code = pkg.product.currencyCode || STORE_CURRENCY;
  try {
    const formatted = new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(perMonth);
    return displayPrice(formatted, code);
  } catch {
    return displayPrice(
      `$${(Math.round(perMonth * 100) / 100).toFixed(2)}`,
      code
    );
  }
}

let configureStarted = false;
let configureSucceeded = false;

export function configurePurchases(): boolean {
  if (configureStarted) return configureSucceeded;
  if (isExpoGo()) {
    configureStarted = true;
    configureSucceeded = false;
    return false;
  }
  const apiKey = getRcApiKey();
  if (!apiKey) return false;
  configureStarted = true;
  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    Purchases.configure({ apiKey });
    configureSucceeded = true;
  } catch (error) {
    configureSucceeded = false;
    if (__DEV__) {
      console.warn("Purchases.configure skipped", error);
    }
  }
  return configureSucceeded;
}

export async function logOutPurchases(): Promise<void> {
  try {
    if (await Purchases.isConfigured()) {
      await Purchases.logOut();
    }
  } catch {
    // Already anonymous or SDK not configured
  }
}

export async function openLegalUrl(kind: "privacy" | "terms"): Promise<void> {
  const url = kind === "privacy" ? getPrivacyUrl() : getTermsUrl();
  if (!url) return;
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    await Linking.openURL(url);
  }
}

export async function openManageSubscriptions(): Promise<void> {
  const url =
    Platform.OS === "ios"
      ? "https://apps.apple.com/account/subscriptions"
      : "https://play.google.com/store/account/subscriptions";
  await Linking.openURL(url);
}
