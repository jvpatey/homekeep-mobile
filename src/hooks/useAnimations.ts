import { FadeIn } from "react-native-reanimated";
import { DesignSystem } from "../theme/designSystem";
import { useReducedMotion } from "./useReducedMotion";

/**
 * 2026 entrance animations.
 *
 * Replaces the old useSharedValue + useEffect cascade. Hooks now return
 * `entering` props that consumers spread onto `Animated.View`. Total welcome
 * screen entry budget is ~450ms (was ~1700ms), with at most two staggered
 * groups: hero (0ms) and content (120ms).
 *
 * Rules:
 * - Type elements animate opacity only (no translateY, no scale) to avoid
 *   sub-pixel blur during the tween.
 * - Non-type elements get a small 6–8px translateY lift; never combined
 *   with scale.
 * - Springs are reserved for gesture-paired motion (press states, modal
 *   opens), not entrance reveals. Entrances use the standard easing curve.
 * - Reduced Motion → instant fade.
 */

const { duration, easing } = DesignSystem.motion;

function buildEntering(delay: number, translateY: number, reduced: boolean) {
  if (reduced) {
    return FadeIn.duration(0);
  }

  if (translateY === 0) {
    return FadeIn.duration(duration.fast)
      .delay(delay)
      .easing(easing.standard);
  }

  return FadeIn.duration(duration.base)
    .delay(delay)
    .easing(easing.standard)
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY }],
    });
}

/** Logo image entrance: opacity + tiny lift. */
export function useLogoAnimation(delay: number = 0) {
  const reduced = useReducedMotion();
  return { entering: buildEntering(delay, 6, reduced) };
}

/**
 * Hero text entrance. Headline + subtitle fade in together at t=0; type
 * stays opacity-only so the curves don't shimmer during scale.
 */
export function useTextAnimation() {
  const reduced = useReducedMotion();
  return {
    headlineEntering: buildEntering(0, 0, reduced),
    subtitleEntering: buildEntering(0, 0, reduced),
  };
}

/**
 * Feature card group entrance. The whole group animates as one — we no
 * longer cascade individual cards. Single 6px lift + fade.
 */
export function useFeatureAnimation(baseDelay: number = 120) {
  const reduced = useReducedMotion();
  return { entering: buildEntering(baseDelay, 6, reduced) };
}

/**
 * Action button entrance. Sits in the second stagger group so it lands just
 * after the cards.
 */
export function useButtonAnimation(delay: number = 200) {
  const reduced = useReducedMotion();
  return { entering: buildEntering(delay, 0, reduced) };
}

/** Generic simple entrance for one-off elements. */
export function useSimpleAnimation(
  delay: number = 0,
  translateY: number = 6,
) {
  const reduced = useReducedMotion();
  return { entering: buildEntering(delay, translateY, reduced) };
}
