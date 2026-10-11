"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Compass, Play, Search, SearchX } from "lucide-react";

import { useMyEnrollments } from "./_feature/hooks";
import {
  primaryHref,
  statusMeta,
  toStudentCourses,
  toneClasses,
  type StudentCourse,
  type StudentCourseStatus,
} from "./_feature/student-course";
import {
  EmptyState,
  FilterChip,
  LoadError,
  PageSkeleton,
  Pill,
  ProgressBar,
  buttonClass,
  matchesQuery,
  surface,
} from "@/components/edu/ui";
import { dateVi } from "@/lib/format-vi";
import { useMediaQuery, WIDE_QUERY } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

// STU-02 My Courses (design: Desktop - Student, 7b) — master-detail on
// desktop, a plain list linking to course detail below 1280px.

type TabKey = "active" | "upcoming" | "done" | "all";

const TABS: Array<{ key: TabKey; label: string; match: StudentCourseStatus[] }> = [
  { key: "active", label: "Đang học", match: ["IN_PROGRESS", "NOT_STARTED"] },
  { key: "upcoming", label: "Sắp mở", match: ["UPCOMING", "PENDING"] },
  { key: "done", label: "Đã xong", match: ["COMPLETED", "ACCESS_ENDED"] },
  {
    key: "all",
    label: "Tất cả",
    match: ["IN_PROGRESS", "NOT_STARTED", "UPCOMING", "PENDING", "COMPLETED", "ACCESS_ENDED"],
  },
];

function datesText(course: StudentCourse) {
  if (course.status === "UPCOMING" && course.startsAt) return `Mở ${dateVi(course.startsAt)}`;
  if (course.status === "COMPLETED" && course.enrollment.completed_at) {
    return `Hoàn thành ${dateVi(course.enrollment.completed_at)}`;
  }
  if (course.startsAt && course.endsAt) return `${dateVi(course.startsAt)} – ${dateVi(course.endsAt)}`;
  if (course.endsAt) return `Đến ${dateVi(course.endsAt)}`;
  return "";
}

function CourseCta({ course, size = "lg" }: { course: StudentCourse; size?: "lg" | "md" }) {
  const meta = statusMeta[course.status];
  if (meta.kind === "disabled") {
    return (
      <span aria-disabled className={cn(buttonClass("outline", size), "border-dashed bg-background text-muted-foreground")}>
        {course.status === "UPCOMING" && course.startsAt ? `Mở vào ${dateVi(course.startsAt)}` : meta.cta}
      </span>
    );
  }
  return (
    <Link href={primaryHref(course)} className={buttonClass(meta.kind === "primary" ? "primary" : "outline", size)}>
      {meta.kind === "primary" ? <Play aria-hidden className="h-4 w-4 fill-current" strokeWidth={0} /> : null}
      {meta.cta}
    </Link>
  );
}

function CourseRowBody({ course }: { course: StudentCourse }) {
  const meta = statusMeta[course.status];
  const tone = toneClasses[course.tone];
  const nextLine = course.nextLesson ? `Tiếp theo: ${course.nextLesson.title}` : datesText(course);
  return (
    <>
      <span aria-hidden className={cn("grid h-14 w-14 place-items-center rounded-[14px] text-[17px] font-bold", tone.tile)}>
        {course.glyph}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <Pill tone={meta.tone}>{meta.label}</Pill>
          <span className="text-xs text-muted-foreground">{course.subtitle}</span>
        </span>
        <span className="break-words text-[15px] font-bold leading-snug text-ink">{course.name}</span>
        {nextLine ? <span className="text-xs text-ink-2">{nextLine}</span> : null}
      </span>
      <span className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
        <span className="flex justify-between text-xs">
          <b className="tabular-nums">{course.total ? `${course.pct}%` : "Chưa có dữ liệu"}</b>
          {course.total ? (
            <span className="tabular-nums text-muted-foreground">
              {course.completed}/{course.total} hoạt động
            </span>
          ) : null}
        </span>
        <ProgressBar pct={course.pct} className={course.pct >= 100 ? "bg-success" : tone.bar} />
      </span>
    </>
  );
}

function CourseDetailPanel({ course }: { course: StudentCourse }) {
  const meta = statusMeta[course.status];
  const tone = toneClasses[course.tone];
  const dates = datesText(course);
  return (
    <aside
      aria-label={`Thông tin khoá ${course.name}`}
      className={cn(surface, "sticky top-0 flex flex-col gap-4 p-6")}
    >
      <div aria-hidden className={cn("relative grid h-[140px] place-items-center overflow-hidden rounded-[18px] text-[40px] font-bold", tone.tile)}>
        <span className="absolute -right-8 -top-10 h-[120px] w-[120px] rounded-full bg-white/50" />
        <span className="relative">{course.glyph}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <Pill tone={meta.tone} className="self-start">{meta.label}</Pill>
        <h2 className="font-display text-[21px] font-bold leading-snug">{course.name}</h2>
        <div className="text-[13px] text-muted-foreground">{course.subtitle}</div>
      </div>
      {course.description ? (
        <p className="text-sm leading-relaxed text-ink-2">{course.description}</p>
      ) : null}
      {course.total ? (
        <div className="flex items-center gap-2.5">
          <ProgressBar pct={course.pct} className={course.pct >= 100 ? "bg-success" : tone.bar} />
          <b className="text-[13px] tabular-nums">{course.pct}%</b>
          <span className="text-xs tabular-nums text-muted-foreground">
            {course.completed}/{course.total}
          </span>
        </div>
      ) : null}
      {course.nextLesson || dates ? (
        <dl className="rounded-[14px] bg-background px-3.5 py-1 text-[13px]">
          {course.nextLesson ? (
            <div className="flex justify-between gap-3 border-b border-line py-2.5 last:border-0">
              <dt className="text-muted-foreground">Tiếp theo</dt>
              <dd className="text-right font-semibold">{course.nextLesson.title}</dd>
            </div>
          ) : null}
          {dates ? (
            <div className="flex justify-between gap-3 py-2.5">
              <dt className="text-muted-foreground">Thời gian</dt>
              <dd className="text-right font-semibold">{dates}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      <CourseCta course={course} />
      <Link href={`/courses/${course.courseId}`} className="text-center text-[13px] font-semibold text-secondary hover:underline">
        Xem chi tiết khoá học
      </Link>
    </aside>
  );
}

export default function MyCoursesPage() {
  const { data: enrollments = [], isLoading, isError, refetch } = useMyEnrollments();
  const courses = useMemo(() => toStudentCourses(enrollments), [enrollments]);
  const isWide = useMediaQuery(WIDE_QUERY);
  const [tabChoice, setTabChoice] = useState<TabKey | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((tab) => [tab.key, courses.filter((course) => tab.match.includes(course.status)).length]),
      ) as Record<TabKey, number>,
    [courses],
  );
  const tabKey: TabKey = tabChoice ?? (counts.active ? "active" : "all");
  const tab = TABS.find((item) => item.key === tabKey)!;
  const list = courses.filter(
    (course) =>
      tab.match.includes(course.status) &&
      (!query.trim() || matchesQuery(`${course.name} ${course.code} ${course.subtitle}`, query)),
  );
  const selected = list.find((course) => course.enrollmentId === selectedId) ?? list[0];

  if (isLoading) return <PageSkeleton label="Đang tải khoá học" />;
  if (isError) return <LoadError title="Không tải được khoá học." onRetry={() => refetch()} />;

  if (!courses.length) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Bạn chưa có khoá học nào."
        description="Khi giáo viên thêm bạn vào lớp, khoá học sẽ tự động xuất hiện ở đây. Bạn cũng có thể tự ghi danh các khoá đang mở."
        className={cn(surface, "mx-auto max-w-[640px]")}
      >
        <Link href="/courses/catalog" className={buttonClass("primary", "md")}>
          <Compass aria-hidden className="h-4 w-4" />
          Khám phá khoá học
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
      <section aria-label="Danh sách khoá học" className="grid min-w-0 content-start gap-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Tìm khoá học</span>
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên hoặc mã khoá học"
              className="h-11 w-full rounded-xl border-[1.5px] border-line bg-white pl-10 pr-3 text-sm text-ink placeholder:text-muted-foreground focus:border-primary"
            />
          </label>
          <Link href="/courses/catalog" className={buttonClass("outline", "sm")}>
            <Compass aria-hidden className="h-4 w-4" />
            Khám phá khoá học
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((item) => (
            <FilterChip
              key={item.key}
              active={item.key === tabKey}
              count={counts[item.key]}
              onClick={() => setTabChoice(item.key)}
            >
              {item.label}
            </FilterChip>
          ))}
          <span className="ml-auto text-xs font-semibold text-ink-2">Sắp xếp: Học gần nhất</span>
        </div>

        <div aria-live="polite" className="sr-only">
          {list.length} khoá học
        </div>

        {list.length ? (
          <ul className="grid gap-2.5">
            {list.map((course) => {
              const rowClass = cn(
                "grid w-full grid-cols-[56px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-2xl bg-white p-4 text-left transition-colors sm:grid-cols-[56px_minmax(0,1fr)_180px]",
              );
              return (
                <li key={course.enrollmentId}>
                  {isWide ? (
                    <button
                      type="button"
                      aria-pressed={selected?.enrollmentId === course.enrollmentId}
                      onClick={() => setSelectedId(course.enrollmentId)}
                      className={cn(
                        rowClass,
                        selected?.enrollmentId === course.enrollmentId
                          ? "border-2 border-primary"
                          : "border border-line hover:border-primary/40",
                      )}
                    >
                      <CourseRowBody course={course} />
                    </button>
                  ) : (
                    <Link href={`/courses/${course.courseId}`} className={cn(rowClass, "border border-line hover:border-primary/40")}>
                      <CourseRowBody course={course} />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        ) : query.trim() ? (
          <EmptyState
            icon={SearchX}
            tone="secondary"
            title="Không tìm thấy khoá học phù hợp"
            description={
              <>
                Không có khoá “{query.trim()}” trong nhóm <b>{tab.label}</b>. Thử từ khoá khác hoặc bỏ bộ lọc.
              </>
            }
          >
            <button type="button" onClick={() => setQuery("")} className={buttonClass("dark", "md")}>
              Xoá bộ lọc
            </button>
            {tabKey !== "all" ? (
              <button type="button" onClick={() => setTabChoice("all")} className={buttonClass("outline", "md")}>
                Tìm trong Tất cả
              </button>
            ) : null}
          </EmptyState>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="Không có khoá học nào trong mục này."
            description={
              tabKey === "upcoming"
                ? "Khoá học sắp mở sẽ xuất hiện ở đây khi giáo viên lên lịch."
                : undefined
            }
          >
            {counts.active && tabKey !== "active" ? (
              <button type="button" onClick={() => setTabChoice("active")} className={buttonClass("outline", "md")}>
                Xem khoá đang học ({counts.active})
              </button>
            ) : null}
          </EmptyState>
        )}
      </section>

      {isWide && selected ? <CourseDetailPanel course={selected} /> : null}
    </div>
  );
}
