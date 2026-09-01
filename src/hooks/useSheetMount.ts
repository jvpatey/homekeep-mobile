import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions } from "react-native";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { DesignSystem } from "../theme/designSystem";
import { useReducedMotion } from "./useReducedMotion";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export const SHEET_ENTER = {
  duration: DesignSystem.motion.duration.base,
  easing: DesignSystem.motion.easing.emphasized,
};

export const SHEET_EXIT = {
  duration: DesignSystem.motion.duration.fast,
  easing: DesignSystem.motion.easing.standard,
};

/** Force unmount if Reanimated exit callback never fires. */
export const SHEET_UNMOUNT_SAFETY_MS = SHEET_EXIT.duration + 80;

/**
 * Reliable mount/unmount lifecycle for bottom sheets backed by RN Modal.
 * Prevents invisible modals from blocking touches when exit animations fail.
 */
export function useSheetMount(visible: boolean, onDismissed?: () => void) {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const wasOpenRef = useRef(false);
  const isClosingRef = useRef(false);
  const closeSafetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const onDismissedRef = useRef(onDismissed);
  onDismissedRef.current = onDismissed;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  const clearCloseSafety = useCallback(() => {
    if (closeSafetyTimerRef.current) {
      clearTimeout(closeSafetyTimerRef.current);
      closeSafetyTimerRef.current = null;
    }
  }, []);

  const finishClose = useCallback(() => {
    clearCloseSafety();
    isClosingRef.current = false;
    wasOpenRef.current = false;
    opacity.value = 0;
    translateY.value = SCREEN_HEIGHT;
    setMounted(false);
    onDismissedRef.current?.();
  }, [clearCloseSafety, opacity, translateY]);

  const startClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    clearCloseSafety();
    closeSafetyTimerRef.current = setTimeout(() => {
      finishClose();
    }, SHEET_UNMOUNT_SAFETY_MS);

    if (reducedMotion) {
      finishClose();
      return;
    }

    opacity.value = withTiming(0, SHEET_EXIT);
    translateY.value = withTiming(SCREEN_HEIGHT, SHEET_EXIT, () => {
      runOnJS(finishClose)();
    });
  }, [clearCloseSafety, finishClose, opacity, translateY, reducedMotion]);

  useEffect(() => {
    if (visible) {
      clearCloseSafety();
      isClosingRef.current = false;
      wasOpenRef.current = true;
      setMounted(true);

      translateY.value = SCREEN_HEIGHT;
      if (reducedMotion) {
        opacity.value = 1;
        translateY.value = 0;
      } else {
        opacity.value = withTiming(1, SHEET_ENTER);
        translateY.value = withTiming(0, SHEET_ENTER);
      }
      return;
    }

    if (wasOpenRef.current) {
      startClose();
    }
  }, [visible, reducedMotion, clearCloseSafety, startClose, opacity, translateY]);

  useEffect(() => () => clearCloseSafety(), [clearCloseSafety]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return { mounted, backdropStyle, sheetStyle };
}
