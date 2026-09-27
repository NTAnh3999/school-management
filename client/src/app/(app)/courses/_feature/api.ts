import { API_ROUTES } from "@/config/api";
import { httpClient } from "@/lib/http-client";
import type { Course, Enrollment } from "@/types/models";

interface GetCoursesParams {
  keyword?: string;
  status?: string;
  departmentId?: number;
  courseType?: string;
  page?: number;
  page_size?: number;
}

interface GetCoursesResult {
  total: number;
  page: number;
  page_size: number;
  courses: Course[];
}

// GET /courses — students only ever see status="active" courses (enforced
// server-side regardless of the status filter sent here).
export async function getCourses(params?: GetCoursesParams) {
  const response = await httpClient.get<GetCoursesResult>(API_ROUTES.courses.list, {
    params,
  });
  return response.data;
}

// GET /courses/:id — includes course.modules[].lessons[] but NOT
// learning_items; use getPublishedContentStructure for the full tree.
export async function getCourse(id: number) {
  const response = await httpClient.get<{ course: Course }>(
    API_ROUTES.courses.detail(id),
  );
  return response.data.course;
}

// POST /courses/:id/enroll — students only. Fails if already enrolled or if
// the course isn't active.
export async function enrollCourse(id: number) {
  const response = await httpClient.post<{ enrollment: Enrollment }>(
    API_ROUTES.courses.enroll(id),
  );
  return response.data.enrollment;
}

// GET /courses/my/enrollments
export async function getMyEnrollments() {
  const response = await httpClient.get<{ enrollments: Enrollment[] }>(
    API_ROUTES.courses.myEnrollments,
  );
  return response.data.enrollments;
}
