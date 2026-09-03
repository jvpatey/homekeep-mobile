export function accountDisplayName({
  authFullName,
  profileFullName,
  email,
}: {
  authFullName?: string | null;
  profileFullName?: string | null;
  email?: string | null;
}): string {
  const name =
    (typeof authFullName === "string" ? authFullName.trim() : "") ||
    (typeof profileFullName === "string" ? profileFullName.trim() : "");
  if (name) return name;
  const local = email?.split("@")[0]?.trim();
  if (local) return local;
  return "Your account";
}

export function accountFirstName(input: {
  authFullName?: string | null;
  profileFullName?: string | null;
  email?: string | null;
}): string {
  const full = accountDisplayName(input);
  if (full === "Your account") return full;
  return full.split(/\s+/)[0] || full;
}

export function hasAccountName({
  authFullName,
  profileFullName,
}: {
  authFullName?: string | null;
  profileFullName?: string | null;
}): boolean {
  return Boolean(
    (typeof authFullName === "string" && authFullName.trim()) ||
      (typeof profileFullName === "string" && profileFullName.trim())
  );
}

export function splitDisplayName(
  fullName?: string | null
): { first: string; last: string } {
  const trimmed = typeof fullName === "string" ? fullName.trim() : "";
  if (!trimmed) return { first: "", last: "" };
  const space = trimmed.indexOf(" ");
  if (space < 0) return { first: trimmed, last: "" };
  return {
    first: trimmed.slice(0, space),
    last: trimmed.slice(space + 1).trim(),
  };
}

export function joinDisplayName(first: string, last: string): string {
  return [first.trim(), last.trim()].filter(Boolean).join(" ");
}

export function accountInitial(input: {
  authFullName?: string | null;
  profileFullName?: string | null;
  email?: string | null;
}): string {
  const source = accountDisplayName(input);
  const letter = source.charAt(0);
  return letter ? letter.toUpperCase() : "U";
}
