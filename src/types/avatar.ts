export interface AvatarCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function parseAvatarCrop(value: unknown): AvatarCrop | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const x = Number(row.x);
  const y = Number(row.y);
  const width = Number(row.width);
  const height = Number(row.height);
  if (![x, y, width, height].every((n) => Number.isFinite(n) && n >= 0)) {
    return null;
  }
  if (width < 1 || height < 1) return null;
  return { x, y, width, height };
}
