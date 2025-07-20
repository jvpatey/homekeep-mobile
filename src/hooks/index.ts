// Animation hooks
export {
  useSimpleAnimation,
  useTextAnimation,
  useFeatureAnimation,
  useButtonAnimation,
} from "./useAnimations";

// Gradient hooks
export { useGradients } from "./useGradients";

// Haptic feedback hooks
export { useHaptics } from "./useHaptics";

// Spacing hooks
export { useDynamicSpacing } from "./useDynamicSpacing";

// Auth-specific hooks (keeping these separate for now)
export * from "../screens/auth/hooks";
