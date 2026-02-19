import { httpClient } from "@/lib/http-client";
import { API_ROUTES } from "@/config/api";

export async function getLessons(sectionId: number) {
  const response = await httpClient.get(API_ROUTES.lessons.list(sectionId));
  return response.data;
}

export async function getLesson(id: number) {
  const response = await httpClient.get(API_ROUTES.lessons.detail(id));
  return response.data;
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
  const response = await httpClient.post(
    API_ROUTES.lessons.create(sectionId),
    data,
  );
  return response.data;
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
  const response = await httpClient.put(API_ROUTES.lessons.update(id), data);
  return response.data;
}

export async function deleteLesson(id: number) {
  const response = await httpClient.delete(API_ROUTES.lessons.delete(id));
  return response.data;
}
