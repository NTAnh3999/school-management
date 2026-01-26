import { httpClient } from "@/lib/http-client";
import { API_ROUTES } from "@/config/api";

export async function updateProgress(data: {
  enrollment_id: number;
  lesson_id: number;
  status: string;
  time_spent_minutes?: number;
}) {
  const response = await httpClient.post(API_ROUTES.progress.update, data);
  return response.data;
}

export async function getEnrollmentProgress(enrollmentId: number) {
  const response = await httpClient.get(
    API_ROUTES.progress.enrollment(enrollmentId),
  );
  return response.data;
}

export async function getCourseProgress(courseId: number) {
  const response = await httpClient.get(API_ROUTES.progress.course(courseId));
  return response.data;
}
