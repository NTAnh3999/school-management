import { API_ROUTES } from "@/config/api";
import { httpClient } from "@/lib/http-client";
import type { Enrollment, LessonProgress, LessonProgressStatus } from "@/types/models";

// POST /progress/update — student-only. lessonId MUST belong to the
// enrollment's published course version, or the API returns 400. Calling
// repeatedly with status "in_progress" accumulates time_spent_minutes
// server-side rather than overwriting it.
export async function updateProgress(data: {
  enrollment_id: number;
  lesson_id: number;
  status: LessonProgressStatus;
  time_spent_minutes?: number;
}) {
  const response = await httpClient.post<{ progress: LessonProgress }>(
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

// GET /progress/enrollment/:id — returns the full Enrollment (course,
// progress, lesson_progress[]), not just a bare "progress" object.
export async function getEnrollmentProgress(enrollmentId: number) {
  const response = await httpClient.get<{ progress: Enrollment }>(
    API_ROUTES.progress.enrollment(enrollmentId),
  );
  return response.data.progress;
}

export async function getCourseProgress(courseId: number) {
  const response = await httpClient.get<{ enrollments: Enrollment[] }>(
    API_ROUTES.progress.course(courseId),
  );
  return response.data.enrollments;
}
