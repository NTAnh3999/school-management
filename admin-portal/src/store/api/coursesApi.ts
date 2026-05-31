import { baseApi } from "./baseApi";
import type { Course, PaginatedResponse, PaginationParams } from "@/types";

export const coursesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourses: builder.query<
      PaginatedResponse<Course>,
      PaginationParams & { status?: string }
    >({
      query: (params) => ({ url: "/courses", params }),
      providesTags: ["Course"],
    }),

    getCourseById: builder.query<Course, number>({
      query: (id) => `/courses/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Course", id }],
    }),

    createCourse: builder.mutation<Course, Partial<Course>>({
      query: (body) => ({ url: "/courses", method: "POST", body }),
      invalidatesTags: ["Course"],
    }),

    updateCourse: builder.mutation<Course, { id: number } & Partial<Course>>({
      query: ({ id, ...body }) => ({
        url: `/courses/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Course", id },
        "Course",
      ],
    }),

    deleteCourse: builder.mutation<void, number>({
      query: (id) => ({ url: `/courses/${id}`, method: "DELETE" }),
      invalidatesTags: ["Course"],
    }),
  }),
});

export const {
  useGetCoursesQuery,
  useGetCourseByIdQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
} = coursesApi;
