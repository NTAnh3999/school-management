import { baseApi } from "./baseApi";
import type { ApiEnvelope } from "./baseApi";
import type {
  Enrollment,
  EnrollmentHistoryEntry,
  EnrollmentLevel,
  EnrollmentStatus,
  RequestSource,
} from "@/types";

export interface ListEnrollmentsParams {
  status?: EnrollmentStatus;
  course_id?: number;
  classroom_id?: number;
  learner_id?: number;
  learner_profile_id?: number;
  tenant_id?: number;
  enrollment_level?: EnrollmentLevel;
  request_source?: RequestSource;
  requested_from?: string;
  requested_to?: string;
  page?: number;
  page_size?: number;
}

export interface ListEnrollmentsResult {
  total: number;
  page: number;
  page_size: number;
  enrollments: Enrollment[];
}

// Enrollment endpoints send snake_case request bodies (api/src/routes/enrollment.routes.js).
export const enrollmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listEnrollments: builder.query<
      ListEnrollmentsResult,
      ListEnrollmentsParams | void
    >({
      query: (params) => ({ url: "/enrollments", params: params ?? undefined }),
      transformResponse: (res: ApiEnvelope<ListEnrollmentsResult>) =>
        res.metadata,
      providesTags: (result) =>
        result
          ? [
              ...result.enrollments.map((e) => ({
                type: "Enrollment" as const,
                id: e.id,
              })),
              "Enrollment",
            ]
          : ["Enrollment"],
    }),

    getEnrollmentById: builder.query<Enrollment, number>({
      query: (id) => `/enrollments/${id}`,
      transformResponse: (res: ApiEnvelope<{ enrollment: Enrollment }>) =>
        res.metadata.enrollment,
      providesTags: (_r, _e, id) => [{ type: "Enrollment", id }],
    }),

    getEnrollmentHistory: builder.query<EnrollmentHistoryEntry[], number>({
      query: (id) => `/enrollments/${id}/history`,
      transformResponse: (
        res: ApiEnvelope<{ history: EnrollmentHistoryEntry[] }>,
      ) => res.metadata.history,
    }),

    checkEligibility: builder.query<
      { eligible: boolean; [key: string]: unknown },
      { learner_id: number; course_id: number }
    >({
      query: (params) => ({ url: "/enrollments/eligibility", params }),
      transformResponse: (
        res: ApiEnvelope<{
          eligibility: { eligible: boolean; [key: string]: unknown };
        }>,
      ) => res.metadata.eligibility,
    }),

    createEnrollment: builder.mutation<
      Enrollment,
      {
        learner_id?: number;
        learner_profile_id?: number;
        tenant_id?: number;
        course_id: number;
        classroom_id?: number;
        request_source?: RequestSource;
        payment_reference?: string;
        idempotency_key?: string;
      }
    >({
      query: (body) => ({
        url: "/enrollments",
        method: "POST",
        body: { request_source: "admin", ...body },
      }),
      transformResponse: (res: ApiEnvelope<{ enrollment: Enrollment }>) =>
        res.metadata.enrollment,
      invalidatesTags: ["Enrollment"],
    }),

    activateEnrollment: builder.mutation<Enrollment, number>({
      query: (id) => ({ url: `/enrollments/${id}/activate`, method: "PUT" }),
      transformResponse: (res: ApiEnvelope<{ enrollment: Enrollment }>) =>
        res.metadata.enrollment,
      invalidatesTags: (_r, _e, id) => [
        { type: "Enrollment", id },
        "Enrollment",
      ],
    }),

    suspendEnrollment: builder.mutation<
      Enrollment,
      { id: number; reason_code?: string; reason_message?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/enrollments/${id}/suspend`,
        method: "PUT",
        body,
      }),
      transformResponse: (res: ApiEnvelope<{ enrollment: Enrollment }>) =>
        res.metadata.enrollment,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Enrollment", id },
        "Enrollment",
      ],
    }),

    resumeEnrollment: builder.mutation<Enrollment, number>({
      query: (id) => ({ url: `/enrollments/${id}/resume`, method: "PUT" }),
      transformResponse: (res: ApiEnvelope<{ enrollment: Enrollment }>) =>
        res.metadata.enrollment,
      invalidatesTags: (_r, _e, id) => [
        { type: "Enrollment", id },
        "Enrollment",
      ],
    }),

    cancelEnrollment: builder.mutation<
      Enrollment,
      { id: number; reason_code?: string; reason_message?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/enrollments/${id}/cancel`,
        method: "PUT",
        body,
      }),
      transformResponse: (res: ApiEnvelope<{ enrollment: Enrollment }>) =>
        res.metadata.enrollment,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Enrollment", id },
        "Enrollment",
      ],
    }),

    completeEnrollment: builder.mutation<Enrollment, number>({
      query: (id) => ({ url: `/enrollments/${id}/complete`, method: "PUT" }),
      transformResponse: (res: ApiEnvelope<{ enrollment: Enrollment }>) =>
        res.metadata.enrollment,
      invalidatesTags: (_r, _e, id) => [
        { type: "Enrollment", id },
        "Enrollment",
      ],
    }),

    exportEnrollments: builder.query<Blob, ListEnrollmentsParams | void>({
      query: (params) => ({
        url: "/enrollments/export",
        params: params ?? undefined,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useListEnrollmentsQuery,
  useGetEnrollmentByIdQuery,
  useGetEnrollmentHistoryQuery,
  useLazyCheckEligibilityQuery,
  useCreateEnrollmentMutation,
  useActivateEnrollmentMutation,
  useSuspendEnrollmentMutation,
  useResumeEnrollmentMutation,
  useCancelEnrollmentMutation,
  useCompleteEnrollmentMutation,
  useLazyExportEnrollmentsQuery,
} = enrollmentsApi;
