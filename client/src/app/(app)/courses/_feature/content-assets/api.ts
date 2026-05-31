import { addAsset, getAssetById, listAssets, patchAsset } from "../mock-data";

export async function getContentAssets(params?: {
  mediaType?: string;
  uploadedBy?: number;
}) {
  return listAssets(params);
}

export async function getContentAsset(id: number) {
  return getAssetById(id);
}

export async function createContentAsset(data: {
  filename: string;
  mediaType: string;
  mimeType: string;
  storageKey: string;
  sizeBytes?: number;
  durationSeconds?: number;
  thumbnailUrl?: string;
}) {
  return addAsset(data);
}

export async function updateContentAsset(
  id: number,
  data: Partial<{ filename: string; thumbnailUrl: string }>,
) {
  return patchAsset(id, data);
}
