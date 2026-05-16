import { format, isValid, parseISO } from "date-fns";

export function formatPurchaseDateLabel(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const parsed = parseISO(iso);
    if (!isValid(parsed)) return iso;
    return format(parsed, "MMM d, yyyy");
  } catch {
    return iso;
  }
}
