"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SearchX } from "lucide-react";

import { useCourses, useMyEnrollments } from "../_feature/hooks";
import { glyphFor, toneClasses, type CourseTone } from "../_feature/student-course";
import {
  EmptyState,
  LoadError,
  PageSkeleton,
  Pill,
  surface,
} from "@/components/edu/ui";
import { usePageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

const TONES: CourseTone[] = ["secondary", "highlight", "primary"];

// Course catalog (moved from /courses when My Courses took that route).
// Students only ever receive status="active" courses from GET /courses.
export default function CourseCatalogPage() {
  usePageHeader(undefined, [
    { label: "Khoá học của tôi", href: "/courses" },
    { label: "Khám phá khoá học" },
  ]);
  const [keyword, setKeyword] = useState("");
  const { data, isLoading, isError, refetch } = useCourses({
    keyword: keyword.trim() || undefined,
    page_size: 50,
  });
  const { data: enrollments = [] } = useMyEnrollments();
  const enrolledIds = useMemo(
    () => new Set(enrollments.filter((e) => e.status !== "rejected").map((e) => e.course_id)),
    [enrollments],
  );
  const courses = data?.courses ?? [];

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[26px] font-bold">Khám phá khoá học</h1>
        <p className="text-[13px] text-ink-2">
          Các khoá học đang mở tại trường. Mở một khoá để xem nội dung và ghi danh.
        </p>
      </div>
      <label className="relative max-w-md">
        <span className="sr-only">Tìm khoá học</span>
        <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm theo tên hoặc mã khoá học"
          className="h-11 w-full rounded-xl border-[1.5px] border-line bg-white pl-10 pr-3 text-sm text-ink placeholder:text-muted-foreground"
        />
      </label>

      {isLoading ? (
        <PageSkeleton label="Đang tải danh sách khoá học" />
      ) : isError ? (
        <LoadError title="Không tải được danh sách khoá học." onRetry={() => refetch()} />
      ) : courses.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course, index) => {
            const tone = toneClasses[TONES[index % TONES.length]];
            const enrolled = enrolledIds.has(course.id);
            return (
              <li key={course.id}>
                <Link
                  href={`/courses/${course.id}`}
                  className={cn(surface, "flex h-full flex-col gap-3 p-4 transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-mentor")}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span aria-hidden className={cn("grid h-11 w-11 place-items-center rounded-xl text-base font-bold", tone.tile)}>
                      {glyphFor(course.course_name, course.short_name)}
                    </span>
                    {enrolled ? <Pill tone="primary">Đã ghi danh</Pill> : null}
                  </span>
                  <span>
                    <span className="block break-words text-[15px] font-bold leading-snug text-ink">
                      {course.course_name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {[course.course_code, course.department?.department_name].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  {course.description ? (
                    <span className="line-clamp-3 text-[13px] leading-relaxed text-ink-2">{course.description}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={SearchX}
          tone="secondary"
          title="Không tìm thấy khoá học phù hợp"
          description="Thử từ khoá khác hoặc xoá ô tìm kiếm."
        />
      )}
    </div>
  );
}
