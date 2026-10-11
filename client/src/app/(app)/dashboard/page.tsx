"use client";

import { useMemo } from "react";

import { useMyEnrollments } from "@/app/(app)/courses/_feature/hooks";
import { useNotificationList } from "@/_shared/notifications/view";
import { givenName, greetingFor } from "@/lib/format-vi";
import { useSessionStore } from "@/stores/session-store";
import {
  ContinueCard,
  CourseGrid,
  DashboardSkeleton,
  EmptyDashboard,
  NotificationsCard,
  ProgressCard,
} from "./_feature/components/dashboard-sections";
import { overallProgress, pickSpotlight, toDashboardCourses } from "./_feature/model";

// STU-01 Student Dashboard (design: Desktop - Student, 7a). Cards without a
// backend source yet — streak, "Việc cần làm", "Gợi ý cho bạn" — are left
// out rather than shown with placeholder data.
export default function DashboardPage() {
  const user = useSessionStore((state) => state.user);
  const { data: enrollments = [], isLoading, isError, refetch } = useMyEnrollments();
  const { notifications, unreadCount } = useNotificationList();

  const courses = useMemo(() => toDashboardCourses(enrollments), [enrollments]);
  const spotlight = pickSpotlight(courses);
  const overall = overallProgress(courses);
  const firstName = givenName(user?.fullName);

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <div
        role="alert"
        className="mx-auto flex max-w-[480px] flex-col items-center gap-3 rounded-[20px] border border-line bg-white px-6 py-10 text-center"
      >
        <div className="text-lg font-bold">Không tải được trang chủ.</div>
        <div className="text-[13px] text-ink-2">Kiểm tra kết nối mạng rồi thử lại.</div>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-1 h-12 rounded-[14px] bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-2"
        >
          Tải lại
        </button>
      </div>
    );
  }

  if (!courses.length) return <EmptyDashboard firstName={firstName} />;

  return (
    <div className="grid content-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid content-start gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2
            suppressHydrationWarning
            className="text-balance font-display text-[28px] font-bold leading-tight sm:shrink-0 sm:whitespace-nowrap"
          >
            {greetingFor()}
            {firstName ? `, ${firstName}` : ""}!
          </h2>
          <span className="min-w-0 flex-1 text-[13px] text-ink-2">
            Đang học {courses.length} khoá
          </span>
        </div>
        {spotlight ? <ContinueCard course={spotlight} /> : null}
        <CourseGrid courses={courses} />
      </div>
      <div className="grid content-start gap-5">
        <ProgressCard courses={courses} overall={overall} />
        <NotificationsCard notifications={notifications} unreadCount={unreadCount} />
      </div>
    </div>
  );
}
