import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";
import { useAuth, supabase } from "./AuthContext";
import { useProfile } from "./ProfileContext";
import {
  HOMEKEEP_PLUS_ENTITLEMENT,
  configurePurchases,
  getRcApiKey,
  isExpoGo,
  isPurchaseCancelled,
  logOutPurchases,
  openLegalUrl,
  openManageSubscriptions,
  pickMonthlyPackage,
  pickYearlyPackage,
} from "../lib/purchases";

export type EntitlementStatus =
  | "none"
  | "trialing"
  | "active"
  | "grace"
  | "promo"
  | "expired";

export type EntitlementRow = {
  user_id: string;
  household_id: string | null;
  status: EntitlementStatus;
  store: string | null;
  product_id: string | null;
  expires_at: string | null;
  revenuecat_app_user_id: string | null;
};

type PurchaseResult =
  | { ok: true }
  | { ok: false; cancelled: true }
  | { ok: false; cancelled?: false; error: string };

type RestoreResult =
  | { restored: true }
  | { restored: false; error?: string };

interface SubscriptionContextValue {
  isPlus: boolean;
  isTrialing: boolean;
  status: EntitlementStatus;
  expirationDate: Date | null;
  productId: string | null;
  includedViaHousehold: boolean;
  loading: boolean;
  purchasing: boolean;
  storeAvailable: boolean;
  paywallVisible: boolean;
  paywallEpoch: number;
  yearlyPackage: PurchasesPackage | null;
  monthlyPackage: PurchasesPackage | null;
  offeringsError: string | null;
  offeringsLoading: boolean;
  daysRemaining: number | null;
  presentPaywall: () => Promise<boolean>;
  closePaywall: () => void;
  offerPaywallAfterSetup: () => void;
  reloadOfferings: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<PurchaseResult>;
  restore: () => Promise<RestoreResult>;
  refresh: () => Promise<void>;
  manageSubscription: () => Promise<void>;
  openLegal: (kind: "privacy" | "terms") => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
  undefined
);

const ACTIVE: EntitlementStatus[] = [
  "trialing",
  "active",
  "grace",
  "promo",
];

function rcHasPlus(info: CustomerInfo | null): boolean {
  return Boolean(info?.entitlements.active[HOMEKEEP_PLUS_ENTITLEMENT]);
}

function rcTrialing(info: CustomerInfo | null): boolean {
  const ent = info?.entitlements.active[HOMEKEEP_PLUS_ENTITLEMENT];
  return ent?.periodType === "TRIAL";
}

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  const ms = date.getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86_400_000);
}

function parseExpiration(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [remote, setRemote] = useState<EntitlementRow | null>(null);
  const [rpcPlus, setRpcPlus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallEpoch, setPaywallEpoch] = useState(0);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [offeringsError, setOfferingsError] = useState<string | null>(null);
  const [offeringsLoading, setOfferingsLoading] = useState(false);

  const paywallResolverRef = useRef<((entitled: boolean) => void) | null>(
    null
  );
  const setupPaywallShownRef = useRef(false);
  const purchasingRef = useRef(false);
  const isPlusRef = useRef(false);

  const storeAvailable = Boolean(getRcApiKey()) && !isExpoGo();

  const fetchRemote = useCallback(async () => {
    if (!supabase || !user) {
      setRemote(null);
      setRpcPlus(false);
      return;
    }
    const [rpc, rows] = await Promise.all([
      supabase.rpc("current_user_has_plus"),
      supabase
        .from("entitlements")
        .select(
          "user_id, household_id, status, store, product_id, expires_at, revenuecat_app_user_id"
        ),
    ]);
    if (rpc.error && __DEV__) {
      console.warn("current_user_has_plus", rpc.error.message);
    }
    if (rows.error && __DEV__) {
      console.warn("entitlements select", rows.error.message);
    }
    if (typeof rpc.data === "boolean") {
      setRpcPlus(rpc.data);
    } else {
      setRpcPlus(false);
    }
    const list = (rows.data ?? []) as EntitlementRow[];
    const mine = list.find((row) => row.user_id === user.id);
    const household = list.find(
      (row) =>
        row.user_id !== user.id &&
        ACTIVE.includes(row.status) &&
        (!row.expires_at || new Date(row.expires_at) > new Date())
    );
    setRemote(mine ?? household ?? null);
  }, [user]);

  const applyCustomerInfo = useCallback((info: CustomerInfo) => {
    setCustomerInfo(info);
  }, []);

  const identify = useCallback(
    async (userId: string) => {
      if (!configurePurchases()) return;
      try {
        const { customerInfo: info } = await Purchases.logIn(userId);
        applyCustomerInfo(info);
      } catch (error) {
        if (__DEV__) {
          console.warn("Purchases.logIn failed", error);
        }
      }
    },
    [applyCustomerInfo]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (user && configurePurchases()) {
        try {
          const info = await Purchases.getCustomerInfo();
          applyCustomerInfo(info);
        } catch (error) {
          if (__DEV__) {
            console.warn("getCustomerInfo failed", error);
          }
        }
      } else {
        setCustomerInfo(null);
      }
      await fetchRemote();
    } finally {
      setLoading(false);
    }
  }, [applyCustomerInfo, fetchRemote, user]);

  useEffect(() => {
    configurePurchases();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user) {
        setCustomerInfo(null);
        setRemote(null);
        setRpcPlus(false);
        setLoading(false);
        await logOutPurchases();
        return;
      }
      await identify(user.id);
      if (!cancelled) {
        await fetchRemote();
        setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [fetchRemote, identify, user?.id]);

  useEffect(() => {
    if (!configurePurchases()) return;
    const listener = (info: CustomerInfo) => {
      applyCustomerInfo(info);
      void fetchRemote();
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [applyCustomerInfo, fetchRemote]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === "active" && user) {
        void refresh();
      }
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [refresh, user]);

  const rcPlus = rcHasPlus(customerInfo);
  const rcTrial = rcTrialing(customerInfo);
  const remoteActive =
    remote != null &&
    ACTIVE.includes(remote.status) &&
    (!remote.expires_at || new Date(remote.expires_at) > new Date());

  const isPlus = rcPlus || rpcPlus || remoteActive;
  isPlusRef.current = isPlus;

  const includedViaHousehold = Boolean(
    isPlus &&
      remote &&
      user &&
      remote.user_id !== user.id
  );

  const status: EntitlementStatus = rcTrial
    ? "trialing"
    : rcPlus
      ? "active"
      : remoteActive
        ? remote!.status
        : remote?.status === "expired"
          ? "expired"
          : "none";

  const expirationDate =
    parseExpiration(
      customerInfo?.entitlements.active[HOMEKEEP_PLUS_ENTITLEMENT]
        ?.expirationDate
    ) ?? parseExpiration(remote?.expires_at);

  const productId =
    customerInfo?.entitlements.active[HOMEKEEP_PLUS_ENTITLEMENT]?.productIdentifier ??
    remote?.product_id ??
    null;

  const resolvePaywall = useCallback((entitled: boolean) => {
    const resolve = paywallResolverRef.current;
    paywallResolverRef.current = null;
    resolve?.(entitled);
  }, []);

  const closePaywall = useCallback(() => {
    purchasingRef.current = false;
    setPurchasing(false);
    setPaywallVisible(false);
    resolvePaywall(isPlusRef.current);
  }, [resolvePaywall]);

  const reloadOfferings = useCallback(async () => {
    if (!configurePurchases()) {
      setOfferingsError(
        isExpoGo()
          ? "Subscriptions need a development build — Expo Go cannot complete a store purchase."
          : "RevenueCat API keys are not configured."
      );
      setOffering(null);
      return;
    }
    setOfferingsLoading(true);
    setOfferingsError(null);
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current || current.availablePackages.length === 0) {
        setOffering(null);
        setOfferingsError(
          "Plans are not available right now. Check your connection and try again."
        );
        return;
      }
      setOffering(current);
    } catch (error) {
      setOffering(null);
      setOfferingsError(
        isPurchaseCancelled(error)
          ? null
          : "Could not load plans. Check your connection and try again."
      );
    } finally {
      setOfferingsLoading(false);
    }
  }, []);

  const presentPaywall = useCallback(async () => {
    if (isPlusRef.current) return true;
    setPaywallEpoch((n) => n + 1);
    setPaywallVisible(true);
    void reloadOfferings();
    return new Promise<boolean>((resolve) => {
      paywallResolverRef.current = resolve;
    });
  }, [reloadOfferings]);

  const offerPaywallAfterSetup = useCallback(() => {
    if (isPlusRef.current || setupPaywallShownRef.current) return;
    setupPaywallShownRef.current = true;
    void presentPaywall();
  }, [presentPaywall]);

  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage): Promise<PurchaseResult> => {
      if (purchasingRef.current) {
        return { ok: false, error: "A purchase is already in progress." };
      }
      if (isExpoGo() || !configurePurchases()) {
        return {
          ok: false,
          error:
            "Subscriptions need a development build. Expo Go cannot complete a store purchase.",
        };
      }
      purchasingRef.current = true;
      setPurchasing(true);
      try {
        const { customerInfo: info } = await Purchases.purchasePackage(pkg);
        applyCustomerInfo(info);
        await fetchRemote();
        if (rcHasPlus(info) || isPlusRef.current) {
          isPlusRef.current = true;
          setPaywallVisible(false);
          resolvePaywall(true);
          return { ok: true };
        }
        return {
          ok: false,
          error: "Purchase finished but HomeKeep + is not active yet.",
        };
      } catch (error) {
        if (isPurchaseCancelled(error)) {
          return { ok: false, cancelled: true };
        }
        const message = isPurchasesErrorMessage(error);
        return { ok: false, error: message };
      } finally {
        purchasingRef.current = false;
        setPurchasing(false);
      }
    },
    [applyCustomerInfo, fetchRemote, resolvePaywall]
  );

  const restore = useCallback(async (): Promise<RestoreResult> => {
    if (purchasingRef.current) {
      return { restored: false, error: "Please wait for the current purchase." };
    }
    if (isExpoGo() || !configurePurchases()) {
      return {
        restored: false,
        error:
          "Restore needs a development build. Expo Go cannot talk to the store.",
      };
    }
    purchasingRef.current = true;
    setPurchasing(true);
    try {
      const info = await Purchases.restorePurchases();
      applyCustomerInfo(info);
      await fetchRemote();
      if (rcHasPlus(info)) {
        isPlusRef.current = true;
        setPaywallVisible(false);
        resolvePaywall(true);
        return { restored: true };
      }
      return { restored: false };
    } catch (error) {
      if (isPurchaseCancelled(error)) {
        return { restored: false };
      }
      return { restored: false, error: isPurchasesErrorMessage(error) };
    } finally {
      purchasingRef.current = false;
      setPurchasing(false);
    }
  }, [applyCustomerInfo, fetchRemote, resolvePaywall]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      isPlus,
      isTrialing: status === "trialing",
      status,
      expirationDate,
      productId,
      includedViaHousehold,
      loading,
      purchasing,
      storeAvailable,
      paywallVisible,
      paywallEpoch,
      yearlyPackage: pickYearlyPackage(offering),
      monthlyPackage: pickMonthlyPackage(offering),
      offeringsError,
      offeringsLoading,
      daysRemaining: daysUntil(expirationDate),
      presentPaywall,
      closePaywall,
      offerPaywallAfterSetup,
      reloadOfferings,
      purchasePackage,
      restore,
      refresh,
      manageSubscription: openManageSubscriptions,
      openLegal: openLegalUrl,
    }),
    [
      closePaywall,
      expirationDate,
      includedViaHousehold,
      isPlus,
      loading,
      offerPaywallAfterSetup,
      offering,
      offeringsError,
      offeringsLoading,
      paywallEpoch,
      paywallVisible,
      presentPaywall,
      productId,
      purchasePackage,
      purchasing,
      refresh,
      reloadOfferings,
      restore,
      status,
      storeAvailable,
    ]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

function isPurchasesErrorMessage(error: unknown): string {
  if (typeof error === "object" && error && "message" in error) {
    const message = String((error as { message: unknown }).message);
    if (message.trim()) return message;
  }
  return "Something went wrong. Please try again.";
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
