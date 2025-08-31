import * as Haptics from "expo-haptics";

// useAuthHaptics hook for the useAuthHaptics on the home screen
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
