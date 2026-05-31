import {
  addLearningItem,
  archiveLearningItemById,
  getLearningItemById,
  listLearningItems,
  patchLearningItem,
  reorderLearningItemsByLesson,
} from "../mock-data";

export async function getLearningItems(lessonId: number) {
  return listLearningItems(lessonId);
}

export async function getLearningItem(id: number) {
  return getLearningItemById(id);
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
  return addLearningItem(lessonId, data);
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
  return patchLearningItem(id, data);
}

export async function archiveLearningItem(id: number) {
  return archiveLearningItemById(id);
}

export async function reorderLearningItems(
  lessonId: number,
  orderedIds: number[],
) {
  return reorderLearningItemsByLesson(lessonId, orderedIds);
}
