import { baseApi } from "./baseApi";
import type { ApiEnvelope } from "./baseApi";
import type {
  Classroom,
  ClassroomEnrollmentStatus,
  ClassroomSession,
  ClassroomStatus,
  ClassroomStudentEnrollment,
  DeliveryMethod,
  EnrollmentMode,
  ClassroomVisibility,
} from "@/types";

export interface ListClassroomsParams {
  keyword?: string;
  status?: ClassroomStatus;
  course_id?: number;
  teacher_id?: number;
  delivery_method?: DeliveryMethod;
  date_from?: string;
  date_to?: string;
  enrollment_availability?: "available" | "full";
  page?: number;
  page_size?: number;
}

export interface ListClassroomsResult {
  items: Classroom[];
  total: number;
  page: number;
  page_size: number;
}

// Classroom endpoints send snake_case request bodies (api/src/routes/classroom.routes.js).
export interface ClassroomBody {
  course_id: number;
  classroom_name: string;
  delivery_method: DeliveryMethod;
  start_date: string;
  end_date: string;
  max_capacity: number;
  classroom_code?: string;
  description?: string;
  campus_id?: number;
  location?: string;
  online_meeting_link?: string;
  academic_year?: string;
  term?: string;
  language?: string;
  main_teacher_id?: number;
  co_teacher_ids?: number[];
  teaching_assistant_ids?: number[];
  enrollment_mode?: EnrollmentMode;
  min_capacity?: number;
  waitlist_enabled?: boolean;
  approval_required?: boolean;
  visibility?: ClassroomVisibility;
}

export const classroomsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listClassrooms: builder.query<ListClassroomsResult, ListClassroomsParams | void>({
      query: (params) => ({ url: "/classrooms", params: params ?? undefined }),
      transformResponse: (res: ApiEnvelope<ListClassroomsResult>) => res.metadata,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((c) => ({ type: "Classroom" as const, id: c.id })),
              "Classroom",
            ]
          : ["Classroom"],
    }),

    getClassroomById: builder.query<Classroom, number>({
      query: (id) => `/classrooms/${id}`,
      transformResponse: (res: ApiEnvelope<{ classroom: Classroom }>) => res.metadata.classroom,
      providesTags: (_r, _e, id) => [{ type: "Classroom", id }],
    }),

    createClassroom: builder.mutation<Classroom, ClassroomBody>({
      query: (body) => ({ url: "/classrooms", method: "POST", body }),
      transformResponse: (res: ApiEnvelope<{ classroom: Classroom }>) => res.metadata.classroom,
      invalidatesTags: ["Classroom"],
    }),

    updateClassroom: builder.mutation<Classroom, { id: number } & Partial<ClassroomBody>>({
      query: ({ id, ...body }) => ({ url: `/classrooms/${id}`, method: "PUT", body }),
      transformResponse: (res: ApiEnvelope<{ classroom: Classroom }>) => res.metadata.classroom,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Classroom", id }, "Classroom"],
    }),

    assignTeachers: builder.mutation<
      Classroom,
      {
        id: number;
        main_teacher_id?: number;
        co_teacher_ids?: number[];
        teaching_assistant_ids?: number[];
      }
    >({
      query: ({ id, ...body }) => ({ url: `/classrooms/${id}/teachers`, method: "PUT", body }),
      transformResponse: (res: ApiEnvelope<{ classroom: Classroom }>) => res.metadata.classroom,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Classroom", id }, "Classroom"],
    }),

    // Lifecycle transitions — each maps to a dedicated backend action endpoint.
    publishClassroom: builder.mutation<Classroom, number>({
      query: (id) => ({ url: `/classrooms/${id}/publish`, method: "POST" }),
      transformResponse: (res: ApiEnvelope<{ classroom: Classroom }>) => res.metadata.classroom,
      invalidatesTags: (_r, _e, id) => [{ type: "Classroom", id }, "Classroom"],
    }),
    startClassroom: builder.mutation<Classroom, number>({
      query: (id) => ({ url: `/classrooms/${id}/start`, method: "POST" }),
      transformResponse: (res: ApiEnvelope<{ classroom: Classroom }>) => res.metadata.classroom,
      invalidatesTags: (_r, _e, id) => [{ type: "Classroom", id }, "Classroom"],
    }),
    cancelClassroom: builder.mutation<Classroom, { id: number; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/classrooms/${id}/cancel`,
        method: "POST",
        body: { reason },
      }),
      transformResponse: (res: ApiEnvelope<{ classroom: Classroom }>) => res.metadata.classroom,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Classroom", id }, "Classroom"],
    }),
    completeClassroom: builder.mutation<Classroom, number>({
      query: (id) => ({ url: `/classrooms/${id}/complete`, method: "POST" }),
      transformResponse: (res: ApiEnvelope<{ classroom: Classroom }>) => res.metadata.classroom,
      invalidatesTags: (_r, _e, id) => [{ type: "Classroom", id }, "Classroom"],
    }),
    archiveClassroom: builder.mutation<Classroom, number>({
      query: (id) => ({ url: `/classrooms/${id}/archive`, method: "POST" }),
      transformResponse: (res: ApiEnvelope<{ classroom: Classroom }>) => res.metadata.classroom,
      invalidatesTags: (_r, _e, id) => [{ type: "Classroom", id }, "Classroom"],
    }),

    listClassroomStudents: builder.query<
      { items: ClassroomStudentEnrollment[]; total: number },
      { id: number; status?: ClassroomEnrollmentStatus; page?: number; page_size?: number }
    >({
      query: ({ id, ...params }) => ({ url: `/classrooms/${id}/students`, params }),
      transformResponse: (
        res: ApiEnvelope<{ items: ClassroomStudentEnrollment[]; total: number }>,
      ) => res.metadata,
      providesTags: ["ClassroomStudent"],
    }),

    addClassroomStudent: builder.mutation<
      ClassroomStudentEnrollment,
      { id: number; student_id: number; notes?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/classrooms/${id}/students`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ClassroomStudent", "Classroom"],
    }),

    removeClassroomStudent: builder.mutation<void, { id: number; studentId: number; reason?: string }>({
      query: ({ id, studentId, reason }) => ({
        url: `/classrooms/${id}/students/${studentId}`,
        method: "DELETE",
        body: { reason },
      }),
      invalidatesTags: ["ClassroomStudent", "Classroom"],
    }),

    listClassroomSessions: builder.query<ClassroomSession[], number>({
      query: (id) => `/classrooms/${id}/sessions`,
      transformResponse: (res: ApiEnvelope<{ sessions: ClassroomSession[] }>) =>
        res.metadata.sessions,
      providesTags: ["ClassroomSession"],
    }),

    getClassroomActivityLog: builder.query<
      { id: number; action?: string; created_at: string; [key: string]: unknown }[],
      number
    >({
      query: (id) => `/classrooms/${id}/activity-log`,
      transformResponse: (
        res: ApiEnvelope<{
          logs: { id: number; action?: string; created_at: string; [key: string]: unknown }[];
        }>,
      ) => res.metadata.logs,
    }),
  }),
});

export const {
  useListClassroomsQuery,
  useGetClassroomByIdQuery,
  useCreateClassroomMutation,
  useUpdateClassroomMutation,
  useAssignTeachersMutation,
  usePublishClassroomMutation,
  useStartClassroomMutation,
  useCancelClassroomMutation,
  useCompleteClassroomMutation,
  useArchiveClassroomMutation,
  useListClassroomStudentsQuery,
  useAddClassroomStudentMutation,
  useRemoveClassroomStudentMutation,
  useListClassroomSessionsQuery,
  useGetClassroomActivityLogQuery,
} = classroomsApi;
