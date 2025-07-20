import * as Haptics from "expo-haptics";

/**
 * Custom hook for haptic feedback used across auth screens
 * Provides consistent haptic feedback for user interactions
 */
export function useAuthHaptics() {
  const triggerSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const triggerError = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const triggerWarning = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const triggerLight = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const triggerMedium = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const triggerHeavy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  return {
    triggerSuccess,
    triggerError,
    triggerWarning,
    triggerLight,
    triggerMedium,
    triggerHeavy,
  };
}
