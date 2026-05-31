import {
  addCourse,
  enrollInCourse,
  getCourseById,
  listCourses,
  listMyEnrollments,
  patchCourse,
  removeCourse,
} from "./mock-data";

interface GetCoursesParams {
  level?: string;
  status?: string;
  instructorId?: number;
}

export async function getCourses(params?: GetCoursesParams) {
  return listCourses(params);
}

export async function getCourse(id: number) {
  return getCourseById(id);
}

export async function createCourse(data: {
  title: string;
  description: string;
  level: string;
  price: number;
}) {
  return addCourse(data);
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
  return patchCourse(id, data);
}

export async function deleteCourse(id: number) {
  return removeCourse(id);
}

export async function enrollCourse(id: number) {
  return enrollInCourse(id);
}

export async function getMyEnrollments() {
  return listMyEnrollments();
}
