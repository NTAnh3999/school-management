import type { Enrollment } from "@/types/models";
import {
  isLearning,
  toStudentCourses,
  type StudentCourse,
} from "@/app/(app)/courses/_feature/student-course";

export { toneClasses } from "@/app/(app)/courses/_feature/student-course";

export type DashboardCourse = StudentCourse;

// Courses the student is currently learning, most recently studied first.
export function toDashboardCourses(enrollments: Enrollment[]): DashboardCourse[] {
  return toStudentCourses(enrollments).filter(isLearning);
}

// The "Học tiếp" spotlight: most recently studied course that isn't finished.
export function pickSpotlight(courses: DashboardCourse[]) {
  return courses.find((course) => course.pct < 100) ?? courses[0];
}

export function overallProgress(courses: Pick<DashboardCourse, "completed" | "total">[]) {
  const completed = courses.reduce((sum, course) => sum + course.completed, 0);
  const total = courses.reduce((sum, course) => sum + course.total, 0);
  return { completed, total, pct: total ? Math.round((completed / total) * 100) : 0 };
}
