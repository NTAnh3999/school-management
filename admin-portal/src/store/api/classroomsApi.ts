import { baseApi } from "./baseApi";
import type { Classroom, PaginatedResponse, PaginationParams } from "@/types";

export const classroomsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClassrooms: builder.query<
      PaginatedResponse<Classroom>,
      PaginationParams & { status?: string }
    >({
      query: (params) => ({ url: "/classrooms", params }),
      providesTags: ["Classroom"],
    }),

    getClassroomById: builder.query<Classroom, number>({
      query: (id) => `/classrooms/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Classroom", id }],
    }),

    createClassroom: builder.mutation<Classroom, Partial<Classroom>>({
      query: (body) => ({ url: "/classrooms", method: "POST", body }),
      invalidatesTags: ["Classroom"],
    }),

    updateClassroom: builder.mutation<
      Classroom,
      { id: number } & Partial<Classroom>
    >({
      query: ({ id, ...body }) => ({
        url: `/classrooms/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Classroom", id },
        "Classroom",
      ],
    }),

    deleteClassroom: builder.mutation<void, number>({
      query: (id) => ({ url: `/classrooms/${id}`, method: "DELETE" }),
      invalidatesTags: ["Classroom"],
    }),
  }),
});

export const {
  useGetClassroomsQuery,
  useGetClassroomByIdQuery,
  useCreateClassroomMutation,
  useUpdateClassroomMutation,
  useDeleteClassroomMutation,
} = classroomsApi;
