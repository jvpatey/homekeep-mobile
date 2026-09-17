import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PurchasesPackage } from "react-native-purchases";
import { useTheme } from "../../context/ThemeContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { HearthSheet } from "../ui/HearthSheet";
import { HearthSurfaceCard } from "../ui/HearthSurfaceCard";
import { Button } from "../ui/Button";
import { DesignSystem } from "../../theme/designSystem";
import { useDevice, useHaptics } from "../../hooks";
import {
  FALLBACK_MONTHLY_PRICE,
  FALLBACK_YEARLY_PER_MONTH,
  FALLBACK_YEARLY_PRICE,
  HOMEKEEP_PLUS_NAME,
  getPrivacyUrl,
  isExpoGo,
  isStoreManagedStatus,
  monthlyEquivalentLabel,
  packageHasIntroTrial,
  packagePriceLabel,
  plusPlanLabel,
  plusStatusSubtitle,
} from "../../lib/purchases";
import {
  PlusSuccessCelebration,
  PlusSuccessKind,
} from "./PlusSuccessCelebration";

type PlanKey = "yearly" | "monthly";

const VALUE_LINES = [
  "Personalized reminders",
  "Manuals and a shared household",
  "The next cycle, automatically",
];

const COLUMN_MAX = 480;

function formatPlanDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function planStatusMeta({
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
}): {
  pill: string;
  plan: string;
  detailLabel: string | null;
  detailValue: string | null;
  note: string | null;
  tone: "ok" | "trial" | "warning" | "included";
} {
  const plan = plusPlanLabel(productId) ?? HOMEKEEP_PLUS_NAME;
  const dateLabel = expirationDate ? formatPlanDate(expirationDate) : null;
  const daysLabel =
    daysRemaining != null
      ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`
      : null;

  if (includedViaHousehold) {
    return {
      pill: "Included",
      plan: "Household",
      detailLabel: null,
      detailValue: null,
      note: "This home includes HomeKeep + for everyone in the household.",
      tone: "included",
    };
  }

  if (status === "trialing") {
    return {
      pill: "Free trial",
      plan,
      detailLabel: dateLabel ? "Billing starts" : daysLabel ? "Trial" : null,
      detailValue: dateLabel ?? daysLabel,
      note: dateLabel
        ? `You're not charged until ${dateLabel}. Cancel anytime in your store account.`
        : "Cancel anytime in your store account before the trial ends.",
      tone: "trial",
    };
  }

  if (status === "active") {
    return {
      pill: "Active",
      plan,
      detailLabel: dateLabel ? "Renews" : null,
      detailValue: dateLabel,
      note: "Cancel anytime in your Apple or Google account settings.",
      tone: "ok",
    };
  }

  if (status === "grace") {
    return {
      pill: "Billing issue",
      plan,
      detailLabel: "Access",
      detailValue: "Continues while you update payment",
      note: "Update payment in your Apple or Google account to keep HomeKeep +.",
      tone: "warning",
    };
  }

  if (status === "promo") {
    return {
      pill: "Complimentary",
      plan,
      detailLabel: dateLabel ? "Ends" : daysLabel ? "Access" : null,
      detailValue: dateLabel ?? daysLabel,
      note: "Subscribe to keep HomeKeep + after complimentary access ends.",
      tone: "trial",
    };
  }

  return {
    pill: "HomeKeep +",
    plan,
    detailLabel: null,
    detailValue: null,
    note: null,
    tone: "ok",
  };
}

export function PlusPaywallSheet({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { colors } = useTheme();
  const { isRegularWidth } = useDevice();
  const {
    paywallVisible,
    paywallEpoch,
    closePaywall,
    yearlyPackage,
    monthlyPackage,
    offeringsError,
    offeringsLoading,
    reloadOfferings,
    purchasePackage,
    restore,
    purchasing,
    openLegal,
    storeAvailable,
    isPlus,
    status,
    daysRemaining,
    expirationDate,
    productId,
    includedViaHousehold,
    manageSubscription,
    paywallReason,
  } = useSubscription();
  const { triggerLight } = useHaptics();
  const [plan, setPlan] = useState<PlanKey>("yearly");
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [successKind, setSuccessKind] = useState<PlusSuccessKind | null>(null);

  useEffect(() => {
    const label = plusPlanLabel(productId);
    if (label === "Monthly") setPlan("monthly");
    if (label === "Yearly") setPlan("yearly");
  }, [productId, paywallEpoch]);

  const selected: PurchasesPackage | null =
    plan === "yearly" ? yearlyPackage : monthlyPackage;
  const hasTrial = packageHasIntroTrial(selected);
  const canPurchase = Boolean(selected) && storeAvailable && !offeringsError;
  const columnStyle = isRegularWidth ? styles.column : undefined;

  const currentStatus = plusStatusSubtitle({
    status,
    daysRemaining,
    expirationDate,
    productId,
    includedViaHousehold,
  });
  const hasStoreSubscription =
    isPlus && !includedViaHousehold && isStoreManagedStatus(status);
  const manageOnly = includedViaHousehold || hasStoreSubscription;
  const showPurchaseOptions = !manageOnly;
  const statusMeta = planStatusMeta({
    status,
    daysRemaining,
    expirationDate,
    productId,
    includedViaHousehold,
  });
  const ctaLabel = includedViaHousehold
    ? "Close"
    : hasStoreSubscription
      ? "Manage subscription"
      : !storeAvailable
        ? "Requires a development build"
        : hasTrial
          ? "Start 7-day free trial"
          : `Subscribe for ${packagePriceLabel(
              selected,
              plan === "yearly" ? FALLBACK_YEARLY_PRICE : FALLBACK_MONTHLY_PRICE
            )}`;

  const handlePrimary = async () => {
    if (includedViaHousehold) {
      await triggerLight();
      closePaywall();
      return;
    }
    if (hasStoreSubscription) {
      await triggerLight();
      await manageSubscription();
      return;
    }
    if (!selected || purchasing) return;
    await triggerLight();
    const result = await purchasePackage(selected);
    if (result.ok) {
      setSuccessKind(hasTrial ? "trial" : "subscribe");
      return;
    }
    if ("cancelled" in result && result.cancelled) return;
    Alert.alert(
      "Couldn't subscribe",
      result.ok === false && "error" in result
        ? result.error
        : "Please try again."
    );
  };

  const handleRestore = async () => {
    if (purchasing) return;
    await triggerLight();
    setRestoreMessage(null);
    const result = await restore();
    if (result.restored) {
      setSuccessKind("restore");
      return;
    }
    if (result.error) {
      Alert.alert("Couldn't restore", result.error);
      return;
    }
    setRestoreMessage(
      "No subscription to restore on this Apple or Google account."
    );
  };

  const yearlyPrice = packagePriceLabel(yearlyPackage, FALLBACK_YEARLY_PRICE);
  const monthlyPrice = packagePriceLabel(
    monthlyPackage,
    FALLBACK_MONTHLY_PRICE
  );
  const yearlyPerMonth = yearlyPackage
    ? monthlyEquivalentLabel(yearlyPackage) ?? FALLBACK_YEARLY_PER_MONTH
    : FALLBACK_YEARLY_PER_MONTH;
  const afterTrialPrice = packagePriceLabel(
    selected,
    plan === "yearly" ? FALLBACK_YEARLY_PRICE : FALLBACK_MONTHLY_PRICE
  );
  const billingPeriod = plan === "yearly" ? "year" : "month";
  const legalText = hasStoreSubscription
    ? "Change or cancel in your Apple or Google account settings."
    : includedViaHousehold
      ? "HomeKeep + is included with this home."
      : hasTrial
        ? `7-day free trial, then ${afterTrialPrice} per ${billingPeriod}. Renews automatically until you cancel in your Apple or Google account settings.`
        : `${afterTrialPrice} per ${billingPeriod}. Renews automatically until you cancel in your Apple or Google account settings.`;

  const notice = showPurchaseOptions
    ? isExpoGo()
      ? "Store purchases need a development build."
      : offeringsError
    : null;
  const showRetry = showPurchaseOptions && Boolean(offeringsError);

  return (
    <>
    <HearthSheet
      key={paywallEpoch}
      visible={paywallVisible}
      onClose={closePaywall}
      title={HOMEKEEP_PLUS_NAME}
      embedded={embedded}
      keyboardAvoiding={false}
      fillMaxHeight
      maxHeightRatio={isRegularWidth ? 0.72 : 0.86}
      contentStyle={styles.sheetContent}
      accessibilityLabel={HOMEKEEP_PLUS_NAME}
      footer={
        <View style={[styles.footer, columnStyle]}>
          {showRetry ? (
            <Button
              label="Retry"
              onPress={() => void reloadOfferings()}
              loading={offeringsLoading}
              disabled={purchasing}
            />
          ) : (
            <Button
              label={ctaLabel}
              onPress={() => void handlePrimary()}
              loading={purchasing}
              disabled={
                showPurchaseOptions
                  ? purchasing || !canPurchase || offeringsLoading
                  : purchasing
              }
              accessibilityLabel={
                showPurchaseOptions && hasTrial
                  ? `Start 7-day free trial, then ${afterTrialPrice} per ${billingPeriod}`
                  : ctaLabel
              }
            />
          )}
          <Text style={[styles.legal, { color: colors.textSecondary }]}>
            {legalText}
          </Text>
          {restoreMessage ? (
            <Text style={[styles.legal, { color: colors.textSecondary }]}>
              {restoreMessage}
            </Text>
          ) : null}
          <View style={styles.footerLinks}>
            {getPrivacyUrl() ? (
              <FooterLink
                label="Privacy"
                onPress={() => void openLegal("privacy")}
              />
            ) : null}
            <FooterLink
              label="Terms"
              onPress={() => void openLegal("terms")}
            />
            <FooterLink
              label="Restore"
              onPress={() => void handleRestore()}
            />
          </View>
        </View>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={[
          styles.scroll,
          manageOnly ? styles.scrollManage : null,
          columnStyle,
        ]}
      >
        <View style={styles.hero}>
          <Text style={[styles.headline, { color: colors.text }]}>
            {manageOnly
              ? "Your plan"
              : paywallReason === "free_exhausted"
                ? "You’ve handled your first tasks"
                : status === "promo"
                  ? "Subscribe to keep HomeKeep +"
                  : "Try everything for 7 days"}
          </Text>
          {!manageOnly ? (
            <Text style={[styles.subhead, { color: colors.textSecondary }]}>
              {paywallReason === "free_exhausted"
                ? `Unlock ${HOMEKEEP_PLUS_NAME} for unlimited completes, custom tasks, and the full plan.`
                : status === "promo"
                  ? currentStatus
                  : "Reminders, household sharing, and the next cycle. Cancel anytime."}
            </Text>
          ) : null}
        </View>

        {manageOnly ? (
          <PlanStatusCard meta={statusMeta} />
        ) : null}

        {showPurchaseOptions ? (
          <View style={styles.values}>
            {VALUE_LINES.map((line) => (
              <View key={line} style={styles.valueRow}>
                <Ionicons name="checkmark" size={16} color={colors.primary} />
                <Text style={[styles.valueLine, { color: colors.text }]}>
                  {line}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {notice ? (
          <Text style={[styles.notice, { color: colors.textSecondary }]}>
            {notice}
          </Text>
        ) : null}

        {showPurchaseOptions ? (
          <HearthSurfaceCard style={styles.planGroup}>
            <PlanRow
              selected={plan === "yearly"}
              title="Yearly"
              price={yearlyPrice}
              detail={`${yearlyPerMonth}/mo${packageHasIntroTrial(yearlyPackage) ? " · 7 days free" : ""}`}
              badge="Best value"
              disabled={purchasing}
              showDivider
              onSelect={() => {
                void triggerLight();
                setPlan("yearly");
              }}
            />
            <PlanRow
              selected={plan === "monthly"}
              title="Monthly"
              price={monthlyPrice}
              detail={`Billed monthly${packageHasIntroTrial(monthlyPackage) ? " · 7 days free" : ""}`}
              disabled={purchasing}
              showDivider={false}
              onSelect={() => {
                void triggerLight();
                setPlan("monthly");
              }}
            />
          </HearthSurfaceCard>
        ) : null}
      </ScrollView>
    </HearthSheet>
    <PlusSuccessCelebration
      isVisible={successKind != null}
      kind={successKind ?? "subscribe"}
      onClose={() => setSuccessKind(null)}
    />
    </>
  );
}

function PlanStatusCard({
  meta,
}: {
  meta: ReturnType<typeof planStatusMeta>;
}) {
  const { colors } = useTheme();
  const pillColor =
    meta.tone === "warning"
      ? colors.warning
      : meta.tone === "included"
        ? colors.secondary
        : colors.primary;
  const pillIcon =
    meta.tone === "warning"
      ? ("alert-circle" as const)
      : meta.tone === "included"
        ? ("people" as const)
        : meta.tone === "trial"
          ? ("gift" as const)
          : ("sparkles" as const);

  return (
    <HearthSurfaceCard style={styles.statusCard}>
      <View style={styles.statusHeader}>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: colors.glassTint,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          <Ionicons name={pillIcon} size={14} color={pillColor} />
          <Text style={[styles.statusPillText, { color: pillColor }]}>
            {meta.pill}
          </Text>
        </View>
        <Text style={[styles.statusPlanName, { color: colors.text }]}>
          {meta.plan}
        </Text>
      </View>

      {meta.detailLabel && meta.detailValue ? (
        <View
          style={[
            styles.statusDetailBlock,
            { borderTopColor: colors.border },
          ]}
        >
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
            {meta.detailLabel}
          </Text>
          <Text style={[styles.statusDetailValue, { color: colors.text }]}>
            {meta.detailValue}
          </Text>
        </View>
      ) : null}

      {meta.note ? (
        <Text
          style={[
            styles.statusNote,
            {
              color: colors.textSecondary,
              borderTopColor: colors.border,
              borderTopWidth:
                meta.detailLabel && meta.detailValue
                  ? 0
                  : StyleSheet.hairlineWidth,
              paddingTop:
                meta.detailLabel && meta.detailValue
                  ? 0
                  : DesignSystem.spacing.md,
            },
          ]}
        >
          {meta.note}
        </Text>
      ) : null}
    </HearthSurfaceCard>
  );
}

function PlanRow({
  selected,
  title,
  price,
  detail,
  badge,
  disabled,
  showDivider,
  onSelect,
}: {
  selected: boolean;
  title: string;
  price: string;
  detail: string;
  badge?: string;
  disabled: boolean;
  showDivider: boolean;
  onSelect: () => void;
}) {
  const { colors } = useTheme();
  const a11y = [title, price, detail, badge ?? null, selected ? "selected" : null]
    .filter(Boolean)
    .join(", ");

  return (
    <Pressable
      onPress={onSelect}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={a11y}
      style={[
        styles.planRow,
        showDivider && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.radio,
          {
            borderColor: selected ? colors.primary : colors.border,
            backgroundColor: selected ? colors.primary : "transparent",
          },
        ]}
      />
      <View style={styles.planCopy}>
        <View style={styles.planTitleRow}>
          <Text style={[styles.planTitle, { color: colors.text }]}>{title}</Text>
          {badge ? (
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {badge}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.planDetail, { color: colors.textSecondary }]}>
          {detail}
        </Text>
      </View>
      <Text style={[styles.planPrice, { color: colors.text }]}>{price}</Text>
    </Pressable>
  );
}

function FooterLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={styles.footerLink}
    >
      <Text style={[styles.footerLinkText, { color: colors.primary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 0,
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.lg,
    flexGrow: 1,
  },
  scrollManage: {
    gap: DesignSystem.spacing.md,
  },
  column: {
    width: "100%",
    maxWidth: COLUMN_MAX,
    alignSelf: "center",
  },
  hero: {
    gap: DesignSystem.spacing.xs,
  },
  headline: {
    ...DesignSystem.typography.title2,
  },
  subhead: {
    ...DesignSystem.typography.callout,
  },
  statusCard: {
    padding: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.md,
  },
  statusHeader: {
    gap: DesignSystem.spacing.sm,
  },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusPillText: {
    ...DesignSystem.typography.captionSemiBold,
  },
  statusPlanName: {
    ...DesignSystem.typography.title2,
  },
  statusDetailBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.xs,
  },
  statusLabel: {
    ...DesignSystem.typography.footnote,
  },
  statusDetailValue: {
    ...DesignSystem.typography.callout,
    fontWeight: "600",
  },
  statusNote: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
  },
  values: {
    gap: DesignSystem.spacing.sm,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  valueLine: {
    ...DesignSystem.typography.callout,
    flex: 1,
  },
  notice: {
    ...DesignSystem.typography.footnote,
  },
  planGroup: {
    overflow: "hidden",
    paddingVertical: DesignSystem.spacing.xs,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: DesignSystem.components.minTouchTarget,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  planCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  planTitle: {
    ...DesignSystem.typography.smallSemiBold,
  },
  badgeText: {
    ...DesignSystem.typography.captionSemiBold,
  },
  planDetail: {
    ...DesignSystem.typography.caption,
  },
  planPrice: {
    ...DesignSystem.typography.bodySemiBold,
  },
  legal: {
    ...DesignSystem.typography.caption,
    textAlign: "center",
  },
  footer: {
    gap: DesignSystem.spacing.sm,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.lg,
  },
  footerLink: {
    paddingVertical: DesignSystem.spacing.xs,
  },
  footerLinkText: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
  },
});
