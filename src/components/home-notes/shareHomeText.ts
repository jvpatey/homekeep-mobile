import { Share } from "react-native";

/** Native share sheet for plain text (Messages, Mail, AirDrop, Notes…). */
export async function shareHomeText(message: string, title?: string) {
  if (!message.trim()) return;
  try {
    await Share.share({ message, title }, { subject: title });
  } catch {
    // Dismissed or unavailable; nothing to recover.
  }
}
