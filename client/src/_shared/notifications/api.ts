import { httpClient } from "@/lib/http-client";
import { API_ROUTES } from "@/config/api";

export async function getNotifications() {
  const response = await httpClient.get(API_ROUTES.notifications.list);
  return response.data;
}

export async function markNotificationRead(id: number) {
  const response = await httpClient.put(API_ROUTES.notifications.markRead(id));
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await httpClient.put(API_ROUTES.notifications.markAllRead);
  return response.data;
}

export async function deleteNotification(id: number) {
  const response = await httpClient.delete(API_ROUTES.notifications.delete(id));
  return response.data;
}
