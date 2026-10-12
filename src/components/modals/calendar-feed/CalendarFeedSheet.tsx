import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../../../context/ThemeContext";
import { useHaptics } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import { HearthSheet } from "../../ui/HearthSheet";
import { HearthSurfaceCard, SheetActionRow } from "../../ui";
import {
  CalendarFeedLinks,
  CalendarFeedService,
} from "../../../services/CalendarFeedService";

export function CalendarFeedSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { triggerLight, triggerSuccess, triggerError } = useHaptics();
  const [links, setLinks] = useState<CalendarFeedLinks | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!visible || links) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void CalendarFeedService.getFeed().then(({ data }) => {
      if (cancelled) return;
      setLoading(false);
      if (data) setLinks(data);
      else setError("Couldn't load your calendar link. Try again in a moment.");
    });
    return () => {
      cancelled = true;
    };
  }, [visible, links]);

  useEffect(() => {
    if (!visible) setCopied(false);
  }, [visible]);

  const subscribe = async () => {
    if (!links) return;
    void triggerLight();
    try {
      await Linking.openURL(links.webcalUrl);
    } catch {
      Alert.alert(
        "No calendar app found",
        "Copy the link instead and add it to your calendar as a subscription."
      );
    }
  };

  const copy = async () => {
    if (!links) return;
    await Clipboard.setStringAsync(links.httpsUrl);
    void triggerSuccess();
    setCopied(true);
  };

  const reset = () => {
    void triggerLight();
    Alert.alert(
      "Reset calendar link?",
      "Calendars subscribed with the old link will stop updating. You'll need to subscribe again with the new one.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset link",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const { data } = await CalendarFeedService.rotateFeed();
            setLoading(false);
            if (data) {
              setLinks(data);
              setCopied(false);
              void triggerSuccess();
            } else {
              void triggerError();
              Alert.alert("Couldn't reset the link", "Try again in a moment.");
            }
          },
        },
      ]
    );
  };

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      title="Calendar subscription"
      keyboardAvoiding={false}
    >
      <View style={styles.body}>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          See upcoming maintenance in Apple Calendar, Google Calendar, or
          Outlook. The calendar updates on its own as your schedule changes.
        </Text>

        {loading && !links ? (
          <ActivityIndicator style={styles.spinner} color={colors.primary} />
        ) : error && !links ? (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        ) : (
          <HearthSurfaceCard style={styles.group}>
            <SheetActionRow
              icon="calendar-outline"
              title="Add to Calendar"
              subtitle="Subscribe on this device"
              onPress={() => void subscribe()}
              disabled={!links}
              showDivider
            />
            <SheetActionRow
              icon={copied ? "checkmark" : "copy-outline"}
              title={copied ? "Link copied" : "Copy link"}
              subtitle="Paste into Google Calendar → Other calendars → From URL"
              onPress={() => void copy()}
              disabled={!links}
              showChevron={false}
              showDivider
            />
            <SheetActionRow
              icon="refresh-outline"
              title="Reset link"
              subtitle="Stops anyone with the old link from seeing your schedule"
              onPress={reset}
              disabled={!links || loading}
              destructive
              showChevron={false}
            />
          </HearthSurfaceCard>
        )}

        <Text style={[styles.footnote, { color: colors.textSecondary }]}>
          Anyone with the link can see task names and dates, so share it only
          with people in your home.
        </Text>
      </View>
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingBottom: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.md,
  },
  intro: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
  },
  spinner: {
    paddingVertical: DesignSystem.spacing.lg,
  },
  error: {
    ...DesignSystem.typography.footnote,
  },
  group: {
    overflow: "hidden",
    paddingVertical: DesignSystem.spacing.xs,
  },
  footnote: {
    ...DesignSystem.typography.caption,
    lineHeight: 18,
  },
});
