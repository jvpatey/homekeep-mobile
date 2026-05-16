// deno-lint-ignore-file no-explicit-any

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface SendPushResult {
  success: boolean;
  error?: string;
  expoResult?: unknown;
}

export async function sendPush(
  supabase: any,
  userId: string,
  notification: PushPayload
): Promise<SendPushResult> {
  const { data: userProfile, error: profileError } = await supabase
    .from("profiles")
    .select("push_token")
    .eq("id", userId)
    .single();

  if (profileError || !userProfile?.push_token) {
    return { success: false, error: "User not found or no push token" };
  }

  const expoPushToken: string = userProfile.push_token;

  if (!expoPushToken.startsWith("ExponentPushToken[")) {
    console.warn("Unexpected push token format", expoPushToken);
  }

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: expoPushToken,
      sound: "default",
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    }),
  });

  const expoResult = await response.json();
  if (!response.ok) {
    console.error("Expo push service error:", expoResult);
    return {
      success: false,
      error: `Expo push service error: ${response.statusText}`,
      expoResult,
    };
  }

  const ticket = Array.isArray(expoResult?.data) ? expoResult.data[0] : null;
  if (
    ticket?.status === "error" &&
    ticket?.details?.error === "DeviceNotRegistered"
  ) {
    await supabase
      .from("profiles")
      .update({ push_token: null, updated_at: new Date().toISOString() })
      .eq("id", userId);
    console.warn("Cleared stale push token due to DeviceNotRegistered");
    return { success: false, error: "DeviceNotRegistered", expoResult };
  }

  const { error: logError } = await supabase.from("push_notifications").insert({
    user_id: userId,
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    sent_at: new Date().toISOString(),
  });
  if (logError) console.error("Error logging notification:", logError);

  return { success: true, expoResult };
}
