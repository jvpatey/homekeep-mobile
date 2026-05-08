import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Reads the system "Reduce Motion" accessibility setting and stays in sync with changes.
 * iOS 26 enforces this strictly; entrance animations should fall back to instant renders
 * when this returns true.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (isMounted) setReduced(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        if (isMounted) setReduced(enabled);
      },
    );

    return () => {
      isMounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reduced;
}
