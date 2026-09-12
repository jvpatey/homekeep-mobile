import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

const COUNT_KEY = "review.taskCompletions";
const LAST_KEY = "review.lastPromptAt";

/** Prompt after this many celebration dismissals (not the first complete). */
const MIN_COMPLETIONS = 2;

/** Local cooldown; Apple also caps system prompts (~3/year). */
const COOLDOWN_MS = 120 * 24 * 60 * 60 * 1000;

/**
 * Call after the task-completion celebration closes.
 * Increments a local counter; may show the system review dialog when eligible.
 * Never throws — review is best-effort.
 */
export async function maybeRequestReviewAfterTaskComplete(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(COUNT_KEY);
    const count = (Number(raw) || 0) + 1;
    await AsyncStorage.setItem(COUNT_KEY, String(count));

    if (count < MIN_COMPLETIONS) return;

    const last = await AsyncStorage.getItem(LAST_KEY);
    if (last) {
      const lastMs = Date.parse(last);
      if (!Number.isNaN(lastMs) && Date.now() - lastMs < COOLDOWN_MS) return;
    }

    if (!(await StoreReview.isAvailableAsync())) return;

    await StoreReview.requestReview();
    await AsyncStorage.setItem(LAST_KEY, new Date().toISOString());
  } catch {
    // Ignore storage / StoreKit failures
  }
}
