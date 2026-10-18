import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { format } from "date-fns";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { useRecordData } from "../../hooks/useRecordData";
import { useCurrency } from "../../hooks/useCurrency";
import { useSignedPhotoUrls } from "../../hooks/useSignedPhotoUrls";
import { useHaptics } from "../../hooks";
import {
  Button,
  EmptyState,
  HearthSurfaceCard,
  Pill,
  SectionHeader,
} from "../../components/ui";
import { YearInReviewCard } from "../../components/record/YearInReviewCard";
import { LockedPreview } from "../../components/plus/LockedPreview";
import { usePlusFeature } from "../../lib/plusFeatures";
import { getHomeMapZones } from "../../data/homeMapZones";
import {
  HOME_MAINTENANCE_CATEGORIES,
  MaintenanceCategory,
} from "../../types/maintenance";
import {
  computeYearInReview,
  yearsWithCompletions,
} from "../../utils/yearInReview";
import { formatProfileAddressLines } from "../../utils/formatProfileAddress";
import { YearInReviewShareService } from "../../services/YearInReviewShareService";
import { DesignSystem } from "../../theme/designSystem";

function categoryLabel(category: MaintenanceCategory): string {
  return (
    HOME_MAINTENANCE_CATEGORIES[
      category as keyof typeof HOME_MAINTENANCE_CATEGORIES
    ]?.displayName ?? category
  );
}

/** In January, default to the year that just ended. */
function defaultYear(years: number[], now = new Date()): number {
  const current = now.getFullYear();
  if (now.getMonth() === 0 && years.includes(current - 1)) return current - 1;
  if (years.includes(current)) return current;
  return years[0] ?? current;
}

export function YearInReviewScreen() {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const { completions, loaded, loading } = useRecordData();
  const { currency, format: formatMoney } = useCurrency();
  const { triggerLight, triggerSuccess } = useHaptics();
  const cardRef = useRef<View>(null);
  const [pickedYear, setPickedYear] = useState<number | null>(null);
  const [sharing, setSharing] = useState<"image" | "pdf" | null>(null);

  const years = useMemo(() => yearsWithCompletions(completions), [completions]);
  const year = pickedYear ?? defaultYear(years);
  const zones = useMemo(
    () => getHomeMapZones(profile?.home_systems),
    [profile?.home_systems]
  );
  const { locked: spendLocked } = usePlusFeature("ledger");
  const review = useMemo(
    () => computeYearInReview(completions, year, { zones, categoryLabel }),
    [completions, year, zones]
  );
  /** What leaves the device; spend stays behind HomeKeep + like the ledger. */
  const shareable = useMemo(
    () => (spendLocked ? { ...review, spend: null } : review),
    [review, spendLocked]
  );
  const homeLabel = formatProfileAddressLines(profile)[0] ?? null;
  const photoUrls = useSignedPhotoUrls(review.photoPaths);
  const wholeMoney = (amount: number) => formatMoney(amount, { whole: true });

  const shareImage = async () => {
    void triggerLight();
    setSharing("image");
    const result = await YearInReviewShareService.shareImage(cardRef, year);
    setSharing(null);
    if (result.success) void triggerSuccess();
    else if (result.error) Alert.alert("Couldn't share image", result.error);
  };

  const sharePdf = async () => {
    void triggerLight();
    setSharing("pdf");
    const result = await YearInReviewShareService.sharePdf({
      review: shareable,
      currency,
      homeLabel,
      generatedAt: new Date(),
    });
    setSharing(null);
    if (result.success) void triggerSuccess();
    else if (result.error) Alert.alert("Couldn't export PDF", result.error);
  };

  if (!loaded && loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (years.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="sparkles-outline"
          title="Nothing to review yet"
          body="Complete a few tasks and your year in review fills itself in."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {years.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearRow}
        >
          {years.map((y) => (
            <Pill
              key={y}
              label={String(y)}
              size="medium"
              selected={y === year}
              onPress={() => setPickedYear(y)}
            />
          ))}
        </ScrollView>
      ) : null}

      <YearInReviewCard
        ref={cardRef}
        review={shareable}
        formatMoney={wholeMoney}
        homeLabel={homeLabel}
      />

      <View style={styles.actions}>
        <View style={styles.actionSlot}>
          <Button
            label="Share image"
            onPress={() => void shareImage()}
            loading={sharing === "image"}
            disabled={sharing !== null}
          />
        </View>
        <View style={styles.actionSlot}>
          <Button
            label="Export PDF"
            variant="secondary"
            onPress={() => void sharePdf()}
            loading={sharing === "pdf"}
            disabled={sharing !== null}
          />
        </View>
      </View>

      {review.topZones.length > 0 ? (
        <Section title="Where the work went">
          {review.topZones.map((z) => (
            <RankRow key={z.key} label={z.label} count={z.count} />
          ))}
        </Section>
      ) : null}

      {review.topCategories.length > 0 ? (
        <Section title="Top categories">
          {review.topCategories.map((c) => (
            <RankRow key={c.key} label={c.label} count={c.count} />
          ))}
        </Section>
      ) : null}

      {review.spend ? (
        <View>
          <SectionHeader title="Spend" />
          <LockedPreview feature="ledger">
            <HearthSurfaceCard style={styles.sectionCard}>
              <Text style={[styles.body, { color: colors.text }]}>
                {wholeMoney(review.spend.total)} across {review.spend.count}{" "}
                {review.spend.count === 1 ? "job" : "jobs"}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                DIY {wholeMoney(review.spend.diyTotal)} · Hired{" "}
                {wholeMoney(review.spend.hiredTotal)}
                {review.spend.repairTotal > 0
                  ? ` · Repairs ${wholeMoney(review.spend.repairTotal)}`
                  : ""}
              </Text>
            </HearthSurfaceCard>
          </LockedPreview>
        </View>
      ) : null}

      {review.contributors.length > 1 ? (
        <Section title="Who pitched in">
          {review.contributors.map((c) => (
            <RankRow key={c.userId ?? c.name} label={c.name} count={c.count} />
          ))}
        </Section>
      ) : null}

      {review.firstJob && review.lastJob ? (
        <Section title="Bookends">
          <Text style={[styles.body, { color: colors.text }]}>
            First: {review.firstJob.title}
            <Text style={{ color: colors.textSecondary }}>
              {" "}· {format(review.firstJob.date, "MMM d")}
            </Text>
          </Text>
          <Text style={[styles.body, { color: colors.text }]}>
            Last: {review.lastJob.title}
            <Text style={{ color: colors.textSecondary }}>
              {" "}· {format(review.lastJob.date, "MMM d")}
            </Text>
          </Text>
        </Section>
      ) : null}

      {review.photoPaths.some((p) => photoUrls[p]) ? (
        <Section title="Photo highlights">
          <View style={styles.photoRow}>
            {review.photoPaths.map((path) =>
              photoUrls[path] ? (
                <Image
                  key={path}
                  source={{ uri: photoUrls[path] }}
                  style={styles.photo}
                  accessibilityIgnoresInvertColors
                />
              ) : null
            )}
          </View>
        </Section>
      ) : null}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <SectionHeader title={title} />
      <HearthSurfaceCard style={styles.sectionCard}>{children}</HearthSurfaceCard>
    </View>
  );
}

function RankRow({ label, count }: { label: string; count: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.rankRow}>
      <Text style={[styles.body, { color: colors.text, flex: 1 }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {count} {count === 1 ? "job" : "jobs"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.xxl,
    gap: DesignSystem.spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: DesignSystem.spacing.lg,
  },
  yearRow: {
    gap: DesignSystem.spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: DesignSystem.spacing.md,
  },
  actionSlot: {
    flex: 1,
  },
  sectionCard: {
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  body: {
    ...DesignSystem.typography.callout,
  },
  meta: {
    ...DesignSystem.typography.footnote,
  },
  photoRow: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  photo: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: DesignSystem.borders.radius.medium,
  },
});
