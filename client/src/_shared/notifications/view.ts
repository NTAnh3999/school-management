"use client";

import { useMemo } from "react";

import type { Notification, NotificationType } from "@/types/models";
import { useNotifications } from "./hooks";

export const notificationTypeLabel: Record<NotificationType, string> = {
  progress: "Tiến độ",
  assignment: "Bài tập",
  reward: "Thành tích",
  course: "Khoá học",
  general: "Thông báo chung",
};

// Typed view over GET /notifications (the http client unwraps `metadata`,
// leaving `{ notifications }`), newest first.
export function useNotificationList() {
  const query = useNotifications();
  const data = query.data as { notifications?: Notification[] } | undefined;

  const notifications = useMemo(
    () =>
      [...(data?.notifications ?? [])].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
    [data],
  );
  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return { ...query, notifications, unreadCount };
}
