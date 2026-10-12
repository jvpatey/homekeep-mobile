import React, { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TodayAlertCard } from "../ui";
import { useProfile } from "../../context/ProfileContext";
import { useHomeDocuments } from "../../hooks/useHomeDocuments";
import { usePlusFeature } from "../../lib/plusFeatures";
import { useAppNavigation } from "../../navigation/useAppNavigation";
import type { HomeDocument } from "../../types/homeDocument";

const DISMISSED_KEY = "homekeep.inspectionImportCard.dismissed";
/** Only pitch the import while the home is new to the app. */
const NEW_HOME_WINDOW_DAYS = 120;

export interface InspectionImportPrompt {
  visible: boolean;
  pending: HomeDocument | undefined;
  dismiss: () => void;
  start: () => Promise<void>;
}

/**
 * "Just bought? Import your inspection" — offered to recently set-up homes that
 * haven't turned an inspection report into a plan yet.
 */
export function useInspectionImportPrompt(): InspectionImportPrompt {
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

  const visible =
    loaded && dismissed === false && !imported && (!!pending || isNewHome);

  const dismiss = useCallback(() => {
    setDismissed(true);
    void AsyncStorage.setItem(DISMISSED_KEY, "true");
  }, []);

  const start = useCallback(async () => {
    if (locked && !(await unlock())) return;
    if (pending) openRecord("InspectionImport", { documentId: pending.id });
    else openRecord("DocumentVault", { addKind: "inspection" });
  }, [locked, unlock, pending, openRecord]);

  return { visible, pending, dismiss, start };
}

export function InspectionImportCard({
  prompt,
}: {
  prompt: InspectionImportPrompt;
}) {
  const { pending } = prompt;
  return (
    <TodayAlertCard
      icon="clipboard-outline"
      title={
        pending
          ? "Turn your inspection into a plan"
          : "Just bought? Import your inspection"
      }
      body={
        pending
          ? `HomeKeep can read “${pending.title}” and suggest repairs and upkeep to schedule.`
          : "Upload the report and HomeKeep turns its findings into repairs and recurring upkeep."
      }
      actionLabel={pending ? "Import findings" : "Upload inspection report"}
      actionIcon="sparkles-outline"
      onAction={() => void prompt.start()}
      onDismiss={prompt.dismiss}
    />
  );
}
