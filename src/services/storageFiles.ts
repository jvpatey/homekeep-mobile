import { File as ExpoFile } from "expo-file-system";
import { supabase } from "../lib/supabase";
import { logServiceFailure } from "../utils/serviceError";

/** Private bucket for manuals, receipts, completion photos, and documents. */
export const HOME_FILES_BUCKET = "equipment-manuals";

export function sanitizeFileName(name: string, fallback = "file"): string {
  const base = name.split(/[/\\]/).pop() || fallback;
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || fallback;
}

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out`)),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export async function readUriAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const isRemote = /^https?:\/\//i.test(uri);
  if (!isRemote) {
    try {
      const file = new ExpoFile(uri);
      return await withTimeout(file.arrayBuffer(), 20_000, "Read photo");
    } catch {
      // Some library URIs need fetch; bound it so it cannot hang the UI.
    }
  }

  const response = await withTimeout(fetch(uri), 20_000, "Read photo");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.arrayBuffer();
}

export async function uploadFileFromUri(
  objectPath: string,
  localUri: string,
  mimeType: string
): Promise<{ path: string | null; error: { message: string } | null }> {
  if (!supabase) {
    return { path: null, error: { message: "Supabase not configured" } };
  }

  try {
    const buffer = await readUriAsArrayBuffer(localUri);

    const { error: uploadError } = await withTimeout(
      supabase.storage.from(HOME_FILES_BUCKET).upload(
        objectPath,
        new Uint8Array(buffer),
        {
          contentType: mimeType || "application/octet-stream",
          upsert: true,
        }
      ),
      45_000,
      "Upload photo"
    );

    if (uploadError) throw uploadError;

    return { path: objectPath, error: null };
  } catch (error) {
    const serviceError = logServiceFailure("Error uploading file:", error);
    return {
      path: null,
      error: { message: serviceError.message },
    };
  }
}

export async function deleteStoredFile(
  path: string
): Promise<{ error: Error | null }> {
  if (!supabase) {
    return { error: new Error("Supabase not configured") };
  }

  const { error } = await supabase.storage
    .from(HOME_FILES_BUCKET)
    .remove([path]);

  return { error: error ? new Error(error.message) : null };
}

export async function createSignedFileUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<{
  data: string | null;
  error: { message: string; details?: string } | null;
}> {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } };
  }

  try {
    const { data, error } = await supabase.storage
      .from(HOME_FILES_BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) throw error;
    if (!data?.signedUrl) throw new Error("No signed URL returned");

    return { data: data.signedUrl, error: null };
  } catch (error) {
    console.error("Error creating signed URL:", error);
    return {
      data: null,
      error: {
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        details: String(error),
      },
    };
  }
}

/** Batch-sign storage paths. Missing or failed paths are omitted from the map. */
export async function createSignedFileUrls(
  storagePaths: string[],
  expiresInSeconds = 3600
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const unique = [...new Set(storagePaths.filter(Boolean))];
  if (!supabase || unique.length === 0) return result;

  try {
    const { data, error } = await supabase.storage
      .from(HOME_FILES_BUCKET)
      .createSignedUrls(unique, expiresInSeconds);
    if (error) throw error;
    for (const row of data ?? []) {
      if (row.path && row.signedUrl && !row.error) {
        result.set(row.path, row.signedUrl);
      }
    }
  } catch (error) {
    logServiceFailure("Error batch-signing files:", error);
  }
  return result;
}
