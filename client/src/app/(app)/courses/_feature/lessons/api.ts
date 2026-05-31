import {
  addLesson,
  getLessonById,
  listLessons,
  patchLesson,
  removeLesson,
} from "../mock-data";

export async function getLessons(sectionId: number) {
  return listLessons(sectionId);
}

export async function getLesson(id: number) {
  return getLessonById(id);
}

export async function createLesson(
  sectionId: number,
  data: {
    title: string;
    content?: string;
    lesson_type: string;
    video_url?: string;
    duration_minutes: number;
    order_index: number;
  },
) {
  return addLesson(sectionId, data);
}

export async function updateLesson(
  id: number,
  data: Partial<{
    title: string;
    content: string;
    lesson_type: string;
    video_url: string;
    duration_minutes: number;
    order_index: number;
  }>,
) {
  return patchLesson(id, data);
}

export async function deleteLesson(id: number) {
  return removeLesson(id);
}
