import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useHaptics } from "../../hooks";
import { useCurrency } from "../../hooks/useCurrency";
import { useSignedPhotoUrls } from "../../hooks/useSignedPhotoUrls";
import { DesignSystem } from "../../theme/designSystem";
import { HearthSurfaceCard, SectionHeader } from "../ui";
import {
  HOME_MAINTENANCE_CATEGORIES,
  MaintenanceTask,
} from "../../types/maintenance";
import { completerDisplayName } from "../../utils/completerLabel";

const MAX_JOBS = 5;
/** Matches the free rows on Completion history. */
const FREE_JOBS = 3;
const CARD_WIDTH = 168;
const PHOTO_HEIGHT = 92;

interface RecentWorkStripProps {
  completions: MaintenanceTask[];
  loaded: boolean;
  locked: boolean;
  onOpenHistory: () => void;
  onUnlock: () => void;
  onLogRepair: () => void;
}

function completedAt(task: MaintenanceTask): number {
  const at = new Date(task.completed_at ?? task.due_date).getTime();
  return Number.isNaN(at) ? 0 : at;
}

/** The latest finished jobs, with photos, as a horizontal strip. */
export function RecentWorkStrip({
  completions,
  loaded,
  locked,
  onOpenHistory,
  onUnlock,
  onLogRepair,
}: RecentWorkStripProps) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();

  const recent = useMemo(
    () =>
      [...completions]
        .sort((a, b) => completedAt(b) - completedAt(a))
        .slice(0, locked ? FREE_JOBS : MAX_JOBS),
    [completions, locked]
  );
  const hasMore = completions.length > recent.length;

  const photoUrls = useSignedPhotoUrls(
    useMemo(() => recent.map((task) => task.photo_storage_path), [recent])
  );

  const tap = (run: () => void) => () => {
    void triggerLight();
    run();
  };

  if (loaded && recent.length === 0) {
    return (
      <View>
        <SectionHeader title="Recent work" />
        <HearthSurfaceCard>
          <Pressable
            onPress={tap(onLogRepair)}
            style={({ pressed }) => [styles.empty, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Your first finished job shows up here. Log a repair"
          >
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.secondary + "1F" },
              ]}
            >
              <Ionicons name="time" size={20} color={colors.secondary} />
            </View>
            <View style={styles.emptyText}>
              <Text
                style={[styles.emptyTitle, { color: colors.text }]}
                maxFontSizeMultiplier={1.4}
              >
                Your first finished job shows up here
              </Text>
              <Text
                style={[styles.emptyBody, { color: colors.primary }]}
                maxFontSizeMultiplier={1.4}
              >
                Log a repair you've already done
              </Text>
            </View>
          </Pressable>
        </HearthSurfaceCard>
      </View>
    );
  }

  return (
    <View>
      <SectionHeader
        title="Recent work"
        actionLabel="See all"
        onAction={onOpenHistory}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroller}
        contentContainerStyle={styles.row}
      >
        {recent.map((task) => (
          <JobCard
            key={task.instance_id}
            task={task}
            photoUri={
              task.photo_storage_path
                ? photoUrls[task.photo_storage_path]
                : undefined
            }
            onPress={tap(onOpenHistory)}
          />
        ))}
        {!loaded
          ? [0, 1].map((i) => (
              <View
                key={i}
                style={[
                  styles.card,
                  styles.placeholder,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              />
            ))
          : null}
        {loaded && locked && hasMore ? (
          <Pressable
            onPress={tap(onUnlock)}
            style={({ pressed }) => [
              styles.card,
              styles.teaser,
              {
                backgroundColor: colors.primary + "12",
                borderColor: colors.primary + "40",
              },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="See your full history with HomeKeep Plus"
          >
            <Ionicons name="lock-closed" size={20} color={colors.primary} />
            <Text
              style={[styles.teaserTitle, { color: colors.text }]}
              maxFontSizeMultiplier={1.3}
            >
              {completions.length - recent.length} more{" "}
              {completions.length - recent.length === 1 ? "job" : "jobs"}
            </Text>
            <Text
              style={[styles.teaserBody, { color: colors.primary }]}
              maxFontSizeMultiplier={1.3}
            >
              Full history with Plus
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function JobCard({
  task,
  photoUri,
  onPress,
}: {
  task: MaintenanceTask;
  photoUri: string | undefined;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { format: formatMoney } = useCurrency();
  const [photoFailed, setPhotoFailed] = useState(false);

  const category =
    HOME_MAINTENANCE_CATEGORIES[
      task.category as keyof typeof HOME_MAINTENANCE_CATEGORIES
    ];
  const icon = (category?.icon ?? "construct-outline") as keyof typeof Ionicons.glyphMap;
  const at = completedAt(task);
  const date = at ? format(at, "MMM d") : null;
  const cost =
    typeof task.cost_amount === "number" && task.cost_amount > 0
      ? formatMoney(task.cost_amount, { whole: true })
      : null;
  const who = completerDisplayName({
    completedBy: task.completed_by,
    completedByName: task.completed_by_name,
    currentUserId: user?.id,
  });
  const meta = [date, cost].filter(Boolean).join(" · ");
  const showPhoto = Boolean(task.photo_storage_path) && !photoFailed;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        DesignSystem.shadows.softAmbient,
        pressed && { opacity: 0.75 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={[task.title, meta, who ? `by ${who}` : null]
        .filter(Boolean)
        .join(". ")}
      accessibilityHint="Opens completion history"
    >
      <View style={styles.clip}>
        <View
          style={[
            styles.photo,
            {
              backgroundColor: showPhoto
                ? colors.fieldFill
                : colors.secondary + "14",
            },
          ]}
        >
          {showPhoto && photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onError={() => setPhotoFailed(true)}
            />
          ) : (
            <Ionicons
              name={showPhoto ? "camera-outline" : icon}
              size={26}
              color={showPhoto ? colors.textSecondary : colors.secondary}
            />
          )}
        </View>
        <View style={styles.body}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
            maxFontSizeMultiplier={1.3}
          >
            {task.title}
          </Text>
          {meta ? (
            <Text
              style={[styles.meta, { color: colors.textSecondary }]}
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
            >
              {meta}
            </Text>
          ) : null}
          {who ? (
            <Text
              style={[styles.meta, { color: colors.textSecondary }]}
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
            >
              by {who}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroller: {
    marginHorizontal: -DesignSystem.spacing.lg,
    overflow: "visible",
  },
  row: {
    gap: DesignSystem.spacing.sm + 2,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: 4,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  // Clipped inside the card; iOS drops shadows on overflow-hidden views.
  clip: {
    flex: 1,
    borderRadius: DesignSystem.borders.radius.large,
    overflow: "hidden",
  },
  placeholder: {
    height: PHOTO_HEIGHT + 76,
  },
  photo: {
    height: PHOTO_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: DesignSystem.spacing.sm + 2,
    gap: 2,
  },
  title: {
    ...DesignSystem.typography.subhead,
    fontWeight: "600",
  },
  meta: {
    ...DesignSystem.typography.caption,
    fontVariant: ["tabular-nums"],
  },
  teaser: {
    alignItems: "center",
    justifyContent: "center",
    gap: DesignSystem.spacing.xs,
    padding: DesignSystem.spacing.md,
  },
  teaserTitle: {
    ...DesignSystem.typography.subhead,
    fontWeight: "600",
    textAlign: "center",
  },
  teaserBody: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    textAlign: "center",
  },
  empty: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md - 4,
    padding: DesignSystem.spacing.md,
  },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    flex: 1,
    minWidth: 0,
  },
  emptyTitle: {
    ...DesignSystem.typography.subhead,
    fontWeight: "600",
  },
  emptyBody: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
    marginTop: 2,
  },
});
