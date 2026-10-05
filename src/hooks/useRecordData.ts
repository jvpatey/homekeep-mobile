import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { MaintenanceTaskService } from "../services/MaintenanceTaskService";
import { MaintenanceTask } from "../types/maintenance";
import { useTasks } from "../context/TasksContext";

interface RecordSnapshot {
  completions: MaintenanceTask[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

let snapshot: RecordSnapshot = {
  completions: [],
  loaded: false,
  loading: false,
  error: null,
};
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: Partial<RecordSnapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Fetch the all-time completion record (export cap) once; dedupes callers. */
export function refreshRecordData(): Promise<void> {
  if (inflight) return inflight;
  emit({ loading: true });
  inflight = (async () => {
    const { data, error } = await MaintenanceTaskService.getCompletedTasks(
      "all",
      { forExport: true }
    );
    if (error) {
      emit({ loading: false, loaded: true, error: error.message });
    } else {
      emit({
        completions: data ?? [],
        loading: false,
        loaded: true,
        error: null,
      });
    }
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Clear on sign-out so the next account never sees stale rows. */
export function resetRecordData() {
  snapshot = { completions: [], loaded: false, loading: false, error: null };
  listeners.forEach((listener) => listener());
}

/**
 * All-time completions for the Record tab, ledger, and pros. Refreshes on
 * focus and whenever the dashboard's completed list changes (complete/undo).
 */
export function useRecordData() {
  const state = useSyncExternalStore(subscribe, () => snapshot);
  const { completedTasks } = useTasks();
  const signature = completedTasks.length
    ? `${completedTasks.length}:${completedTasks[0]?.instance_id}:${completedTasks[0]?.completed_at}`
    : "0";
  const lastSignature = useRef(signature);

  useFocusEffect(
    useCallback(() => {
      void refreshRecordData();
    }, [])
  );

  useEffect(() => {
    if (lastSignature.current === signature) return;
    lastSignature.current = signature;
    void refreshRecordData();
  }, [signature]);

  return { ...state, refresh: refreshRecordData };
}
