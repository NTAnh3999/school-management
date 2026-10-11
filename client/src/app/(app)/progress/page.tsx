"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChartLine, Check, Play } from "lucide-react";

import { useMyEnrollments } from "@/app/(app)/courses/_feature/hooks";
import {
  isLearning,
  primaryHref,
  statusMeta,
  toStudentCourses,
  toneClasses,
} from "@/app/(app)/courses/_feature/student-course";
import { overallProgress } from "@/app/(app)/dashboard/_feature/model";
import {
  EmptyState,
  FilterChip,
  LoadError,
  PageSkeleton,
  Pill,
  ProgressBar,
  buttonClass,
  surface,
} from "@/components/edu/ui";
import { dayTimeVi, relativeTimeVi } from "@/lib/format-vi";
import { cn } from "@/lib/utils";

// STU-07 My Progress (design: Desktop - Student, 7g). Pace badges and
// milestones need schedule data the API doesn't expose yet, so they're left
// out; recent activity comes from completed lessons in progress snapshots.

export default function MyProgressPage() {
  const { data: enrollments = [], isLoading, isError, refetch } = useMyEnrollments();
  const [filter, setFilter] = useState<number | "all">("all");

  const courses = useMemo(
    () =>
      toStudentCourses(enrollments).filter(
        (course) => isLearning(course) || course.status === "COMPLETED",
      ),
    [enrollments],
  );
  const visible = filter === "all" ? courses : courses.filter((course) => course.enrollmentId === filter);
  const overall = overallProgress(visible);
  const learningCount = visible.filter(isLearning).length;
  const completedCount = visible.filter((course) => course.status === "COMPLETED").length;
  const updatedAt = visible
    .map((course) => course.enrollment.progress?.last_computed_at)
    .filter((value): value is string => !!value)
    .sort()
    .pop();

  const nudge = [...visible]
    .filter((course) => isLearning(course) && course.total > 0)
    .sort((a, b) => a.pct - b.pct)[0];

  const recent = visible
    .flatMap((course) =>
      course.completedLessons
        .filter((lesson) => lesson.completion_date)
        .map((lesson) => ({ lesson, course })),
    )
    .sort(
      (a, b) =>
        new Date(b.lesson.completion_date!).getTime() - new Date(a.lesson.completion_date!).getTime(),
    )
    .slice(0, 6);

  if (isLoading) return <PageSkeleton label="Đang tải tiến độ" />;
  if (isError) return <LoadError title="Không tải được tiến độ học tập." onRetry={() => refetch()} />;

  if (!courses.length) {
    return (
      <EmptyState
        icon={ChartLine}
        title="Bắt đầu một khoá học để xem tiến độ ở đây."
        description="Mỗi bài bạn hoàn thành sẽ được ghi lại và tổng hợp tại trang này."
        className={cn(surface, "mx-auto max-w-[640px]")}
      >
        <Link href="/courses" className={buttonClass("primary", "md")}>
          Xem khoá học của tôi
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="grid content-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid min-w-0 content-start gap-[18px]">
        <section className="flex flex-col gap-5 rounded-[20px] bg-primary px-6 py-5 text-primary-foreground sm:flex-row sm:items-center sm:gap-6">
          <div
            role="img"
            aria-label={`Hoàn thành ${overall.pct} phần trăm, ${overall.completed} trên ${overall.total} hoạt động`}
            className="grid h-24 w-24 shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(#fff 0 ${overall.pct}%, rgba(255,255,255,.22) 0)` }}
          >
            <div className="grid h-[76px] w-[76px] place-items-center rounded-full bg-primary text-2xl font-bold tabular-nums">
              {overall.pct}%
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xl font-bold tabular-nums">
              {overall.completed} / {overall.total} hoạt động
            </div>
            <div className="text-[13px] opacity-90">
              {[learningCount ? `${learningCount} khoá đang học` : null, completedCount ? `${completedCount} khoá đã hoàn thành` : null]
                .filter(Boolean)
                .join(" · ")}
            </div>
            {updatedAt ? <div className="mt-1.5 text-xs opacity-90">Cập nhật: {dayTimeVi(updatedAt)}</div> : null}
          </div>
        </section>

        {courses.length > 1 ? (
          <div className="flex flex-wrap gap-2" aria-label="Lọc theo khoá học" role="group">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
              Tất cả
            </FilterChip>
            {courses.map((course) => (
              <FilterChip
                key={course.enrollmentId}
                active={filter === course.enrollmentId}
                onClick={() => setFilter(course.enrollmentId)}
              >
                {course.name}
              </FilterChip>
            ))}
          </div>
        ) : null}

        <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {visible.map((course) => {
            const tone = toneClasses[course.tone];
            const meta = statusMeta[course.status];
            return (
              <li key={course.enrollmentId}>
                <Link
                  href={`/courses/${course.courseId}`}
                  className={cn(surface, "flex h-full flex-col gap-3 p-4 transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-mentor")}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span aria-hidden className={cn("grid h-10 w-10 place-items-center rounded-xl font-bold", tone.tile)}>
                      {course.glyph}
                    </span>
                    <Pill tone={meta.tone} icon={course.status === "COMPLETED" ? Check : undefined}>
                      {meta.label}
                    </Pill>
                  </span>
                  <span>
                    <span className="block break-words text-[15px] font-bold leading-snug text-ink">{course.name}</span>
                    <span className="block text-xs tabular-nums text-muted-foreground">
                      {course.total ? `${course.completed}/${course.total} hoạt động` : "Chưa có dữ liệu tiến độ"}
                    </span>
                  </span>
                  <span
                    role="img"
                    aria-label={`${course.name}: ${course.pct} phần trăm`}
                    className="flex items-center gap-2.5"
                  >
                    <ProgressBar pct={course.pct} className={course.pct >= 100 ? "bg-success" : tone.bar} />
                    <b className="text-[13px] tabular-nums">{course.pct}%</b>
                  </span>
                  <span className="mt-auto text-xs text-ink-2">
                    {course.status === "COMPLETED"
                      ? "Đã hoàn thành khoá học"
                      : course.nextLesson
                        ? `Tiếp theo: ${course.nextLesson.title}`
                        : "Chưa có bài học được công bố"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="grid content-start gap-4">
        {nudge ? (
          <section className="flex flex-col gap-3 rounded-[18px] bg-highlight-soft p-[18px]">
            <div className="text-xs font-bold text-highlight-strong">{nudge.name}</div>
            <h2 className="text-base font-bold">Cùng quay lại với {nudge.name} nhé!</h2>
            <p className="text-[13px] leading-normal text-ink-2">
              Còn {Math.max(0, nudge.total - nudge.completed)} hoạt động để hoàn thành khoá học
              {nudge.nextLesson ? `. Bài tiếp theo: ${nudge.nextLesson.title}.` : "."}
            </p>
            <Link href={primaryHref(nudge)} className={buttonClass("primary", "lg")}>
              <Play aria-hidden className="h-4 w-4 fill-current" strokeWidth={0} />
              {statusMeta[nudge.status].cta}
            </Link>
          </section>
        ) : null}

        <section className={cn(surface, "flex flex-col gap-3 p-[18px]")}>
          <h2 className="text-base font-bold">Hoạt động gần đây</h2>
          {recent.length ? (
            <ul className="grid gap-3">
              {recent.map(({ lesson, course }) => (
                <li key={`${course.enrollmentId}-${lesson.lesson_id}`} className="flex items-start gap-2.5 text-[13px]">
                  <span aria-hidden className="mt-[5px] h-2 w-2 shrink-0 rounded-full bg-success" />
                  <span className="min-w-0 flex-1">
                    <b className="font-semibold text-success-strong">Hoàn thành</b> {lesson.lesson_title}
                    <span className="block text-xs text-muted-foreground">{course.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {relativeTimeVi(lesson.completion_date!)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-ink-2">Chưa có bài học nào được hoàn thành.</p>
          )}
        </section>
      </aside>
    </div>
  );
}
