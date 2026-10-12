import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";
import { DesignSystem } from "../../theme/designSystem";
import { YearInReview } from "../../utils/yearInReview";

/** Fixed brand palette so the shared image looks the same in light and dark mode. */
const CARD = {
  bgTop: "#FBF6EE",
  bgBottom: "#F1E6D6",
  ink: "#1A1612",
  muted: "#6B645C",
  copper: "#C45C26",
  sage: "#2F5D50",
  track: "rgba(47, 93, 80, 0.14)",
  tile: "rgba(255, 255, 255, 0.7)",
};

const MONTH_INITIALS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function CardMark({ size }: { size: number }) {
  const heights = [0.55, 0.85, 0.42];
  const colors = [CARD.sage, CARD.copper, CARD.ink];
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: size * 0.06, height: size * 0.85 }}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={{
            width: size * 0.22,
            height: size * h,
            borderRadius: size * 0.08,
            backgroundColor: colors[i],
          }}
        />
      ))}
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

interface YearInReviewCardProps {
  review: YearInReview;
  formatMoney: (amount: number) => string;
  homeLabel: string | null;
}

/** 4:5 summary card; captured at 1080×1350 for sharing. */
export const YearInReviewCard = forwardRef<View, YearInReviewCardProps>(
  function YearInReviewCard({ review, formatMoney, homeLabel }, ref) {
    const maxMonth = Math.max(1, ...review.monthCounts);
    const stats: { value: string; label: string }[] = [
      {
        value: String(review.jobsDone),
        label: review.jobsDone === 1 ? "job done" : "jobs done",
      },
    ];
    if (review.onTimeRate !== null) {
      stats.push({
        value: `${Math.round(review.onTimeRate * 100)}%`,
        label: "on time",
      });
    }
    if (review.estimatedHours > 0) {
      stats.push({ value: `${review.estimatedHours}h`, label: "of upkeep" });
    }
    if (review.spend) {
      stats.push({ value: formatMoney(review.spend.total), label: "invested" });
    }
    const topZone = review.topZones[0];

    return (
      <View ref={ref} collapsable={false} style={styles.frame}>
        <LinearGradient
          colors={[CARD.bgTop, CARD.bgBottom]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.brandRow}>
          <CardMark size={22} />
          <Text style={styles.wordmark}>
            Home<Text style={{ color: CARD.copper }}>Keep</Text>
          </Text>
        </View>

        <View>
          <Text style={styles.year}>{review.year}</Text>
          <Text style={styles.subtitle}>Year in review</Text>
          {homeLabel ? (
            <Text style={styles.home} numberOfLines={1}>
              {homeLabel}
            </Text>
          ) : null}
        </View>

        <View style={styles.statGrid}>
          {stats.slice(0, 4).map((s) => (
            <Stat key={s.label} value={s.value} label={s.label} />
          ))}
        </View>

        <View style={styles.chart}>
          {review.monthCounts.map((count, i) => (
            <View key={i} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.round((count / maxMonth) * 100)}%`,
                      backgroundColor:
                        review.busiestMonth?.month === i && count > 0
                          ? CARD.copper
                          : CARD.sage,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{MONTH_INITIALS[i]}</Text>
            </View>
          ))}
        </View>

        <View style={styles.highlights}>
          {topZone ? (
            <Text style={styles.highlight} numberOfLines={1}>
              Most attention: <Text style={styles.highlightStrong}>{topZone.label}</Text>
            </Text>
          ) : null}
          {review.busiestMonth ? (
            <Text style={styles.highlight} numberOfLines={1}>
              Busiest month:{" "}
              <Text style={styles.highlightStrong}>
                {format(new Date(review.year, review.busiestMonth.month, 1), "MMMM")}
              </Text>
            </Text>
          ) : null}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: DesignSystem.borders.radius.large,
    overflow: "hidden",
    padding: 24,
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  wordmark: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: CARD.ink,
  },
  year: {
    ...DesignSystem.typography.display,
    fontSize: 64,
    lineHeight: 68,
    color: CARD.ink,
  },
  subtitle: {
    ...DesignSystem.typography.title2,
    fontSize: 22,
    color: CARD.copper,
  },
  home: {
    ...DesignSystem.typography.footnote,
    color: CARD.muted,
    marginTop: 4,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stat: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: CARD.tile,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "700",
    color: CARD.ink,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 12,
    color: CARD.muted,
  },
  chart: {
    flexDirection: "row",
    gap: 4,
    height: 64,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
  },
  barTrack: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    backgroundColor: CARD.track,
    borderRadius: 3,
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderRadius: 3,
  },
  barLabel: {
    fontSize: 9,
    color: CARD.muted,
    marginTop: 3,
  },
  highlights: {
    gap: 2,
  },
  highlight: {
    fontSize: 13,
    color: CARD.muted,
  },
  highlightStrong: {
    color: CARD.ink,
    fontWeight: "700",
  },
});
