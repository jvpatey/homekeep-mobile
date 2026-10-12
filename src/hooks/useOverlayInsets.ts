import { Platform } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** UIKit's tab bar height above the home indicator; the native bar doesn't report it to JS. */
const IOS_TAB_BAR_HEIGHT = 49;

/**
 * Space covered by the translucent iOS header and native tab bar on Record-tab
 * screens. Anything centered with flex sits low by these amounts, so empty and
 * loading states pad them back out. Large-title and search-bar headers are
 * translucent; pass `translucentHeader: false` for screens with a plain title.
 * Zero on Android, where neither bar overlaps content.
 */
export function useOverlayInsets({
  translucentHeader = true,
}: { translucentHeader?: boolean } = {}) {
  const headerHeight = useHeaderHeight();
  const safeInsets = useSafeAreaInsets();

  if (Platform.OS !== "ios") {
    return { top: 0, bottom: 0 };
  }
  return {
    top: translucentHeader ? headerHeight : 0,
    bottom: safeInsets.bottom + IOS_TAB_BAR_HEIGHT,
  };
}
