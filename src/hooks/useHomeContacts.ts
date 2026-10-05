import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { HomeContactService } from "../services/HomeContactService";
import { HomeContact } from "../types/homeContact";

interface ContactsSnapshot {
  items: HomeContact[];
  loaded: boolean;
  error: string | null;
}

let snapshot: ContactsSnapshot = { items: [], loaded: false, error: null };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: Partial<ContactsSnapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function refreshHomeContacts(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, error } = await HomeContactService.list();
    if (error) emit({ loaded: true, error: error.message });
    else emit({ items: data ?? [], loaded: true, error: null });
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function upsertHomeContact(contact: HomeContact) {
  const exists = snapshot.items.some((c) => c.id === contact.id);
  emit({
    items: exists
      ? snapshot.items.map((c) => (c.id === contact.id ? contact : c))
      : [contact, ...snapshot.items],
  });
}

export function removeHomeContact(id: string) {
  emit({ items: snapshot.items.filter((c) => c.id !== id) });
}

/** Move a just-hired pro to the front of recent lists. */
export function markHomeContactUsed(id: string) {
  const now = new Date().toISOString();
  const target = snapshot.items.find((c) => c.id === id);
  if (!target) return;
  emit({
    items: [
      { ...target, last_used_at: now },
      ...snapshot.items.filter((c) => c.id !== id),
    ],
  });
}

export function resetHomeContacts() {
  snapshot = { items: [], loaded: false, error: null };
  listeners.forEach((listener) => listener());
}

/** The household's pros, most recently hired first. */
export function useHomeContacts(options?: { refreshOnFocus?: boolean }) {
  const state = useSyncExternalStore(subscribe, () => snapshot);
  const refreshOnFocus = options?.refreshOnFocus ?? true;

  useFocusEffect(
    useCallback(() => {
      if (refreshOnFocus || !snapshot.loaded) void refreshHomeContacts();
    }, [refreshOnFocus])
  );

  const byId = useMemo(() => {
    const map = new Map<string, HomeContact>();
    for (const contact of state.items) map.set(contact.id, contact);
    return map;
  }, [state.items]);

  return { ...state, byId, refresh: refreshHomeContacts };
}
