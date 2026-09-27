import { API_ROUTES } from "@/config/api";
import { httpClient } from "@/lib/http-client";
import type { LearningItem } from "@/types/models";

// GET /learning-items/lesson/:lessonId — includes `asset` (ContentAsset).
export async function getLearningItems(lessonId: number) {
  const response = await httpClient.get<{ items: LearningItem[] }>(
    API_ROUTES.learningItems.list(lessonId),
  );
  return response.data.items;
}

export async function getLearningItem(id: number) {
  const response = await httpClient.get<{ item: LearningItem }>(
    API_ROUTES.learningItems.detail(id),
  );
  return response.data.item;
}
