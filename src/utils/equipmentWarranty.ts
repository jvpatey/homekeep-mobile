import { differenceInCalendarDays, format, parseISO, isValid } from "date-fns";

export type WarrantyStatus = "expired" | "expiring_soon" | "ok" | "none";

const EXPIRING_SOON_DAYS = 90;

export function resolveWarrantyFields(
  warrantyExpiresOn: string | null | undefined,
  now: Date = new Date()
): {
  warrantyExpiresOn: string | null;
  warrantyExpiresLabel: string | null;
  warrantyStatus: WarrantyStatus;
} {
  const raw = warrantyExpiresOn?.trim() || null;
  if (!raw) {
    return {
      warrantyExpiresOn: null,
      warrantyExpiresLabel: null,
      warrantyStatus: "none",
    };
  }

  // Prefer date-only YYYY-MM-DD; fall back to parseISO.
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? parseISO(`${raw}T12:00:00`)
    : parseISO(raw);
  if (!isValid(parsed)) {
    return {
      warrantyExpiresOn: raw,
      warrantyExpiresLabel: raw,
      warrantyStatus: "none",
    };
  }

  const label = format(parsed, "MMM d, yyyy");
  const days = differenceInCalendarDays(parsed, now);
  let status: WarrantyStatus = "ok";
  if (days < 0) status = "expired";
  else if (days <= EXPIRING_SOON_DAYS) status = "expiring_soon";

  return {
    warrantyExpiresOn: raw.slice(0, 10),
    warrantyExpiresLabel: label,
    warrantyStatus: status,
  };
}

export function warrantyStatusLabel(status: WarrantyStatus): string | null {
  if (status === "expired") return "Expired";
  if (status === "expiring_soon") return "Expiring soon";
  return null;
}
