import { API_ORIGIN } from "@/config/api";
import type { ContentAsset } from "@/types/models";

// ContentAsset.storage_key is a path served by the API's static file
// middleware (e.g. "/uploads/169...-abc.mp4", or "/uploads/h5p/{storedId}"
// with no trailing slash for h5p), mounted at the API's origin — NOT under
// /api/v1. Resolve against API_ORIGIN so it works regardless of where the
// Next.js app itself is hosted.
export function resolveAssetUrl(asset: Pick<ContentAsset, "storage_key">): string | null {
  const key = asset.storage_key;
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  if (key.startsWith("/uploads/")) return `${API_ORIGIN}${key}`;
  return null;
}

export function isPreviewableMediaType(
  mediaType: string,
): mediaType is "image" | "video" | "audio" {
  return mediaType === "image" || mediaType === "video" || mediaType === "audio";
}
