import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import type { EquipmentManual } from "../types/equipmentManual";
import type { HomeDocument } from "../types/homeDocument";

/** Upcoming expiries inside this window are worth a heads-up. */
export const HEADS_UP_AHEAD_DAYS = 60;
/** Recently lapsed items stay visible this long, then drop off. */
export const HEADS_UP_LAPSED_DAYS = 60;
export const HEADS_UP_MAX_ITEMS = 3;

export interface HeadsUpItem {
  id: string;
  kind: "warranty" | "document";
  /** Equipment id for warranties, document id for documents. */
  targetId: string;
  title: string;
  detail: string;
  expired: boolean;
  /** Days until expiry; negative once lapsed. */
  days: number;
}

function parseDay(raw: string | null | undefined): Date | null {
  const value = raw?.trim();
  if (!value) return null;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? parseISO(`${value}T12:00:00`)
    : parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function expiryDetail(days: number): string {
  if (days < -1) return `Expired ${-days} days ago`;
  if (days === -1) return "Expired yesterday";
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days} days`;
}

function inWindow(days: number): boolean {
  return days <= HEADS_UP_AHEAD_DAYS && days >= -HEADS_UP_LAPSED_DAYS;
}

/** Warranties and documents expiring soon or just lapsed, most urgent first. */
export function homeHeadsUp(
  equipment: EquipmentManual[],
  documents: HomeDocument[],
  now: Date = new Date()
): { items: HeadsUpItem[]; total: number } {
  const all: HeadsUpItem[] = [];

  for (const item of equipment) {
    const date = parseDay(item.warranty_expires_on);
    if (!date) continue;
    const days = differenceInCalendarDays(date, now);
    if (!inWindow(days)) continue;
    all.push({
      id: `warranty:${item.id}`,
      kind: "warranty",
      targetId: item.id,
      title: `${item.name} warranty`,
      detail: expiryDetail(days),
      expired: days < 0,
      days,
    });
  }

  for (const doc of documents) {
    const date = parseDay(doc.expires_on);
    if (!date) continue;
    const days = differenceInCalendarDays(date, now);
    if (!inWindow(days)) continue;
    all.push({
      id: `document:${doc.id}`,
      kind: "document",
      targetId: doc.id,
      title: doc.title,
      detail: expiryDetail(days),
      expired: days < 0,
      days,
    });
  }

  // Upcoming (soonest first) lead, since they can still be acted on.
  all.sort((a, b) => {
    if (a.expired !== b.expired) return a.expired ? 1 : -1;
    return a.expired ? b.days - a.days : a.days - b.days;
  });

  return { items: all.slice(0, HEADS_UP_MAX_ITEMS), total: all.length };
}
