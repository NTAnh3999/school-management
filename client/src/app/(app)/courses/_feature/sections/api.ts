import { httpClient } from "@/lib/http-client";
import { API_ROUTES } from "@/config/api";

export async function getSections(courseId: number) {
  const response = await httpClient.get(API_ROUTES.sections.list(courseId));
  return response.data;
}

export async function getSection(id: number) {
  const response = await httpClient.get(API_ROUTES.sections.detail(id));
  return response.data;
}

export async function createSection(
  courseId: number,
  data: {
    title: string;
    description?: string;
    order_index: number;
  },
) {
  const response = await httpClient.post(
    API_ROUTES.sections.create(courseId),
    data,
  );
  return response.data;
}

export async function updateSection(
  id: number,
  data: Partial<{
    title: string;
    description: string;
    order_index: number;
  }>,
) {
  const response = await httpClient.put(API_ROUTES.sections.update(id), data);
  return response.data;
}

export async function deleteSection(id: number) {
  const response = await httpClient.delete(API_ROUTES.sections.delete(id));
  return response.data;
}
