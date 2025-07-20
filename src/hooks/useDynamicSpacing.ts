import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Dimensions } from "react-native";

/**
 * Custom hook for dynamic spacing based on screen size
 * Provides consistent spacing across different device sizes
 */
export function useDynamicSpacing() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get("window");

  const isLargeScreen = screenHeight > 900;
  const isMediumScreen = screenHeight > 800 && screenHeight <= 900;

  let dynamicTopSpacing;
  let dynamicBottomSpacing;

  if (isLargeScreen) {
    dynamicTopSpacing = insets.top + 40;
    dynamicBottomSpacing = 60;
  } else if (isMediumScreen) {
    dynamicTopSpacing = insets.top + 15;
    dynamicBottomSpacing = 20;
  } else {
    dynamicTopSpacing = insets.top + 10;
    dynamicBottomSpacing = 16;
  }

  return {
    dynamicTopSpacing,
    dynamicBottomSpacing,
    isLargeScreen,
    isMediumScreen,
    screenHeight,
  };
}
