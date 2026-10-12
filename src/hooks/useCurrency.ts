import { useCallback, useMemo } from "react";
import { useProfile } from "../context/ProfileContext";
import { currencyForCountry, formatMoney } from "../utils/formatMoney";

/** Currency for the viewer's home, plus a bound formatter. */
export function useCurrency() {
  const { profile } = useProfile();
  const currency = useMemo(
    () => currencyForCountry(profile?.country),
    [profile?.country]
  );
  const format = useCallback(
    (amount: number, options?: { whole?: boolean }) =>
      formatMoney(amount, currency, options),
    [currency]
  );
  return { currency, format };
}
