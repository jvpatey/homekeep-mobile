import AsyncStorage from "@react-native-async-storage/async-storage";

function firstCompleteKey(userId: string) {
  return `plus_offer_first_complete:${userId}`;
}

function homeShareNudgeKey(userId: string) {
  return `homeshare_nudge_done:${userId}`;
}

/** True if we already showed the post–first-complete soft paywall. */
export async function hasOfferedPaywallAfterFirstComplete(
  userId: string
): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(firstCompleteKey(userId))) === "1";
  } catch {
    return false;
  }
}

export async function markOfferedPaywallAfterFirstComplete(
  userId: string
): Promise<void> {
  try {
    await AsyncStorage.setItem(firstCompleteKey(userId), "1");
  } catch {
    // Non-fatal
  }
}

/** True if HomeShare nudge was shown or dismissed for this user. */
export async function hasFinishedHomeShareNudge(
  userId: string
): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(homeShareNudgeKey(userId))) === "1";
  } catch {
    return false;
  }
}

export async function markHomeShareNudgeFinished(
  userId: string
): Promise<void> {
  try {
    await AsyncStorage.setItem(homeShareNudgeKey(userId), "1");
  } catch {
    // Non-fatal
  }
}
