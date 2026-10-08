import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { EquipmentRecallService } from "../services/EquipmentRecallService";
import { EquipmentRecall } from "../types/equipmentRecall";

interface RecallsSnapshot {
  items: EquipmentRecall[];
  loaded: boolean;
  error: string | null;
}

let snapshot: RecallsSnapshot = { items: [], loaded: false, error: null };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: Partial<RecallsSnapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function refreshEquipmentRecalls(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, error } = await EquipmentRecallService.listOpen();
    if (error) emit({ loaded: true, error: error.message });
    else emit({ items: data ?? [], loaded: true, error: null });
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Hides the recall right away; restores it if the server rejects. */
export async function dismissEquipmentRecall(
  recall: EquipmentRecall
): Promise<boolean> {
  emit({ items: snapshot.items.filter((r) => r.id !== recall.id) });
  const { error } = await EquipmentRecallService.dismiss(recall.id);
  if (error) {
    emit({ items: [recall, ...snapshot.items] });
    return false;
  }
  return true;
}

export function resetEquipmentRecalls() {
  snapshot = { items: [], loaded: false, error: null };
  listeners.forEach((listener) => listener());
}

/** Open CPSC recalls for the household's equipment. */
export function useEquipmentRecalls(options?: { refreshOnFocus?: boolean }) {
  const state = useSyncExternalStore(subscribe, () => snapshot);
  const refreshOnFocus = options?.refreshOnFocus ?? true;

  useFocusEffect(
    useCallback(() => {
      if (refreshOnFocus || !snapshot.loaded) void refreshEquipmentRecalls();
    }, [refreshOnFocus])
  );

  const byEquipmentId = useMemo(() => {
    const map = new Map<string, EquipmentRecall[]>();
    for (const recall of state.items) {
      const list = map.get(recall.equipment_id) ?? [];
      list.push(recall);
      map.set(recall.equipment_id, list);
    }
    return map;
  }, [state.items]);

  return { ...state, byEquipmentId, refresh: refreshEquipmentRecalls };
}
