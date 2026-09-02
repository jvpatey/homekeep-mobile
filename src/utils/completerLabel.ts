/** Who completed a task, for history and summaries. */
export function completerInitial(name: string | null | undefined): string {
  const letter = name?.replace(/\(you\)/gi, "").trim().charAt(0);
  return letter ? letter.toUpperCase() : "?";
}

export function completerDisplayName({
  completedBy,
  completedByName,
  currentUserId,
  selfAsYou = true,
}: {
  completedBy?: string | null;
  completedByName?: string | null;
  currentUserId?: string | null;
  /** When false, always use the stored name (PDFs, exported summaries). */
  selfAsYou?: boolean;
}): string | null {
  const name = completedByName?.trim() || null;
  if (!completedBy && !name) return null;
  const isSelf = Boolean(currentUserId && completedBy === currentUserId);
  if (isSelf && selfAsYou) return "You";
  if (name) return name;
  if (isSelf) return "You";
  return "Household member";
}
