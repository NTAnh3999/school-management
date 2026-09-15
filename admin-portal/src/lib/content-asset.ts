import type { ContentAsset } from "@/types";

// ContentAsset.storage_key is an opaque reference (FSD 7.2) — either a path this app's own
// upload endpoint wrote under /uploads (browser-previewable through the Vite/Express proxy) or
// an arbitrary string entered via "Register asset" for a file that lives elsewhere entirely
// (e.g. "s3://bucket/key", a bare filesystem path). Only http(s) URLs and our own /uploads paths
// are ever safe to drop into an <img>/<video> src — anything else has no browser-resolvable
// location and must fall back to a text-only display.
export function resolveAssetPreviewUrl(asset: Pick<ContentAsset, "storage_key">): string | null {
  const key = asset.storage_key;
  if (!key) return null;
  if (key.startsWith("/uploads/")) return key;
  if (/^https?:\/\//i.test(key)) return key;
  return null;
}

export function isPreviewableMediaType(mediaType: string): mediaType is "image" | "video" | "audio" {
  return mediaType === "image" || mediaType === "video" || mediaType === "audio";
}
