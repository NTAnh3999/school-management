import { baseApi } from "./baseApi";
import type { ApiEnvelope } from "./baseApi";
import type { Assessment, AssessmentAttempt, AssessmentResult } from "@/types";

export interface ListAssessmentsParams {
  courseId?: number;
  classroomId?: number;
  status?: string;
}

// Assessment endpoints send camelCase request bodies (api/src/routes/assessment.routes.js).
export const assessmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAssessments: builder.query<Assessment[], ListAssessmentsParams | void>({
      query: (params) => ({ url: "/assessments", params: params ?? undefined }),
      transformResponse: (res: ApiEnvelope<{ assessments: Assessment[] }>) =>
        res.metadata.assessments,
      providesTags: (result) =>
        result
          ? [...result.map((a) => ({ type: "Assessment" as const, id: a.id })), "Assessment"]
          : ["Assessment"],
    }),

    getAssessmentById: builder.query<Assessment, number>({
      query: (id) => `/assessments/${id}`,
      transformResponse: (res: ApiEnvelope<{ assessment: Assessment }>) =>
        res.metadata.assessment,
      providesTags: (_r, _e, id) => [{ type: "Assessment", id }],
    }),

    getAssessmentAttempts: builder.query<
      AssessmentAttempt[],
      { id: number; enrollmentId?: number }
    >({
      query: ({ id, enrollmentId }) => ({
        url: `/assessments/${id}/attempts`,
        params: enrollmentId ? { enrollmentId } : undefined,
      }),
      transformResponse: (res: ApiEnvelope<{ attempts: AssessmentAttempt[] }>) =>
        res.metadata.attempts,
    }),

    getAssessmentResults: builder.query<AssessmentResult[], { id: number; studentId?: number }>({
      query: ({ id, studentId }) => ({
        url: `/assessments/${id}/results`,
        params: studentId ? { studentId } : undefined,
      }),
      transformResponse: (res: ApiEnvelope<{ results: AssessmentResult[] }>) =>
        res.metadata.results,
    }),

    publishAssessment: builder.mutation<Assessment, number>({
      query: (id) => ({ url: `/assessments/${id}/publish`, method: "POST" }),
      transformResponse: (res: ApiEnvelope<{ assessment: Assessment }>) =>
        res.metadata.assessment,
      invalidatesTags: (_r, _e, id) => [{ type: "Assessment", id }, "Assessment"],
    }),

    closeAssessment: builder.mutation<Assessment, { id: number; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/assessments/${id}/close`,
        method: "POST",
        body: { reason },
      }),
      transformResponse: (res: ApiEnvelope<{ assessment: Assessment }>) =>
        res.metadata.assessment,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Assessment", id }, "Assessment"],
    }),

    archiveAssessment: builder.mutation<Assessment, { id: number; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/assessments/${id}/archive`,
        method: "POST",
        body: { reason },
      }),
      transformResponse: (res: ApiEnvelope<{ assessment: Assessment }>) =>
        res.metadata.assessment,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Assessment", id }, "Assessment"],
    }),

    gradeSubmission: builder.mutation<
      unknown,
      { submissionId: number; score: number; feedback?: string }
    >({
      query: ({ submissionId, ...body }) => ({
        url: `/assessments/submissions/${submissionId}/grade`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Assessment"],
    }),

    publishGrade: builder.mutation<unknown, number>({
      query: (gradeId) => ({ url: `/assessments/grades/${gradeId}/publish`, method: "POST" }),
      invalidatesTags: ["Assessment"],
    }),
  }),
});

export const {
  useListAssessmentsQuery,
  useGetAssessmentByIdQuery,
  useGetAssessmentAttemptsQuery,
  useGetAssessmentResultsQuery,
  usePublishAssessmentMutation,
  useCloseAssessmentMutation,
  useArchiveAssessmentMutation,
  useGradeSubmissionMutation,
  usePublishGradeMutation,
} = assessmentsApi;
