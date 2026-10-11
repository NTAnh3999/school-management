import type {
  CourseModule,
  Enrollment,
  Lesson,
  LessonProgressStatus,
} from "@/types/models";

// Curriculum helpers shared by Course Detail and the Learning Player. The
// structure always comes from the *published* content version
// (GET /content/courses/:id/published), never GET /courses/:id, which mixes
// modules from every version including drafts.

export type LessonState = "done" | "current" | "todo";

export type FlatLesson = {
  lesson: Lesson;
  module: CourseModule;
  moduleIndex: number;
};

export function sortedModules(modules: CourseModule[] = []) {
  return [...modules]
    .sort((a, b) => a.display_order - b.display_order)
    .map((courseModule) => ({
      ...courseModule,
      lessons: [...(courseModule.lessons ?? [])].sort((a, b) => a.display_order - b.display_order),
    }));
}

export function flattenLessons(modules: CourseModule[]): FlatLesson[] {
  return modules.flatMap((courseModule, moduleIndex) =>
    (courseModule.lessons ?? []).map((lesson) => ({ lesson, module: courseModule, moduleIndex })),
  );
}

// Lesson statuses: GET /progress/enrollment/:id (lesson_progress) wins over
// the snapshot embedded in GET /courses/my/enrollments.
export function lessonStatuses(enrollment?: Enrollment, detail?: Enrollment) {
  const statuses = new Map<number, LessonProgressStatus>();
  for (const lesson of enrollment?.progress?.progress_snapshot?.lessons ?? []) {
    statuses.set(lesson.lesson_id, lesson.status);
  }
  for (const lesson of detail?.lesson_progress ?? []) {
    statuses.set(lesson.lesson_id, lesson.status);
  }
  return statuses;
}

export function currentLessonId(
  flat: FlatLesson[],
  statuses: Map<number, LessonProgressStatus>,
) {
  return (
    flat.find(({ lesson }) => statuses.get(lesson.id) === "in_progress")?.lesson.id ??
    flat.find(({ lesson }) => statuses.get(lesson.id) !== "completed")?.lesson.id
  );
}

export function lessonState(
  lessonId: number,
  statuses: Map<number, LessonProgressStatus>,
  currentId?: number,
): LessonState {
  if (statuses.get(lessonId) === "completed") return "done";
  if (lessonId === currentId) return "current";
  return "todo";
}

export function lessonMinutes(lesson: Lesson) {
  return lesson.duration_minutes ?? lesson.estimated_duration ?? undefined;
}
