import { API_ROUTES } from "@/config/api";
import { httpClient } from "@/lib/http-client";
import type { ContentAsset } from "@/types/models";

// GET /content-assets/:id — metadata only (storage_key, media_type,
// processing_status). Requires content.version.view permission.
export async function getContentAsset(id: number) {
  const response = await httpClient.get<{ asset: ContentAsset }>(
    API_ROUTES.contentAssets.detail(id),
  );
  return response.data.asset;
}
