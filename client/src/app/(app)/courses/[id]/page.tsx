"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, ChevronDown, Play, Star } from "lucide-react";

import { useCourse, useEnrollCourse, useMyEnrollments } from "../_feature/hooks";
import { usePublishedContentStructure } from "../_feature/content-versions/hooks";
import {
  currentLessonId,
  flattenLessons,
  lessonMinutes,
  lessonState,
  lessonStatuses,
  sortedModules,
  type LessonState,
} from "../_feature/curriculum";
import { statusMeta, toStudentCourses } from "../_feature/student-course";
import { useAssessments } from "@/app/(app)/assessments/_feature/hooks";
import {
  assessmentCourseId,
  assessmentTypeLabel,
} from "@/app/(app)/assessments/_feature/model";
import { useEnrollmentProgress } from "@/_shared/progress/hooks";
import { AccessNotice } from "@/components/edu/access-notice";
import {
  LoadError,
  PageSkeleton,
  Pill,
  ProgressBar,
  SectionTitle,
  buttonClass,
  surface,
} from "@/components/edu/ui";
import { usePageHeader } from "@/components/layout/page-header";
import { isAccessError } from "@/lib/api-error";
import { dateVi, minutesVi, relativeTimeVi } from "@/lib/format-vi";
import { cn } from "@/lib/utils";
import type { CourseModule, LessonProgressStatus } from "@/types/models";

// STU-03 Course Detail (design: Desktop - Student, 7c).

const lessonIcon: Record<LessonState, { box: string; label: string }> = {
  done: { box: "bg-success text-white", label: "Đã hoàn thành" },
  current: { box: "bg-primary text-white", label: "Đang học" },
  todo: { box: "border-2 border-line bg-white text-muted-foreground", label: "Chưa học" },
};

function ModuleBlock({
  courseModule,
  index,
  statuses,
  currentId,
  courseId,
  canLearn,
  enrolled,
  open,
  onToggle,
}: {
  courseModule: CourseModule;
  index: number;
  statuses: Map<number, LessonProgressStatus>;
  currentId?: number;
  courseId: number;
  canLearn: boolean;
  enrolled: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const lessons = courseModule.lessons ?? [];
  const done = lessons.filter((lesson) => statuses.get(lesson.id) === "completed").length;
  const hasCurrent = lessons.some((lesson) => lesson.id === currentId);
  const state = lessons.length && done === lessons.length ? "done" : hasCurrent ? "current" : "todo";
  const sub = !enrolled
    ? `${lessons.length} bài học`
    : state === "done"
      ? `Đã hoàn thành · ${done}/${lessons.length}`
      : state === "current"
        ? `Đang học · ${done}/${lessons.length}`
        : `Chưa bắt đầu · ${done}/${lessons.length}`;
  const panelId = `module-${courseModule.id}`;

  return (
    <div className={cn(surface, "overflow-hidden rounded-2xl")}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-background"
      >
        <span
          aria-hidden
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-[13px] font-bold",
            state === "done"
              ? "bg-success-soft text-success-strong"
              : state === "current"
                ? "bg-primary-soft text-primary-strong"
                : "bg-muted text-ink-2",
          )}
        >
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-ink">{courseModule.title}</span>
          <span className="block text-xs text-muted-foreground">{sub}</span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn("h-5 w-5 shrink-0 transition-transform motion-reduce:transition-none", open && "rotate-180")}
        />
      </button>
      {open ? (
        <ul id={panelId} className="grid border-t border-line sm:grid-cols-2">
          {lessons.map((lesson) => {
            const lessonStateValue = enrolled ? lessonState(lesson.id, statuses, currentId) : "todo";
            const icon = lessonIcon[lessonStateValue];
            const minutes = lessonMinutes(lesson);
            const body = (
              <>
                <span
                  aria-hidden
                  className={cn("grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full", icon.box)}
                >
                  {lessonStateValue === "done" ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : lessonStateValue === "current" ? (
                    <Play className="h-3 w-3 fill-current" strokeWidth={0} />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block break-words text-sm font-semibold text-ink">{lesson.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {[minutes ? minutesVi(minutes) : null, enrolled ? icon.label : null].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </>
            );
            const rowClass = cn(
              "flex h-full items-start gap-3 px-4 py-3",
              lessonStateValue === "current" && "bg-primary-soft",
            );
            return (
              <li key={lesson.id} className="border-b border-line">
                {canLearn ? (
                  <Link
                    href={`/courses/${courseId}/lessons/${lesson.id}`}
                    className={cn(rowClass, "transition-colors hover:bg-background", lessonStateValue === "current" && "hover:bg-primary-soft/70")}
                  >
                    {body}
                  </Link>
                ) : (
                  <div className={rowClass}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const courseId = Number(id);

  const courseQuery = useCourse(courseId);
  const structureQuery = usePublishedContentStructure(courseId);
  const { data: enrollments = [] } = useMyEnrollments();
  const enrollment = enrollments.find(
    (item) => item.course_id === courseId && item.status !== "rejected",
  );
  const { data: progressDetail } = useEnrollmentProgress(enrollment?.id ?? 0);
  const { data: assessments = [] } = useAssessments();
  const enroll = useEnrollCourse();
  const [openModules, setOpenModules] = useState<Set<number> | null>(null);
  const [now] = useState(() => Date.now());

  const course = courseQuery.data;
  usePageHeader(undefined, [
    { label: "Khoá học của tôi", href: "/courses" },
    { label: course?.course_name ?? "Chi tiết khoá học" },
  ]);

  const student = enrollment ? toStudentCourses([enrollment])[0] : undefined;
  const modules = useMemo(() => sortedModules(structureQuery.data?.structure), [structureQuery.data]);
  const flat = useMemo(() => flattenLessons(modules), [modules]);
  const statuses = useMemo(() => lessonStatuses(enrollment, progressDetail), [enrollment, progressDetail]);
  const currentId = enrollment ? currentLessonId(flat, statuses) : undefined;
  const currentLesson = flat.find(({ lesson }) => lesson.id === currentId);
  const doneCount = flat.filter(({ lesson }) => statuses.get(lesson.id) === "completed").length;
  const canLearn =
    !!student && ["IN_PROGRESS", "NOT_STARTED", "COMPLETED"].includes(student.status);

  const courseAssessments = useMemo(
    () =>
      assessments
        .filter((assessment) => assessmentCourseId(assessment) === courseId)
        .sort(
          (a, b) =>
            new Date(a.close_at ?? "9999-12-31").getTime() - new Date(b.close_at ?? "9999-12-31").getTime(),
        )
        .slice(0, 5),
    [assessments, courseId],
  );
  const reviews = course?.reviews ?? [];
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  // Default: open the chapter holding the current lesson (or the first one).
  const defaultOpen = currentLesson?.module.id ?? modules[0]?.id;
  const isOpen = (moduleId: number) => (openModules ? openModules.has(moduleId) : moduleId === defaultOpen);
  const toggleModule = (moduleId: number) =>
    setOpenModules((previous) => {
      const next = new Set(previous ?? (defaultOpen ? [defaultOpen] : []));
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });

  if (courseQuery.isLoading) return <PageSkeleton label="Đang tải khoá học" />;
  if (isAccessError(courseQuery.error) || (!courseQuery.isLoading && !course && !courseQuery.isError)) {
    return (
      <AccessNotice
        title="Khoá học này hiện không khả dụng."
        message="Khoá học có thể đã kết thúc, đang tạm ẩn hoặc chưa đến thời gian mở. Kết quả đã đạt được của bạn vẫn được lưu."
        ctaLabel="Về Khoá học của tôi"
        ctaHref="/courses"
      />
    );
  }
  if (courseQuery.isError || !course) {
    return <LoadError title="Không tải được khoá học." onRetry={() => courseQuery.refetch()} />;
  }

  const meta = student ? statusMeta[student.status] : undefined;
  const nextHref = currentLesson
    ? `/courses/${courseId}/lessons/${currentLesson.lesson.id}`
    : flat[0]
      ? `/courses/${courseId}/lessons/${flat[0].lesson.id}`
      : undefined;
  const totalItems = student?.total || 0;
  const pct = student?.pct ?? 0;

  const handleEnroll = async () => {
    try {
      await enroll.mutateAsync(courseId);
      toast.success("Đã ghi danh khoá học.");
    } catch {
      toast.error("Không ghi danh được. Vui lòng thử lại.");
    }
  };

  const infoRows = [
    ["Mã khoá học", course.course_code],
    ["Loại", course.course_type],
    ["Tín chỉ", course.credit ? String(course.credit) : ""],
    ["Thời lượng", course.duration_hours ? `${course.duration_hours} giờ` : ""],
    ["Khoa / Bộ môn", course.department?.department_name ?? ""],
    [
      "Thời gian",
      course.effective_from && course.effective_to
        ? `${dateVi(course.effective_from)} – ${dateVi(course.effective_to)}`
        : "",
    ],
  ].filter(([, value]) => value);

  return (
    <div className="grid content-start gap-5">
      <section className="relative flex flex-col gap-6 overflow-hidden rounded-[20px] bg-secondary-soft p-6 lg:flex-row lg:items-center lg:gap-7 lg:px-7">
        <div aria-hidden className="absolute -top-[120px] right-[260px] h-[220px] w-[220px] rounded-full bg-white/50" />
        <div className="relative flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {meta ? <Pill tone={meta.tone}>{meta.label}</Pill> : <Pill>Chưa ghi danh</Pill>}
            <span className="text-xs font-semibold text-ink-2">
              {[course.course_code, course.department?.department_name].filter(Boolean).join(" · ")}
            </span>
          </div>
          <h1 className="text-balance font-display text-[28px] font-bold leading-tight">{course.course_name}</h1>
          {course.short_name && course.short_name !== course.course_name ? (
            <div className="text-[13px] text-ink-2">{course.short_name}</div>
          ) : null}
          {student && totalItems ? (
            <div
              role="img"
              aria-label={`Đã hoàn thành ${pct} phần trăm, ${student.completed} trên ${totalItems} hoạt động`}
              className="mt-1 flex max-w-[520px] items-center gap-3"
            >
              <ProgressBar pct={pct} className="bg-secondary" track="bg-white" />
              <b className="text-[13px] tabular-nums">{pct}%</b>
              <span className="text-xs tabular-nums text-ink-2">
                {student.completed} / {totalItems} hoạt động
              </span>
            </div>
          ) : null}
        </div>
        <div className="relative flex w-full flex-col gap-1.5 lg:w-[260px]">
          {!student ? (
            course.status === "active" ? (
              <>
                <button
                  type="button"
                  onClick={handleEnroll}
                  disabled={enroll.isPending}
                  className={buttonClass("primary", "lg")}
                >
                  {enroll.isPending ? "Đang ghi danh…" : "Ghi danh khoá học"}
                </button>
                <div className="text-center text-xs text-ink-2">Ghi danh để bắt đầu học</div>
              </>
            ) : null
          ) : meta?.kind === "disabled" ? (
            <span aria-disabled className={cn(buttonClass("outline", "lg"), "border-dashed bg-white/60 text-muted-foreground")}>
              {meta.cta}
            </span>
          ) : nextHref && canLearn ? (
            <>
              <Link href={nextHref} className={buttonClass(meta?.kind === "outline" ? "outline" : "primary", "lg")}>
                {meta?.kind === "outline" ? null : (
                  <Play aria-hidden className="h-4 w-4 fill-current" strokeWidth={0} />
                )}
                {meta?.kind === "outline" ? "Ôn tập" : meta?.cta}
              </Link>
              {currentLesson && meta?.kind !== "outline" ? (
                <div className="text-center text-xs text-ink-2">{currentLesson.lesson.title}</div>
              ) : null}
            </>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="curriculum-title" className="grid content-start gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="curriculum-title" className="text-[17px] font-bold">Nội dung khoá học</h2>
            {modules.length ? (
              <span className="text-xs text-muted-foreground">
                {modules.length} chương · {flat.length} bài học
                {student ? ` · đã xong ${doneCount}` : ""}
              </span>
            ) : null}
          </div>
          {structureQuery.isLoading ? (
            <div className={cn(surface, "h-40 motion-safe:animate-pulse")} />
          ) : !modules.length ? (
            <div className={cn(surface, "px-5 py-8 text-center text-sm text-ink-2")}>
              Khoá học chưa có nội dung được công bố. Nội dung sẽ xuất hiện ở đây khi giáo viên hoàn tất.
            </div>
          ) : (
            modules.map((courseModule, index) => (
              <ModuleBlock
                key={courseModule.id}
                courseModule={courseModule}
                index={index}
                statuses={statuses}
                currentId={currentId}
                courseId={courseId}
                canLearn={canLearn}
                enrolled={!!student}
                open={isOpen(courseModule.id)}
                onToggle={() => toggleModule(courseModule.id)}
              />
            ))
          )}
          {student && modules.length ? (
            <p className="px-1 text-[11px] text-muted-foreground">
              Trạng thái hoàn thành do hệ thống ghi nhận, chỉ để xem.
            </p>
          ) : null}
        </section>

        <aside className="grid content-start gap-4">
          {course.description ? (
            <section className={cn(surface, "flex flex-col gap-2.5 p-4")}>
              <h2 className="text-[15px] font-bold">Giới thiệu</h2>
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink-2">{course.description}</p>
            </section>
          ) : null}

          {courseAssessments.length ? (
            <section className={cn(surface, "flex flex-col gap-3 p-4")}>
              <SectionTitle
                aside={
                  <Link href="/assessments" className="text-xs font-semibold text-secondary hover:underline">
                    Tất cả
                  </Link>
                }
              >
                <span className="text-[15px]">Bài kiểm tra &amp; hạn nộp</span>
              </SectionTitle>
              <ul className="grid gap-3">
                {courseAssessments.map((assessment) => {
                  const closeAt = assessment.close_at ? new Date(assessment.close_at) : null;
                  const soon = closeAt
                    ? closeAt.getTime() - now < 3 * 86400000 && closeAt.getTime() > now
                    : false;
                  return (
                    <li key={assessment.id}>
                      <Link
                        href={`/assessments/${assessment.id}/attempt`}
                        className="flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-background"
                      >
                        <span
                          className={cn(
                            "w-12 shrink-0 rounded-xl py-1.5 text-center",
                            soon ? "bg-warning-soft text-warning" : "bg-background text-ink-2",
                          )}
                        >
                          <span className="block text-base font-bold leading-none tabular-nums">
                            {closeAt ? String(closeAt.getDate()).padStart(2, "0") : "—"}
                          </span>
                          <span className="block text-[10px] font-semibold">
                            {closeAt ? `TH${closeAt.getMonth() + 1}` : "Mở"}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-ink">{assessment.title}</span>
                          <span className="block text-xs text-muted-foreground">
                            {[
                              assessmentTypeLabel[assessment.assessment_type],
                              assessment.time_limit_minutes ? minutesVi(assessment.time_limit_minutes) : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {infoRows.length ? (
            <section className={cn(surface, "flex flex-col gap-2 p-4")}>
              <h2 className="text-[15px] font-bold">Thông tin khoá học</h2>
              <dl className="text-[13px]">
                {infoRows.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3 border-b border-line py-2 last:border-0">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {reviews.length ? (
            <section className={cn(surface, "flex flex-col gap-3 p-4")}>
              <div className="flex items-baseline justify-between">
                <h2 className="text-[15px] font-bold">Đánh giá của học viên</h2>
                <span className="flex items-center gap-1 text-[13px] font-bold">
                  <Star aria-hidden className="h-4 w-4 fill-highlight text-highlight" />
                  {averageRating.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}
                  <span className="font-normal text-muted-foreground">({reviews.length})</span>
                </span>
              </div>
              <ul className="grid gap-3">
                {reviews.slice(0, 3).map((review) => (
                  <li key={review.id} className="text-[13px] leading-relaxed">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-ink-2">
                        {/* API payloads are snake_cased: student.full_name */}
                        {(review.student as { full_name?: string } | undefined)?.full_name ?? "Học viên"} ·{" "}
                        {review.rating}/5
                      </span>
                      {review.created_at ? <span>{relativeTimeVi(review.created_at)}</span> : null}
                    </div>
                    {review.review_text ? <p className="mt-0.5 text-ink-2">{review.review_text}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
