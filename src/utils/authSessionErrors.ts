/** User-facing copy when stored credentials can no longer be refreshed. */
export const SESSION_EXPIRED_TITLE = "Session expired";
export const SESSION_EXPIRED_MESSAGE =
  "Please sign in again to continue using HomeKeep.";

export function getAuthErrorMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "";
}

/** True when Supabase cannot refresh the persisted session (revoked, rotated, or cleared). */
export function isInvalidSessionError(error: unknown): boolean {
  const message = getAuthErrorMessage(error).toLowerCase();
  if (!message) return false;

  return (
    message.includes("refresh token") ||
    message.includes("invalid refresh") ||
    message.includes("token not found") ||
    message.includes("session missing") ||
    message.includes("jwt expired") ||
    message.includes("invalid claim") ||
    message.includes("auth session missing")
  );
}
