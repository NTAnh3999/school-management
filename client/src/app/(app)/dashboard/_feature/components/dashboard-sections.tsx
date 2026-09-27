"use client";

import Link from "next/link";
import { BookOpen, MessageCircle, Play } from "lucide-react";

import { notificationTypeLabel } from "@/_shared/notifications/view";
import { dayTimeVi, relativeTimeVi } from "@/lib/format-vi";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/models";
import { toneClasses, type DashboardCourse } from "../model";

const card = "rounded-[18px] border border-line bg-white";

function Bar({ pct, className, track = "bg-background" }: { pct: number; className: string; track?: string }) {
  return (
    <div className={cn("h-2 flex-1 rounded-full", track)}>
      <div className={cn("h-full rounded-full", className)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ContinueCard({ course }: { course: DashboardCourse }) {
  const href = course.nextLesson
    ? `/courses/${course.courseId}/lessons/${course.nextLesson.id}`
    : `/courses/${course.courseId}`;
  const eyebrow = ["Học tiếp", course.name, course.nextLesson?.moduleTitle]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="relative flex items-center gap-7 overflow-hidden rounded-[20px] bg-primary px-7 py-6 text-primary-foreground">
      <div aria-hidden className="absolute -top-[110px] right-[120px] h-[220px] w-[220px] rounded-full bg-white/[.08]" />
      <div aria-hidden className="absolute -bottom-[50px] -right-[30px] h-[110px] w-[110px] rounded-full bg-highlight opacity-85" />
      <div className="relative flex min-w-0 flex-1 flex-col gap-2">
        <div className="text-xs font-semibold uppercase tracking-[.04em] opacity-85">{eyebrow}</div>
        <h2 className="text-[22px] font-bold leading-snug text-primary-foreground">
          {course.nextLesson?.title ?? course.name}
        </h2>
        <div
          role="img"
          aria-label={`Đã hoàn thành ${course.pct} phần trăm khoá học`}
          className="flex max-w-[460px] items-center gap-3"
        >
          <Bar pct={course.pct} className="bg-white" track="bg-white/25" />
          <span className="text-[13px] font-bold">{course.pct}%</span>
        </div>
        {course.lastActivity ? (
          <div className="text-xs opacity-90">
            Truy cập lần cuối: {dayTimeVi(course.lastActivity)}
          </div>
        ) : null}
      </div>
      <Link
        href={href}
        className="relative flex h-[52px] shrink-0 items-center gap-2 rounded-[14px] bg-white px-7 text-base font-bold text-primary-strong"
      >
        <Play className="h-4 w-4 fill-current" strokeWidth={0} />
        Học tiếp
      </Link>
    </section>
  );
}

export function CourseGrid({ courses }: { courses: DashboardCourse[] }) {
  return (
    <section className="grid gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-bold">Khoá học của tôi</h2>
        <Link href="/courses" className="text-[13px] font-semibold text-secondary hover:underline">
          Xem tất cả
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.slice(0, 6).map((course) => (
          <Link
            key={course.enrollmentId}
            href={`/courses/${course.courseId}`}
            className={cn(card, "flex flex-col gap-2.5 p-4 transition-shadow hover:shadow-mentor")}
          >
            <span
              className={cn(
                "grid h-11 w-11 place-items-center rounded-xl text-base font-bold",
                toneClasses[course.tone].tile,
              )}
            >
              {course.glyph}
            </span>
            <span>
              <span className="block truncate text-[15px] font-bold text-ink">{course.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{course.subtitle}</span>
            </span>
            <span className="flex items-center gap-2">
              <Bar pct={course.pct} className={toneClasses[course.tone].bar} />
              <span className="text-xs font-bold text-ink">{course.pct}%</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ProgressCard({
  courses,
  overall,
}: {
  courses: DashboardCourse[];
  overall: { completed: number; total: number; pct: number };
}) {
  return (
    <section className={cn(card, "flex flex-col gap-3.5 p-[18px]")}>
      <h2 className="text-base font-bold">Tiến độ học tập</h2>
      <div className="flex items-center gap-3.5">
        <div
          role="img"
          aria-label={`Hoàn thành ${overall.pct} phần trăm, ${overall.completed} trên ${overall.total}`}
          className="grid h-[88px] w-[88px] shrink-0 place-items-center rounded-full"
          style={{
            background: `conic-gradient(hsl(var(--primary)) 0 ${overall.pct}%, hsl(var(--background)) 0)`,
          }}
        >
          <div className="grid h-[68px] w-[68px] place-items-center rounded-full bg-white text-xl font-bold">
            {overall.pct}%
          </div>
        </div>
        <div className="text-[13px] leading-normal text-ink-2">
          <b className="text-ink">
            Đã xong {overall.completed} / {overall.total} hoạt động
          </b>
          <br />
          Trong {courses.length} khoá đang học.
        </div>
      </div>
      {courses.map((course) => (
        <div
          key={course.enrollmentId}
          className="grid grid-cols-[84px_1fr_38px] items-center gap-2.5 text-[13px]"
        >
          <span className="truncate" title={course.name}>
            {course.name}
          </span>
          <Bar pct={course.pct} className={toneClasses[course.tone].bar} />
          <b className="text-right">{course.pct}%</b>
        </div>
      ))}
    </section>
  );
}

export function NotificationsCard({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  const unread = notifications.filter((item) => !item.is_read).slice(0, 3);
  if (!unread.length) return null;

  return (
    <section className={cn(card, "flex flex-col gap-3 p-[18px]")}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-bold">Thông báo mới</h2>
        <span className="text-xs font-bold text-highlight">{unreadCount} chưa đọc</span>
      </div>
      {unread.map((item) => (
        <div key={item.id} className="flex gap-2.5">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-highlight" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink">{item.title}</div>
            <div className="text-xs text-muted-foreground">
              {notificationTypeLabel[item.notification_type] ?? "Thông báo"} ·{" "}
              {relativeTimeVi(item.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

// STU-01 "Empty — New Student": no card is shown empty; progress,
// recommendations and achievements appear once the first course starts.
export function EmptyDashboard({ firstName }: { firstName: string }) {
  return (
    <div className="mx-auto grid max-w-[720px] gap-[18px]">
      <h2 className="px-1 font-display text-[28px] font-bold leading-tight">
        Chào mừng{firstName ? ` ${firstName}` : ""}!
      </h2>
      <section className="flex flex-col items-center gap-3.5 rounded-[20px] border border-line bg-white px-5 pb-6 pt-7 text-center">
        <div aria-hidden className="relative h-[120px] w-[148px]">
          <div className="absolute left-3.5 top-2 h-[104px] w-[104px] rounded-full bg-primary-soft" />
          <div className="absolute right-1.5 top-0 h-11 w-11 rounded-full bg-highlight-soft" />
          <div className="absolute left-[38px] top-[30px] grid h-[60px] w-[72px] place-items-center rounded-xl border-2 border-primary bg-white text-primary">
            <BookOpen className="h-[30px] w-[30px]" strokeWidth={1.75} />
          </div>
        </div>
        <div className="text-balance text-lg font-bold leading-snug">
          Bạn chưa có khoá học nào đang hoạt động.
        </div>
        <div className="max-w-[280px] text-pretty text-[13px] leading-relaxed text-ink-2">
          Khi giáo viên thêm bạn vào lớp, khoá học và bài tập sẽ tự động xuất hiện ở đây.
        </div>
      </section>
      <section className={cn(card, "flex items-center gap-3 px-4 py-3.5")}>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary-soft text-secondary">
          <MessageCircle className="h-[22px] w-[22px]" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Chưa thấy lớp của mình?</div>
          <div className="text-xs text-muted-foreground">
            Hỏi giáo viên chủ nhiệm hoặc phòng giáo vụ
          </div>
        </div>
      </section>
    </div>
  );
}

function Block({ className }: { className: string }) {
  return <div className={cn("rounded-md bg-line", className)} />;
}

// STU-01 "Loading skeleton", laid out on the desktop grid.
export function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Đang tải trang chủ"
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="grid content-start gap-5">
        <div className="flex flex-col gap-2.5">
          <Block className="h-7 w-[46%] rounded-lg" />
          <Block className="h-3.5 w-[34%]" />
        </div>
        <div className="flex flex-col gap-3 rounded-[20px] bg-primary-soft p-6">
          <Block className="h-3 w-[30%] bg-black/[.07]" />
          <Block className="h-5 w-[60%] bg-black/[.07]" />
          <Block className="h-2 w-[50%] rounded-full bg-black/[.07]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className={cn(card, "h-[140px]")} />
          ))}
        </div>
      </div>
      <div className="grid content-start gap-5">
        <div className={cn(card, "flex items-center gap-4 p-4")}>
          <div className="h-[88px] w-[88px] rounded-full border-[11px] border-line" />
          <div className="flex flex-1 flex-col gap-2">
            <Block className="h-3.5 w-[70%]" />
            <Block className="h-2.5 w-[90%]" />
          </div>
        </div>
        <div className={cn(card, "h-[140px]")} />
      </div>
    </div>
  );
}
