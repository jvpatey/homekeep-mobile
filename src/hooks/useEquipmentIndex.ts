import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { EquipmentManualService } from "../services/EquipmentManualService";
import { EquipmentManual } from "../types/equipmentManual";

interface EquipmentSnapshot {
  items: EquipmentManual[];
  loaded: boolean;
  error: string | null;
}

let snapshot: EquipmentSnapshot = { items: [], loaded: false, error: null };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: Partial<EquipmentSnapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function refreshEquipmentIndex(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, error } = await EquipmentManualService.listEquipmentManuals();
    if (error) emit({ loaded: true, error: error.message });
    else emit({ items: data ?? [], loaded: true, error: null });
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Optimistic local update after a save so lists reflect it immediately. */
export function upsertEquipmentInIndex(item: EquipmentManual) {
  const exists = snapshot.items.some((i) => i.id === item.id);
  emit({
    items: exists
      ? snapshot.items.map((i) => (i.id === item.id ? item : i))
      : [item, ...snapshot.items],
  });
}

export function removeEquipmentFromIndex(id: string) {
  emit({ items: snapshot.items.filter((i) => i.id !== id) });
}

export function resetEquipmentIndex() {
  snapshot = { items: [], loaded: false, error: null };
  listeners.forEach((listener) => listener());
}

/**
 * Household equipment, shared across the Record tab, task detail, and rows.
 * Pass `refreshOnFocus: false` from list rows to avoid a fetch per row.
 */
export function useEquipmentIndex(options?: { refreshOnFocus?: boolean }) {
  const state = useSyncExternalStore(subscribe, () => snapshot);
  const refreshOnFocus = options?.refreshOnFocus ?? true;

  useFocusEffect(
    useCallback(() => {
      if (refreshOnFocus || !snapshot.loaded) void refreshEquipmentIndex();
    }, [refreshOnFocus])
  );

  const byId = useMemo(() => {
    const map = new Map<string, EquipmentManual>();
    for (const item of state.items) map.set(item.id, item);
    return map;
  }, [state.items]);

  return { ...state, byId, refresh: refreshEquipmentIndex };
}
