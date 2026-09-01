// Animation hooks
export {
  useSimpleAnimation,
  useLogoAnimation,
  useTextAnimation,
  useFeatureAnimation,
  useButtonAnimation,
} from "./useAnimations";

export { useReducedMotion } from "./useReducedMotion";
export { useScalePress } from "./useScalePress";
export {
  useSheetMount,
  SHEET_ENTER,
  SHEET_EXIT,
  SHEET_UNMOUNT_SAFETY_MS,
} from "./useSheetMount";

// Gradient hooks
export { useGradients } from "./useGradients";

// Haptic feedback hooks
export { useHaptics } from "./useHaptics";

// Spacing hooks
export { useDynamicSpacing } from "./useDynamicSpacing";
export { useScreenInsets } from "./useScreenInsets";

// Device detection hooks
export { useDevice } from "./useDevice";

// Auth-specific hooks
export * from "../screens/auth/hooks";

// Task management hooks
export { useTasks } from "./useTasks";

// Weather data hook
export { useWeather } from "./useWeather";
