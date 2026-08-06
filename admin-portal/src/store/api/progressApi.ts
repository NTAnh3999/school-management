import { baseApi } from "./baseApi";
import type { ApiEnvelope } from "./baseApi";
import type { ProgressEventLog, StudentCourseProgress, TeacherCourseProgressRow } from "@/types";

// Progress endpoints send camelCase request bodies (api/src/routes/progress.routes.js).
export const progressApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEnrollmentProgress: builder.query<StudentCourseProgress, number>({
      query: (enrollmentId) => `/progress/enrollment/${enrollmentId}`,
      transformResponse: (res: ApiEnvelope<{ progress: StudentCourseProgress }>) =>
        res.metadata.progress,
      providesTags: (_r, _e, id) => [{ type: "Progress", id }],
    }),

    getCourseProgress: builder.query<TeacherCourseProgressRow[], number>({
      query: (courseId) => `/progress/course/${courseId}`,
      transformResponse: (res: ApiEnvelope<{ enrollments: TeacherCourseProgressRow[] }>) =>
        res.metadata.enrollments,
      providesTags: ["Progress"],
    }),

    getProgressEventLogs: builder.query<ProgressEventLog[], number>({
      query: (enrollmentId) => `/progress/enrollment/${enrollmentId}/event-logs`,
      transformResponse: (res: ApiEnvelope<{ event_logs: ProgressEventLog[] }>) =>
        res.metadata.event_logs,
    }),

    recomputeProgress: builder.mutation<StudentCourseProgress, { enrollmentId: number; reason?: string }>({
      query: ({ enrollmentId, ...body }) => ({
        url: `/progress/enrollment/${enrollmentId}/recompute`,
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiEnvelope<{ progress: StudentCourseProgress }>) =>
        res.metadata.progress,
      invalidatesTags: (_r, _e, { enrollmentId }) => [{ type: "Progress", id: enrollmentId }],
    }),
  }),
});

export const {
  useGetEnrollmentProgressQuery,
  useGetCourseProgressQuery,
  useGetProgressEventLogsQuery,
  useRecomputeProgressMutation,
} = progressApi;
