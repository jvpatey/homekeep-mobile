import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DesignSystem } from "../theme/designSystem";

/** Safe-area insets plus common scroll/footer padding helpers. */
export function useScreenInsets(
  extraBottom: number = DesignSystem.spacing.xxxl,
) {
  const insets = useSafeAreaInsets();

  return {
    insets,
    scrollPaddingBottom: insets.bottom + extraBottom,
    footerPaddingBottom: insets.bottom + DesignSystem.spacing.lg,
  };
}
