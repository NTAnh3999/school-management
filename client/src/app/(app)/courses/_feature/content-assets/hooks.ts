"use client";

import { useQuery } from "@tanstack/react-query";
import { getContentAsset } from "./api";

// Lazy-fetch asset metadata only when a learning item with asset_id is
// opened — getPublishedContentStructure() does not include `asset`.
export function useContentAsset(id?: number | null) {
  return useQuery({
    queryKey: ["content-assets", id],
    queryFn: () => getContentAsset(id as number),
    enabled: !!id,
  });
}
