import { AvatarCrop } from "../types/avatar";

export const AVATAR_MIN_ZOOM = 1;
export const AVATAR_MAX_ZOOM = 4;

export function avatarBaseScale(
  imageWidth: number,
  imageHeight: number,
  circleSize: number
): number {
  const shorter = Math.min(imageWidth, imageHeight);
  if (shorter <= 0 || circleSize <= 0) return 1;
  return circleSize / shorter;
}

export function clampAvatarTranslation(
  tx: number,
  ty: number,
  zoom: number,
  displayWidth: number,
  displayHeight: number,
  circleSize: number
): { x: number; y: number } {
  const width = displayWidth * zoom;
  const height = displayHeight * zoom;
  const minX = circleSize / 2 - width / 2;
  const maxX = width / 2 - circleSize / 2;
  const minY = circleSize / 2 - height / 2;
  const maxY = height / 2 - circleSize / 2;
  return {
    x: minX <= maxX ? Math.min(maxX, Math.max(minX, tx)) : 0,
    y: minY <= maxY ? Math.min(maxY, Math.max(minY, ty)) : 0,
  };
}

export function clampAvatarCrop(
  crop: AvatarCrop,
  imageWidth: number,
  imageHeight: number
): AvatarCrop {
  const size = Math.max(
    1,
    Math.min(
      Math.round(crop.width),
      Math.round(crop.height),
      Math.floor(imageWidth),
      Math.floor(imageHeight)
    )
  );
  const x = Math.min(
    Math.max(0, Math.round(crop.x)),
    Math.max(0, Math.floor(imageWidth) - size)
  );
  const y = Math.min(
    Math.max(0, Math.round(crop.y)),
    Math.max(0, Math.floor(imageHeight) - size)
  );
  return { x, y, width: size, height: size };
}

export function transformToAvatarCrop({
  zoom,
  tx,
  ty,
  imageWidth,
  imageHeight,
  circleSize,
}: {
  zoom: number;
  tx: number;
  ty: number;
  imageWidth: number;
  imageHeight: number;
  circleSize: number;
}): AvatarCrop {
  const baseScale = avatarBaseScale(imageWidth, imageHeight, circleSize);
  const factor = baseScale * zoom;
  const x = (-circleSize / 2 - tx) / factor + imageWidth / 2;
  const y = (-circleSize / 2 - ty) / factor + imageHeight / 2;
  const size = circleSize / factor;
  return clampAvatarCrop(
    { x, y, width: size, height: size },
    imageWidth,
    imageHeight
  );
}

export function avatarCropToTransform(
  crop: AvatarCrop,
  imageWidth: number,
  imageHeight: number,
  circleSize: number
): { zoom: number; tx: number; ty: number } {
  const baseScale = avatarBaseScale(imageWidth, imageHeight, circleSize);
  const safeWidth = Math.max(1, crop.width);
  const zoom = Math.min(
    AVATAR_MAX_ZOOM,
    Math.max(AVATAR_MIN_ZOOM, circleSize / (safeWidth * baseScale))
  );
  const tx =
    -circleSize / 2 - (crop.x - imageWidth / 2) * (baseScale * zoom);
  const ty =
    -circleSize / 2 - (crop.y - imageHeight / 2) * (baseScale * zoom);
  const displayWidth = imageWidth * baseScale;
  const displayHeight = imageHeight * baseScale;
  const clamped = clampAvatarTranslation(
    tx,
    ty,
    zoom,
    displayWidth,
    displayHeight,
    circleSize
  );
  return { zoom, tx: clamped.x, ty: clamped.y };
}
