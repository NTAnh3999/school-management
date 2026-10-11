import type { Tone } from "@/components/edu/ui";
import type { Enrollment, ProgressSnapshotLesson } from "@/types/models";

// Student-facing view of an enrollment, shared by Dashboard, My Courses,
// Course Detail and My Progress (design: Desktop - Student, STATUS map).

export type CourseTone = "secondary" | "highlight" | "primary";

// Course tiles cycle through the three tenant tones. Tile text uses the
// strong variant where the base tone is under 4.5:1 on its soft tint.
const TONES: CourseTone[] = ["secondary", "highlight", "primary"];

export const toneClasses: Record<CourseTone, { tile: string; bar: string; hero: string }> = {
  secondary: { tile: "bg-secondary-soft text-secondary", bar: "bg-secondary", hero: "bg-secondary-soft" },
  highlight: { tile: "bg-highlight-soft text-highlight-strong", bar: "bg-highlight", hero: "bg-highlight-soft" },
  primary: { tile: "bg-primary-soft text-primary-strong", bar: "bg-primary", hero: "bg-primary-soft" },
};

export type StudentCourseStatus =
  | "IN_PROGRESS"
  | "NOT_STARTED"
  | "UPCOMING"
  | "PENDING"
  | "COMPLETED"
  | "ACCESS_ENDED";

export const STATUS_ORDER: StudentCourseStatus[] = [
  "IN_PROGRESS",
  "NOT_STARTED",
  "UPCOMING",
  "PENDING",
  "COMPLETED",
  "ACCESS_ENDED",
];

export const statusMeta: Record<
  StudentCourseStatus,
  { label: string; tone: Tone; cta: string; kind: "primary" | "outline" | "disabled" }
> = {
  IN_PROGRESS: { label: "Đang học", tone: "primary", cta: "Học tiếp", kind: "primary" },
  NOT_STARTED: { label: "Chưa bắt đầu", tone: "highlight", cta: "Bắt đầu học", kind: "primary" },
  UPCOMING: { label: "Sắp mở", tone: "secondary", cta: "Chưa đến ngày mở", kind: "disabled" },
  PENDING: { label: "Chờ duyệt", tone: "secondary", cta: "Đang chờ nhà trường duyệt", kind: "disabled" },
  COMPLETED: { label: "Đã hoàn thành", tone: "success", cta: "Ôn tập", kind: "outline" },
  ACCESS_ENDED: { label: "Đã kết thúc", tone: "neutral", cta: "Xem khoá học", kind: "outline" },
};

export type StudentCourse = {
  enrollment: Enrollment;
  enrollmentId: number;
  courseId: number;
  name: string;
  code: string;
  subtitle: string;
  description?: string;
  glyph: string;
  tone: CourseTone;
  status: StudentCourseStatus;
  pct: number;
  completed: number;
  total: number;
  lastActivity?: string;
  nextLesson?: { id: number; title: string; moduleTitle: string };
  completedLessons: ProgressSnapshotLesson[];
  startsAt?: string;
  endsAt?: string;
};

export function glyphFor(name: string, shortName?: string) {
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

export function statusOf(enrollment: Enrollment, now = new Date()): StudentCourseStatus {
  switch (enrollment.status) {
    case "pending":
    case "waitlisted":
      return "PENDING";
    case "completed":
      return "COMPLETED";
    case "suspended":
    case "cancelled":
    case "rejected":
      return "ACCESS_ENDED";
  }
  const course = enrollment.course;
  const progress = enrollment.progress;
  if (course?.effective_from && new Date(course.effective_from) > now) return "UPCOMING";
  if (progress?.status === "completed" || (progress?.completion_percentage ?? 0) >= 100) {
    return "COMPLETED";
  }
  if (course?.effective_to && new Date(course.effective_to) < now) return "ACCESS_ENDED";
  const started =
    (progress?.completion_percentage ?? 0) > 0 ||
    !!progress?.started_at ||
    (progress?.progress_snapshot?.lessons ?? []).some((lesson) => lesson.status !== "not_started");
  return started ? "IN_PROGRESS" : "NOT_STARTED";
}

// All visible enrollments (rejected ones are hidden), most recently studied
// first within the design's status order.
export function toStudentCourses(enrollments: Enrollment[]): StudentCourse[] {
  return enrollments
    .filter((enrollment) => enrollment.course && enrollment.status !== "rejected")
    .map((enrollment) => ({ enrollment, lastActivity: lastActivityOf(enrollment) }))
    .sort(
      (left, right) =>
        new Date(right.lastActivity ?? 0).getTime() - new Date(left.lastActivity ?? 0).getTime(),
    )
    .map(({ enrollment, lastActivity }, index) => {
      const course = enrollment.course!;
      const progress = enrollment.progress;
      const lessons = progress?.progress_snapshot?.lessons ?? [];
      return {
        enrollment,
        enrollmentId: enrollment.id,
        courseId: enrollment.course_id,
        name: course.course_name,
        code: course.course_code,
        subtitle: course.department?.department_name ?? course.course_code,
        description: course.description,
        glyph: glyphFor(course.course_name, course.short_name),
        tone: TONES[index % TONES.length],
        status: statusOf(enrollment),
        pct: Math.round(progress?.completion_percentage ?? 0),
        completed: progress?.completed_item_count ?? 0,
        total: progress?.total_item_count ?? 0,
        lastActivity,
        nextLesson: nextLessonOf(enrollment),
        completedLessons: lessons.filter((lesson) => lesson.status === "completed"),
        startsAt: course.effective_from,
        endsAt: course.effective_to,
      };
    })
    .sort((left, right) => STATUS_ORDER.indexOf(left.status) - STATUS_ORDER.indexOf(right.status));
}

// Where the course's primary CTA leads: the next lesson when learning,
// otherwise the course page.
export function primaryHref(course: StudentCourse) {
  const meta = statusMeta[course.status];
  if (meta.kind === "primary" && course.nextLesson) {
    return `/courses/${course.courseId}/lessons/${course.nextLesson.id}`;
  }
  return `/courses/${course.courseId}`;
}

export function isLearning(course: StudentCourse) {
  return course.status === "IN_PROGRESS" || course.status === "NOT_STARTED";
}
