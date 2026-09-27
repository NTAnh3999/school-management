import { API_ROUTES } from "@/config/api";
import { httpClient } from "@/lib/http-client";
import type { PublishedContentStructure } from "@/types/models";

// GET /content/courses/:courseId/published — the single call that returns
// the full modules -> lessons -> learning_items tree for the course's
// published version. 404s if the course has no published version yet.
export async function getPublishedContentStructure(courseId: number) {
  const response = await httpClient.get<PublishedContentStructure>(
    API_ROUTES.contentVersions.publishedStructure(courseId),
  );
  return response.data;
}
