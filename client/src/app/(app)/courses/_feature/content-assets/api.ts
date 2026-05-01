import { httpClient } from "@/lib/http-client";
import { API_ROUTES } from "@/config/api";

export async function getContentAssets(params?: {
  mediaType?: string;
  uploadedBy?: number;
}) {
  const response = await httpClient.get(API_ROUTES.contentAssets.list, {
    params,
  });
  return response.data;
}

export async function getContentAsset(id: number) {
  const response = await httpClient.get(API_ROUTES.contentAssets.detail(id));
  return response.data;
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
  const response = await httpClient.post(API_ROUTES.contentAssets.create, data);
  return response.data;
}

export async function updateContentAsset(
  id: number,
  data: Partial<{ filename: string; thumbnailUrl: string }>,
) {
  const response = await httpClient.patch(
    API_ROUTES.contentAssets.update(id),
    data,
  );
  return response.data;
}
