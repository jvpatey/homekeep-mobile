import { File as ExpoFile } from "expo-file-system";
import { Image } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import { supabase } from "../lib/supabase";
import { AvatarCrop } from "../types/avatar";
import { clampAvatarCrop } from "../utils/avatarCrop";

export const AVATARS_BUCKET = "avatars";
export const AVATAR_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;
export const AVATAR_DISPLAY_SIZE = 512;
export const AVATAR_ORIGINAL_MAX_EDGE = 2048;
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

async function readUriAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.arrayBuffer();
  } catch {
    const file = new ExpoFile(uri);
    return await file.arrayBuffer();
  }
}

export function getImageSize(
  uri: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
}

export class AvatarStorageService {
  static displayPath(userId: string): string {
    return `${userId}/display.jpg`;
  }

  static originalPath(userId: string): string {
    return `${userId}/original.jpg`;
  }

  static async prepareOriginal(
    uri: string
  ): Promise<{ uri: string; width: number; height: number }> {
    const { width, height } = await getImageSize(uri);
    const maxEdge = Math.max(width, height);
    const actions =
      maxEdge > AVATAR_ORIGINAL_MAX_EDGE
        ? [
            {
              resize: {
                width: Math.round((width * AVATAR_ORIGINAL_MAX_EDGE) / maxEdge),
                height: Math.round(
                  (height * AVATAR_ORIGINAL_MAX_EDGE) / maxEdge
                ),
              },
            },
          ]
        : [];

    const result = await ImageManipulator.manipulateAsync(uri, actions, {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return {
      uri: result.uri,
      width: result.width ?? width,
      height: result.height ?? height,
    };
  }

  static async cropDisplay(
    uri: string,
    crop: AvatarCrop
  ): Promise<{ uri: string; crop: AvatarCrop }> {
    const { width, height } = await getImageSize(uri);
    const clamped = clampAvatarCrop(crop, width, height);
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          crop: {
            originX: clamped.x,
            originY: clamped.y,
            width: clamped.width,
            height: clamped.height,
          },
        },
        { resize: { width: AVATAR_DISPLAY_SIZE, height: AVATAR_DISPLAY_SIZE } },
      ],
      {
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return { uri: result.uri, crop: clamped };
  }

  static async uploadJpeg(
    objectPath: string,
    localUri: string
  ): Promise<{ path: string | null; error: { message: string } | null }> {
    if (!supabase) {
      return { path: null, error: { message: "Supabase not configured" } };
    }

    try {
      const buffer = await readUriAsArrayBuffer(localUri);
      if (buffer.byteLength > AVATAR_MAX_BYTES) {
        return {
          path: null,
          error: { message: "Photo is too large. Try a smaller image." },
        };
      }

      const { error } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(objectPath, new Uint8Array(buffer), {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) throw error;
      return { path: objectPath, error: null };
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return {
        path: null,
        error: {
          message:
            error instanceof Error ? error.message : "Couldn't upload photo",
        },
      };
    }
  }

  static async uploadAvatar({
    userId,
    displayUri,
    originalUri,
  }: {
    userId: string;
    displayUri: string;
    originalUri?: string;
  }): Promise<{
    displayPath: string | null;
    originalPath: string | null;
    error: { message: string } | null;
  }> {
    const displayPath = this.displayPath(userId);
    const uploadedDisplay = await this.uploadJpeg(displayPath, displayUri);
    if (uploadedDisplay.error || !uploadedDisplay.path) {
      return {
        displayPath: null,
        originalPath: null,
        error: uploadedDisplay.error,
      };
    }

    if (!originalUri) {
      return { displayPath, originalPath: null, error: null };
    }

    const originalPath = this.originalPath(userId);
    const uploadedOriginal = await this.uploadJpeg(originalPath, originalUri);
    if (uploadedOriginal.error || !uploadedOriginal.path) {
      return {
        displayPath,
        originalPath: null,
        error: uploadedOriginal.error,
      };
    }

    return { displayPath, originalPath, error: null };
  }

  static async createSignedUrl(
    storagePath: string,
    expiresInSeconds = AVATAR_SIGNED_URL_TTL_SECONDS
  ): Promise<{ data: string | null; error: { message: string } | null }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }
    try {
      const { data, error } = await supabase.storage
        .from(AVATARS_BUCKET)
        .createSignedUrl(storagePath, expiresInSeconds);
      if (error) throw error;
      if (!data?.signedUrl) throw new Error("No signed URL returned");
      return { data: data.signedUrl, error: null };
    } catch (error) {
      console.error("Error signing avatar URL:", error);
      return {
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Couldn't load photo",
        },
      };
    }
  }

  static async createSignedUrls(
    storagePaths: string[],
    expiresInSeconds = AVATAR_SIGNED_URL_TTL_SECONDS
  ): Promise<Map<string, string>> {
    const urls = new Map<string, string>();
    const unique = [...new Set(storagePaths.filter(Boolean))];
    if (!supabase || unique.length === 0) return urls;

    try {
      const { data, error } = await supabase.storage
        .from(AVATARS_BUCKET)
        .createSignedUrls(unique, expiresInSeconds);
      if (error) throw error;
      for (const row of data ?? []) {
        if (row.path && row.signedUrl && !row.error) {
          urls.set(row.path, row.signedUrl);
        }
      }
    } catch (error) {
      console.error("Error signing avatar URLs:", error);
    }
    return urls;
  }

  static async removeAvatar(
    userId: string
  ): Promise<{ error: { message: string } | null }> {
    if (!supabase) {
      return { error: { message: "Supabase not configured" } };
    }
    try {
      const { error } = await supabase.storage
        .from(AVATARS_BUCKET)
        .remove([this.displayPath(userId), this.originalPath(userId)]);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error deleting avatar:", error);
      return {
        error: {
          message:
            error instanceof Error ? error.message : "Couldn't remove photo",
        },
      };
    }
  }
}
