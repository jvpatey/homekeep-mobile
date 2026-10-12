import { useEffect, useMemo, useState } from "react";
import { EquipmentManualService } from "../services/EquipmentManualService";

const SIGNED_URL_TTL_SECONDS = 3600;
/** Re-sign a little before expiry so an open screen never shows a dead image. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

type CacheEntry = { url: string; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<void>>();

function cachedUrl(path: string): string | null {
  const hit = cache.get(path);
  if (!hit) return null;
  if (hit.expiresAt - REFRESH_MARGIN_MS < Date.now()) return null;
  return hit.url;
}

async function signMissing(paths: string[]): Promise<void> {
  const missing = paths.filter((p) => !cachedUrl(p) && !inflight.has(p));
  if (missing.length > 0) {
    const run = (async () => {
      const urls = await EquipmentManualService.createSignedUrls(
        missing,
        SIGNED_URL_TTL_SECONDS
      );
      const expiresAt = Date.now() + SIGNED_URL_TTL_SECONDS * 1000;
      for (const [path, url] of urls) {
        cache.set(path, { url, expiresAt });
      }
    })();
    for (const path of missing) inflight.set(path, run);
    try {
      await run;
    } finally {
      for (const path of missing) inflight.delete(path);
    }
  }
  const pending = paths
    .map((p) => inflight.get(p))
    .filter((p): p is Promise<void> => Boolean(p));
  if (pending.length > 0) await Promise.all(pending);
}

/** Signed URLs for storage paths in the equipment bucket, cached across screens. */
export function useSignedPhotoUrls(
  paths: (string | null | undefined)[]
): Record<string, string> {
  const key = useMemo(
    () =>
      [...new Set(paths.filter((p): p is string => Boolean(p)))]
        .sort()
        .join("|"),
    [paths]
  );
  const [urls, setUrls] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const path of key ? key.split("|") : []) {
      const url = cachedUrl(path);
      if (url) initial[path] = url;
    }
    return initial;
  });

  useEffect(() => {
    if (!key) {
      setUrls({});
      return;
    }
    const list = key.split("|");
    let cancelled = false;
    void signMissing(list).then(() => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const path of list) {
        const url = cachedUrl(path);
        if (url) next[path] = url;
      }
      setUrls(next);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return urls;
}

/** Drop a path after it is replaced so the next read re-signs it. */
export function invalidateSignedPhoto(path: string) {
  cache.delete(path);
}
