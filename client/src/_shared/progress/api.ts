import { API_ROUTES } from "@/config/api";
import { httpClient } from "@/lib/http-client";

export async function updateProgress(data: {
  enrollment_id: number;
  lesson_id: number;
  status: string;
  time_spent_minutes?: number;
}) {
  const response = await httpClient.post<{ progress: unknown }>(
    API_ROUTES.progress.update,
    {
      enrollmentId: data.enrollment_id,
      lessonId: data.lesson_id,
      status: data.status,
      timeSpent: data.time_spent_minutes ?? 0,
    },
  );
  return response.data.progress;
}

export async function getEnrollmentProgress(enrollmentId: number) {
  const response = await httpClient.get<{ progress: unknown }>(
    API_ROUTES.progress.enrollment(enrollmentId),
  );
  return response.data.progress;
}

export async function getCourseProgress(courseId: number) {
  const response = await httpClient.get<{ enrollments: unknown[] }>(
    API_ROUTES.progress.course(courseId),
  );
  return response.data.enrollments;
}
