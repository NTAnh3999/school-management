import { baseApi } from "./baseApi";
import type { Enrollment, PaginatedResponse, PaginationParams } from "@/types";

export const enrollmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEnrollments: builder.query<
      PaginatedResponse<Enrollment>,
      PaginationParams & { status?: string; courseId?: number }
    >({
      query: (params) => ({ url: "/enrollments", params }),
      providesTags: ["Enrollment"],
    }),

    getEnrollmentById: builder.query<Enrollment, number>({
      query: (id) => `/enrollments/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Enrollment", id }],
    }),

    createEnrollment: builder.mutation<
      Enrollment,
      { studentId: number; courseId: number }
    >({
      query: (body) => ({ url: "/enrollments", method: "POST", body }),
      invalidatesTags: ["Enrollment"],
    }),

    updateEnrollment: builder.mutation<
      Enrollment,
      { id: number } & Partial<Enrollment>
    >({
      query: ({ id, ...body }) => ({
        url: `/enrollments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Enrollment", id },
        "Enrollment",
      ],
    }),

    deleteEnrollment: builder.mutation<void, number>({
      query: (id) => ({ url: `/enrollments/${id}`, method: "DELETE" }),
      invalidatesTags: ["Enrollment"],
    }),
  }),
});

export const {
  useGetEnrollmentsQuery,
  useGetEnrollmentByIdQuery,
  useCreateEnrollmentMutation,
  useUpdateEnrollmentMutation,
  useDeleteEnrollmentMutation,
} = enrollmentsApi;
