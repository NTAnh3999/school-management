import { httpClient } from "@/lib/http-client";
import { API_ROUTES } from "@/config/api";

interface GetCoursesParams {
  level?: string;
  status?: string;
  instructorId?: number;
}

export async function getCourses(params?: GetCoursesParams) {
  const response = await httpClient.get(API_ROUTES.courses.list, { params });
  return response.data;
}

export async function getCourse(id: number) {
  const response = await httpClient.get(API_ROUTES.courses.detail(id));
  return response.data;
}

export async function createCourse(data: {
  title: string;
  description: string;
  level: string;
  price: number;
}) {
  const response = await httpClient.post(API_ROUTES.courses.create, data);
  return response.data;
}

export async function updateCourse(
  id: number,
  data: Partial<{
    title: string;
    description: string;
    level: string;
    price: number;
    status: string;
  }>,
) {
  const response = await httpClient.put(API_ROUTES.courses.update(id), data);
  return response.data;
}

export async function deleteCourse(id: number) {
  const response = await httpClient.delete(API_ROUTES.courses.delete(id));
  return response.data;
}

export async function enrollCourse(id: number) {
  const response = await httpClient.post(API_ROUTES.courses.enroll(id));
  return response.data;
}

export async function getMyEnrollments() {
  const response = await httpClient.get(API_ROUTES.courses.myEnrollments);
  return response.data;
}
