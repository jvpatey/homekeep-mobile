import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { useHomeDocuments } from "../../hooks/useHomeDocuments";
import { usePlusFeature } from "../../lib/plusFeatures";
import { useAppNavigation } from "../../navigation/useAppNavigation";
import { DesignSystem } from "../../theme/designSystem";

const DISMISSED_KEY = "homekeep.inspectionImportCard.dismissed";
/** Only pitch the import while the home is new to the app. */
const NEW_HOME_WINDOW_DAYS = 120;

/**
 * "Just bought? Import your inspection" — shown to recently set-up homes that
 * haven't turned an inspection report into a plan yet.
 */
export function InspectionImportCard() {
  const { colors, isDark } = useTheme();
  const { profile } = useProfile();
  const { items, loaded } = useHomeDocuments({ refreshOnFocus: false });
  const { locked, unlock } = usePlusFeature("inspection");
  const { openRecord } = useAppNavigation();
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    void AsyncStorage.getItem(DISMISSED_KEY).then((value) =>
      setDismissed(value === "true")
    );
  }, []);

  const inspections = useMemo(
    () => items.filter((doc) => doc.kind === "inspection"),
    [items]
  );
  const pending = inspections.find(
    (doc) => doc.storage_path && !doc.ai_extraction
  );

  const setUpAt = profile?.home_setup_set_at
    ? new Date(profile.home_setup_set_at).getTime()
    : null;
  const isNewHome =
    setUpAt !== null &&
    Date.now() - setUpAt < NEW_HOME_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const imported = inspections.some((doc) => doc.ai_extraction);

  if (!loaded || dismissed !== false || imported) return null;
  if (!pending && !isNewHome) return null;

  const dismiss = () => {
    setDismissed(true);
    void AsyncStorage.setItem(DISMISSED_KEY, "true");
  };

  const start = async () => {
    if (locked && !(await unlock())) return;
    if (pending) openRecord("InspectionImport", { documentId: pending.id });
    else openRecord("DocumentVault", { addKind: "inspection" });
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark
            ? "rgba(35, 37, 38, 0.45)"
            : "rgba(255, 255, 255, 0.55)",
          borderColor: colors.glassStroke,
        },
      ]}
    >
      <View style={styles.row}>
        <View
          style={[styles.iconWrap, { backgroundColor: `${colors.primary}18` }]}
        >
          <Ionicons name="clipboard-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, { color: colors.text }]}>
            {pending ? "Turn your inspection into a plan" : "Just bought? Import your inspection"}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {pending
              ? `HomeKeep can read “${pending.title}” and suggest repairs and upkeep to schedule.`
              : "Upload the report and HomeKeep turns its findings into repairs and recurring upkeep."}
          </Text>
        </View>
        <Pressable
          onPress={dismiss}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
      <Pressable
        onPress={() => void start()}
        style={[styles.cta, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
      >
        <Ionicons name="sparkles-outline" size={16} color="#fff" />
        <Text style={styles.ctaText}>
          {pending ? "Import findings" : "Upload inspection report"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: DesignSystem.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignSystem.spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...DesignSystem.typography.smallSemiBold,
  },
  body: {
    ...DesignSystem.typography.caption,
    lineHeight: 17,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.medium,
    minHeight: 40,
  },
  ctaText: {
    ...DesignSystem.typography.smallSemiBold,
    color: "#fff",
  },
});
