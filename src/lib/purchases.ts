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

export const FALLBACK_MONTHLY_PRICE = "$5.99";
export const FALLBACK_YEARLY_PRICE = "$39.99";
export const FALLBACK_YEARLY_PER_MONTH = "$3.33";

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
  return Constants.appOwnership === "expo";
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
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: pkg.product.currencyCode,
      maximumFractionDigits: 2,
    }).format(perMonth);
  } catch {
    return `$${(Math.round(perMonth * 100) / 100).toFixed(2)}`;
  }
}

let configureStarted = false;

export function configurePurchases(): boolean {
  const apiKey = getRcApiKey();
  if (!apiKey || configureStarted) return configureStarted && Boolean(apiKey);
  configureStarted = true;
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
  Purchases.configure({ apiKey });
  return true;
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
