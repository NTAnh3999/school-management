import { baseApi } from "./baseApi";
import type { ApiEnvelope } from "./baseApi";
import type { Course, CoursePrerequisite, CourseStatus } from "@/types";

export interface ListCoursesParams {
  keyword?: string;
  status?: CourseStatus;
  departmentId?: number;
  courseType?: string;
  page?: number;
  page_size?: number;
}

export interface ListCoursesResult {
  total: number;
  page: number;
  page_size: number;
  courses: Course[];
}

// Course endpoints send snake_case request bodies (api/src/routes/course.routes.js validators)
// — this module returns raw Sequelize model attributes rather than a camelCase DTO.
export interface CourseBody {
  course_code: string;
  course_name: string;
  department_id: number;
  short_name?: string;
  description?: string;
  course_type?: string;
  credit?: number;
  duration_hours?: number;
  status?: CourseStatus;
  effective_from?: string;
  effective_to?: string;
}

export const coursesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCourses: builder.query<ListCoursesResult, ListCoursesParams | void>({
      query: (params) => ({ url: "/courses", params: params ?? undefined }),
      transformResponse: (res: ApiEnvelope<ListCoursesResult>) => res.metadata,
      providesTags: (result) =>
        result
          ? [...result.courses.map((c) => ({ type: "Course" as const, id: c.id })), "Course"]
          : ["Course"],
    }),

    getCourseById: builder.query<Course, number>({
      query: (id) => `/courses/${id}`,
      transformResponse: (res: ApiEnvelope<{ course: Course }>) => res.metadata.course,
      providesTags: (_r, _e, id) => [{ type: "Course", id }],
    }),

    createCourse: builder.mutation<Course, CourseBody>({
      query: (body) => ({ url: "/courses", method: "POST", body }),
      transformResponse: (res: ApiEnvelope<{ course: Course }>) => res.metadata.course,
      invalidatesTags: ["Course"],
    }),

    updateCourse: builder.mutation<Course, { id: number } & Partial<CourseBody>>({
      query: ({ id, ...body }) => ({ url: `/courses/${id}`, method: "PUT", body }),
      transformResponse: (res: ApiEnvelope<{ course: Course }>) => res.metadata.course,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Course", id }, "Course"],
    }),

    changeCourseStatus: builder.mutation<Course, { id: number; status: CourseStatus }>({
      query: ({ id, status }) => ({
        url: `/courses/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      transformResponse: (res: ApiEnvelope<{ course: Course }>) => res.metadata.course,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Course", id }, "Course"],
    }),

    updateCoursePrerequisites: builder.mutation<
      CoursePrerequisite[],
      {
        id: number;
        prerequisites: { prerequisite_course_id: number; prerequisite_type?: "ALL" | "ANY" }[];
      }
    >({
      query: ({ id, prerequisites }) => ({
        url: `/courses/${id}/prerequisites`,
        method: "PUT",
        body: { prerequisites },
      }),
      transformResponse: (res: ApiEnvelope<{ prerequisites: CoursePrerequisite[] }>) =>
        res.metadata.prerequisites,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Course", id }],
    }),

    deleteCourse: builder.mutation<void, number>({
      query: (id) => ({ url: `/courses/${id}`, method: "DELETE" }),
      invalidatesTags: ["Course"],
    }),
  }),
});

export const {
  useListCoursesQuery,
  useGetCourseByIdQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useChangeCourseStatusMutation,
  useUpdateCoursePrerequisitesMutation,
  useDeleteCourseMutation,
} = coursesApi;
