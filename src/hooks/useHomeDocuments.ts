import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { DocumentService } from "../services/DocumentService";
import { HomeDocument } from "../types/homeDocument";

interface DocumentsSnapshot {
  items: HomeDocument[];
  loaded: boolean;
  error: string | null;
}

let snapshot: DocumentsSnapshot = { items: [], loaded: false, error: null };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: Partial<DocumentsSnapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function refreshHomeDocuments(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, error } = await DocumentService.list();
    if (error) emit({ loaded: true, error: error.message });
    else emit({ items: data ?? [], loaded: true, error: null });
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function upsertHomeDocument(document: HomeDocument) {
  const exists = snapshot.items.some((d) => d.id === document.id);
  emit({
    items: exists
      ? snapshot.items.map((d) => (d.id === document.id ? document : d))
      : [document, ...snapshot.items],
  });
}

export function removeHomeDocument(id: string) {
  emit({ items: snapshot.items.filter((d) => d.id !== id) });
}

export function resetHomeDocuments() {
  snapshot = { items: [], loaded: false, error: null };
  listeners.forEach((listener) => listener());
}

/** The household's document vault, newest first. */
export function useHomeDocuments(options?: { refreshOnFocus?: boolean }) {
  const state = useSyncExternalStore(subscribe, () => snapshot);
  const refreshOnFocus = options?.refreshOnFocus ?? true;

  useFocusEffect(
    useCallback(() => {
      if (refreshOnFocus || !snapshot.loaded) void refreshHomeDocuments();
    }, [refreshOnFocus])
  );

  const byEquipmentId = useMemo(() => {
    const map = new Map<string, HomeDocument[]>();
    for (const doc of state.items) {
      if (!doc.equipment_id) continue;
      const list = map.get(doc.equipment_id) ?? [];
      list.push(doc);
      map.set(doc.equipment_id, list);
    }
    return map;
  }, [state.items]);

  return { ...state, byEquipmentId, refresh: refreshHomeDocuments };
}
