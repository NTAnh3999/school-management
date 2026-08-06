import { baseApi } from "./baseApi";
import type { ApiEnvelope } from "./baseApi";
import type { AppNotification } from "@/types";

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query<AppNotification[], { unread?: boolean } | void>({
      query: (params) => ({
        url: "/notifications",
        params: params?.unread ? { unread: "true" } : undefined,
      }),
      transformResponse: (res: ApiEnvelope<{ notifications: AppNotification[] }>) =>
        res.metadata.notifications,
      providesTags: (result) =>
        result
          ? [
              ...result.map((n) => ({ type: "Notification" as const, id: n.id })),
              "Notification",
            ]
          : ["Notification"],
    }),

    markNotificationRead: builder.mutation<AppNotification, number>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PUT" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Notification", id }, "Notification"],
    }),

    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({ url: "/notifications/read-all", method: "PUT" }),
      invalidatesTags: ["Notification"],
    }),

    deleteNotification: builder.mutation<void, number>({
      query: (id) => ({ url: `/notifications/${id}`, method: "DELETE" }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;
