import type { Enrollment } from "@/types/models";

export type Tone = "secondary" | "highlight" | "primary";

// Course tiles cycle through the three tenant tones like the design's
// Toán / Ngữ văn / Tiếng Anh cards.
const TONES: Tone[] = ["secondary", "highlight", "primary"];

export const toneClasses: Record<Tone, { tile: string; bar: string }> = {
  secondary: { tile: "bg-secondary-soft text-secondary", bar: "bg-secondary" },
  highlight: { tile: "bg-highlight-soft text-highlight", bar: "bg-highlight" },
  primary: { tile: "bg-primary-soft text-primary", bar: "bg-primary" },
};

export type DashboardCourse = {
  enrollmentId: number;
  courseId: number;
  name: string;
  subtitle: string;
  glyph: string;
  tone: Tone;
  pct: number;
  completed: number;
  total: number;
  lastActivity?: string;
  nextLesson?: { id: number; title: string; moduleTitle: string };
};

function glyphFor(name: string, shortName?: string) {
  if (shortName) return shortName.slice(0, 3);
  const letters = name
    .split(/\s+/)
    .filter((word) => /\p{L}/u.test(word[0] ?? ""))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
  return letters || name.slice(0, 2);
}

function lastActivityOf(enrollment: Enrollment) {
  const progress = enrollment.progress;
  return (
    progress?.progress_snapshot?.last_updated_at ??
    progress?.last_computed_at ??
    progress?.updated_at ??
    enrollment.activated_at ??
    undefined
  );
}

function nextLessonOf(enrollment: Enrollment) {
  const lessons = enrollment.progress?.progress_snapshot?.lessons ?? [];
  const next =
    lessons.find((lesson) => lesson.status === "in_progress") ??
    lessons.find((lesson) => lesson.status === "not_started");
  return next
    ? { id: next.lesson_id, title: next.lesson_title, moduleTitle: next.module_title }
    : undefined;
}

// Active enrollments, most recently studied first.
export function toDashboardCourses(enrollments: Enrollment[]): DashboardCourse[] {
  return enrollments
    .filter((enrollment) => enrollment.status === "active" && enrollment.course)
    .map((enrollment) => ({ enrollment, lastActivity: lastActivityOf(enrollment) }))
    .sort(
      (left, right) =>
        new Date(right.lastActivity ?? 0).getTime() -
        new Date(left.lastActivity ?? 0).getTime(),
    )
    .map(({ enrollment, lastActivity }, index) => {
      const course = enrollment.course!;
      const progress = enrollment.progress;
      return {
        enrollmentId: enrollment.id,
        courseId: enrollment.course_id,
        name: course.course_name,
        subtitle: course.department?.department_name ?? course.course_code,
        glyph: glyphFor(course.course_name, course.short_name),
        tone: TONES[index % TONES.length],
        pct: Math.round(progress?.completion_percentage ?? 0),
        completed: progress?.completed_item_count ?? 0,
        total: progress?.total_item_count ?? 0,
        lastActivity,
        nextLesson: nextLessonOf(enrollment),
      };
    });
}

// The "Học tiếp" spotlight: most recently studied course that isn't finished.
export function pickSpotlight(courses: DashboardCourse[]) {
  return courses.find((course) => course.pct < 100) ?? courses[0];
}

export function overallProgress(courses: DashboardCourse[]) {
  const completed = courses.reduce((sum, course) => sum + course.completed, 0);
  const total = courses.reduce((sum, course) => sum + course.total, 0);
  return { completed, total, pct: total ? Math.round((completed / total) * 100) : 0 };
}
