import { httpClient } from "@/lib/http-client";
import { API_ROUTES } from "@/config/api";
import type { LearningItem } from "@/types/models";

export async function getLearningItems(lessonId: number) {
  const response = await httpClient.get(
    API_ROUTES.learningItems.list(lessonId),
  );
  return response.data;
}

export async function getLearningItem(id: number) {
  const response = await httpClient.get(API_ROUTES.learningItems.detail(id));
  return response.data;
}

export async function createLearningItem(
  lessonId: number,
  data: {
    itemType: string;
    title: string;
    contentPayload?: Record<string, unknown>;
    assetId?: number;
    displayOrder?: number;
    estimatedDuration?: number;
    isRequired?: boolean;
  },
) {
  const response = await httpClient.post(
    API_ROUTES.learningItems.create(lessonId),
    data,
  );
  return response.data;
}

export async function updateLearningItem(
  id: number,
  data: Partial<{
    title: string;
    contentPayload: Record<string, unknown>;
    assetId: number;
    displayOrder: number;
    estimatedDuration: number;
    isRequired: boolean;
  }>,
) {
  const response = await httpClient.patch(
    API_ROUTES.learningItems.update(id),
    data,
  );
  return response.data;
}

export async function archiveLearningItem(id: number) {
  const response = await httpClient.patch(API_ROUTES.learningItems.archive(id));
  return response.data;
}

export async function reorderLearningItems(
  lessonId: number,
  orderedIds: number[],
) {
  const response = await httpClient.patch(
    API_ROUTES.learningItems.reorder(lessonId),
    {
      orderedIds,
    },
  );
  return response.data;
}
