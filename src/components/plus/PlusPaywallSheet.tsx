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

type PlanKey = "yearly" | "monthly";

const VALUE_LINES = [
  "Personalized reminders",
  "Manuals and a shared household",
  "The next cycle, automatically",
];

const COLUMN_MAX = 480;

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
  } = useSubscription();
  const { triggerLight, triggerSuccess } = useHaptics();
  const [plan, setPlan] = useState<PlanKey>("yearly");
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

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
  const planNote =
    hasStoreSubscription && status === "trialing" && expirationDate
      ? `This is a free trial on your ${plusPlanLabel(productId) ?? "HomeKeep +"} plan. Billing starts ${expirationDate.toLocaleDateString()} unless you cancel.`
      : hasStoreSubscription && status === "active" && expirationDate
        ? `Renews ${expirationDate.toLocaleDateString()}. Cancel anytime in your store account.`
        : hasStoreSubscription && status === "grace"
          ? "There's a billing issue. Access continues while you update payment in your store account."
          : includedViaHousehold
            ? "This home includes HomeKeep + for everyone in the household."
            : status === "promo" && expirationDate
              ? `Complimentary access ends ${expirationDate.toLocaleDateString()}. Subscribe to keep HomeKeep +.`
              : status === "promo"
                ? "Subscribe to keep HomeKeep + after complimentary access ends."
                : null;
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
      triggerSuccess();
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
      triggerSuccess();
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
        contentContainerStyle={[styles.scroll, columnStyle]}
      >
        <View style={styles.hero}>
          <Text style={[styles.headline, { color: colors.text }]}>
            {manageOnly
              ? "Your plan"
              : status === "promo"
                ? "Subscribe to keep HomeKeep +"
                : "Try everything for 7 days"}
          </Text>
          <Text style={[styles.subhead, { color: colors.textSecondary }]}>
            {manageOnly || status === "promo"
              ? currentStatus
              : "Reminders, household sharing, and the next cycle. Cancel anytime."}
          </Text>
          {planNote ? (
            <Text style={[styles.subhead, { color: colors.textSecondary }]}>
              {planNote}
            </Text>
          ) : null}
        </View>

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
