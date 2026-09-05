import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { PurchasesPackage } from "react-native-purchases";
import { useTheme } from "../../context/ThemeContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { HearthSheet } from "../ui/HearthSheet";
import { HearthSurfaceCard } from "../ui/HearthSurfaceCard";
import { Button, TextLink } from "../ui/Button";
import { HouseMark } from "../ui/HouseMark";
import { DesignSystem } from "../../theme/designSystem";
import { useHaptics } from "../../hooks";
import {
  FALLBACK_MONTHLY_PRICE,
  FALLBACK_YEARLY_PER_MONTH,
  FALLBACK_YEARLY_PRICE,
  HOMEKEEP_PLUS_NAME,
  getPrivacyUrl,
  isExpoGo,
  monthlyEquivalentLabel,
  packageHasIntroTrial,
} from "../../lib/purchases";

type PlanKey = "yearly" | "monthly";

const VALUE_LINES = [
  "Personalized reminders for this home",
  "Equipment manuals and a shared household",
  "The next cycle of the schedule, automatically",
];

export function PlusPaywallSheet() {
  const { colors } = useTheme();
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
  } = useSubscription();
  const { triggerLight, triggerSuccess } = useHaptics();
  const [plan, setPlan] = useState<PlanKey>("yearly");
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const selected: PurchasesPackage | null =
    plan === "yearly" ? yearlyPackage : monthlyPackage;
  const hasTrial = packageHasIntroTrial(selected);
  const canPurchase = Boolean(selected) && storeAvailable && !offeringsError;

  const ctaLabel = !storeAvailable
    ? "Requires a development build"
    : hasTrial
      ? "Start 7-day free trial"
      : selected
        ? `Subscribe for ${selected.product.priceString}`
        : `Subscribe for ${plan === "yearly" ? FALLBACK_YEARLY_PRICE : FALLBACK_MONTHLY_PRICE}`;

  const handlePurchase = async () => {
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

  const yearlyPrice = yearlyPackage?.product.priceString ?? FALLBACK_YEARLY_PRICE;
  const monthlyPrice =
    monthlyPackage?.product.priceString ?? FALLBACK_MONTHLY_PRICE;
  const yearlyPerMonth = yearlyPackage
    ? monthlyEquivalentLabel(yearlyPackage) ?? FALLBACK_YEARLY_PER_MONTH
    : FALLBACK_YEARLY_PER_MONTH;

  return (
    <HearthSheet
      key={paywallEpoch}
      visible={paywallVisible}
      onClose={closePaywall}
      title={HOMEKEEP_PLUS_NAME}
      keyboardAvoiding={false}
      fillMaxHeight
      maxHeightRatio={0.92}
      contentStyle={styles.sheetContent}
      accessibilityLabel={HOMEKEEP_PLUS_NAME}
      footer={
        <View style={styles.footer}>
          {offeringsError ? (
            <Button
              label="Retry"
              onPress={() => void reloadOfferings()}
              loading={offeringsLoading}
              disabled={purchasing}
            />
          ) : (
            <Button
              label={ctaLabel}
              onPress={() => void handlePurchase()}
              loading={purchasing}
              disabled={purchasing || !canPurchase || offeringsLoading}
              accessibilityLabel={
                hasTrial
                  ? `Start 7-day free trial, then ${selected?.product.priceString ?? FALLBACK_YEARLY_PRICE} per year`
                  : ctaLabel
              }
            />
          )}
          <Button
            label="Restore purchases"
            variant="ghost"
            onPress={() => void handleRestore()}
            disabled={purchasing}
          />
          <Button
            label="Not now"
            variant="ghost"
            onPress={closePaywall}
          />
        </View>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.hero}>
          <HouseMark size={44} />
          <Text style={[styles.headline, { color: colors.text }]}>
            Keep this home on schedule
          </Text>
          <Text style={[styles.subhead, { color: colors.textSecondary }]}>
            One home, including anyone you invite. Cancel anytime.
          </Text>
        </View>

        <View style={styles.values}>
          {VALUE_LINES.map((line) => (
            <Text
              key={line}
              style={[styles.valueLine, { color: colors.text }]}
            >
              {line}
            </Text>
          ))}
        </View>

        {isExpoGo() ? (
          <Text style={[styles.notice, { color: colors.textSecondary }]}>
            Store purchases need a development build. You can still preview this
            sheet in Expo Go.
          </Text>
        ) : null}

        {offeringsError ? (
          <Text style={[styles.notice, { color: colors.textSecondary }]}>
            {offeringsError}
          </Text>
        ) : (
          <View style={styles.plans}>
            <PlanCard
              selected={plan === "yearly"}
              title="Yearly"
              price={yearlyPrice}
              detail={`${yearlyPerMonth}/mo`}
              badge="Best value"
              trial={packageHasIntroTrial(yearlyPackage)}
              disabled={purchasing}
              onSelect={() => {
                void triggerLight();
                setPlan("yearly");
              }}
            />
            <PlanCard
              selected={plan === "monthly"}
              title="Monthly"
              price={monthlyPrice}
              detail="Billed monthly"
              trial={packageHasIntroTrial(monthlyPackage)}
              disabled={purchasing}
              onSelect={() => {
                void triggerLight();
                setPlan("monthly");
              }}
            />
          </View>
        )}

        {restoreMessage ? (
          <Text style={[styles.notice, { color: colors.textSecondary }]}>
            {restoreMessage}
          </Text>
        ) : null}

        <Text style={[styles.legal, { color: colors.textSecondary }]}>
          {HOMEKEEP_PLUS_NAME} renews automatically at the selected price until
          you cancel. Payment is charged to your Apple ID or Google account.
          Manage or cancel anytime in your store account settings.
        </Text>
        <View style={styles.legalLinks}>
          {getPrivacyUrl() ? (
            <TextLink
              linkText="Privacy Policy"
              onPress={() => void openLegal("privacy")}
            />
          ) : null}
          <TextLink
            linkText="Terms of Use"
            onPress={() => void openLegal("terms")}
          />
        </View>
      </ScrollView>
    </HearthSheet>
  );
}

function PlanCard({
  selected,
  title,
  price,
  detail,
  badge,
  trial,
  disabled,
  onSelect,
}: {
  selected: boolean;
  title: string;
  price: string;
  detail: string;
  badge?: string;
  trial: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const { colors } = useTheme();
  const a11y = [
    title,
    price,
    detail,
    trial ? "7-day free trial" : null,
    badge ?? null,
    selected ? "selected" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Pressable
      onPress={onSelect}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={a11y}
    >
      <HearthSurfaceCard
        style={[
          styles.planCard,
          selected && {
            borderColor: colors.primary,
            borderWidth: 2,
          },
        ]}
      >
        <View style={styles.planTop}>
          <Text style={[styles.planTitle, { color: colors.text }]}>{title}</Text>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: `${colors.primary}18` }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.planPrice, { color: colors.text }]}>{price}</Text>
        <Text style={[styles.planDetail, { color: colors.textSecondary }]}>
          {detail}
          {trial ? " · 7 days free" : ""}
        </Text>
        <View
          style={[
            styles.radio,
            {
              borderColor: selected ? colors.primary : colors.border,
              backgroundColor: selected ? colors.primary : "transparent",
            },
          ]}
        />
      </HearthSurfaceCard>
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
  },
  hero: {
    alignItems: "center",
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
  },
  headline: {
    ...DesignSystem.typography.title2,
    textAlign: "center",
  },
  subhead: {
    ...DesignSystem.typography.callout,
    textAlign: "center",
  },
  values: {
    gap: DesignSystem.spacing.xs,
    marginBottom: DesignSystem.spacing.lg,
  },
  valueLine: {
    ...DesignSystem.typography.callout,
  },
  notice: {
    ...DesignSystem.typography.footnote,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  plans: {
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.lg,
  },
  planCard: {
    padding: DesignSystem.spacing.md,
  },
  planTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: DesignSystem.spacing.sm,
  },
  planTitle: {
    ...DesignSystem.typography.smallSemiBold,
  },
  badge: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 2,
    borderRadius: DesignSystem.borders.radius.round,
  },
  badgeText: {
    ...DesignSystem.typography.captionSemiBold,
  },
  planPrice: {
    ...DesignSystem.typography.h3,
    marginTop: DesignSystem.spacing.xs,
  },
  planDetail: {
    ...DesignSystem.typography.footnote,
    marginTop: 2,
  },
  radio: {
    position: "absolute",
    right: DesignSystem.spacing.md,
    bottom: DesignSystem.spacing.md,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  legal: {
    ...DesignSystem.typography.footnote,
    textAlign: "center",
  },
  legalLinks: {
    flexDirection: "row",
    justifyContent: "center",
    gap: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.xs,
  },
  footer: {
    gap: DesignSystem.spacing.xs,
  },
});
