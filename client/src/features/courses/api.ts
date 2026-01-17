import { API_ROUTES } from "@/config/api";
import { httpClient } from "@/services/http-client";
import { type Course } from "@/types/models";

export type CourseFilter = {
  search?: string;
  teacherId?: string;
};

export type UpsertCoursePayload = Pick<
  Course,
  "name" | "description" | "category" | "startDate" | "endDate" | "teacherId"
> & { id?: string };

export const fetchCourses = (filter?: CourseFilter) => {
  const query = new URLSearchParams(filter as Record<string, string>).toString();
  const url = query ? `${API_ROUTES.courses}?${query}` : API_ROUTES.courses;
  return httpClient<Course[]>(url);
};

export const fetchCourse = (courseId: string) =>
  httpClient<Course>(`${API_ROUTES.courses}/${courseId}`);

export const upsertCourse = (payload: UpsertCoursePayload) => {
  const method = payload.id ? "PUT" : "POST";
  const url = payload.id
    ? `${API_ROUTES.courses}/${payload.id}`
    : API_ROUTES.courses;
  return httpClient<Course, UpsertCoursePayload>(url, {
    method,
    body: payload,
  });
};
