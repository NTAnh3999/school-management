import { baseApi } from "./baseApi";
import type { ApiEnvelope } from "./baseApi";
import type { ContentVersion, CourseModule, Lesson, LessonType } from "@/types";

// Module/Lesson/ContentVersion endpoints all send camelCase request bodies
// (api/src/routes/module.routes.js, lesson.routes.js, content-version.routes.js).
export const courseContentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Modules (nested lessons included by the backend's list query) ──────────
    listModules: builder.query<CourseModule[], number>({
      query: (courseId) => `/modules/course/${courseId}`,
      transformResponse: (res: ApiEnvelope<{ modules: CourseModule[] }>) => res.metadata.modules,
      providesTags: (result) =>
        result
          ? [...result.map((m) => ({ type: "Module" as const, id: m.id })), "Module"]
          : ["Module"],
    }),

    createModule: builder.mutation<
      CourseModule,
      { courseId: number; title: string; description?: string; displayOrder?: number }
    >({
      query: ({ courseId, ...body }) => ({ url: `/modules/course/${courseId}`, method: "POST", body }),
      transformResponse: (res: ApiEnvelope<{ module: CourseModule }>) => res.metadata.module,
      invalidatesTags: ["Module"],
    }),

    updateModule: builder.mutation<
      CourseModule,
      { id: number; title?: string; description?: string; displayOrder?: number }
    >({
      query: ({ id, ...body }) => ({ url: `/modules/${id}`, method: "PUT", body }),
      transformResponse: (res: ApiEnvelope<{ module: CourseModule }>) => res.metadata.module,
      invalidatesTags: ["Module"],
    }),

    archiveModule: builder.mutation<CourseModule, number>({
      query: (id) => ({ url: `/modules/${id}/archive`, method: "PATCH" }),
      transformResponse: (res: ApiEnvelope<{ module: CourseModule }>) => res.metadata.module,
      invalidatesTags: ["Module"],
    }),

    deleteModule: builder.mutation<void, number>({
      query: (id) => ({ url: `/modules/${id}`, method: "DELETE" }),
      invalidatesTags: ["Module"],
    }),

    reorderModules: builder.mutation<CourseModule[], { courseId: number; orderedIds: number[] }>({
      query: ({ courseId, orderedIds }) => ({
        url: `/modules/course/${courseId}/reorder`,
        method: "PATCH",
        body: { orderedIds },
      }),
      transformResponse: (res: ApiEnvelope<{ modules: CourseModule[] }>) => res.metadata.modules,
      invalidatesTags: ["Module"],
    }),

    // ── Lessons ──────────────────────────────────────────────────────────────
    createLesson: builder.mutation<
      Lesson,
      {
        moduleId: number;
        title: string;
        lessonSummary?: string;
        content?: string;
        lessonType?: LessonType;
        videoUrl?: string;
        durationMinutes?: number;
        displayOrder?: number;
      }
    >({
      query: ({ moduleId, ...body }) => ({ url: `/lessons/module/${moduleId}`, method: "POST", body }),
      transformResponse: (res: ApiEnvelope<{ lesson: Lesson }>) => res.metadata.lesson,
      invalidatesTags: ["Module"],
    }),

    updateLesson: builder.mutation<
      Lesson,
      {
        id: number;
        title?: string;
        lessonSummary?: string;
        content?: string;
        lessonType?: LessonType;
        videoUrl?: string;
        durationMinutes?: number;
        displayOrder?: number;
      }
    >({
      query: ({ id, ...body }) => ({ url: `/lessons/${id}`, method: "PUT", body }),
      transformResponse: (res: ApiEnvelope<{ lesson: Lesson }>) => res.metadata.lesson,
      invalidatesTags: ["Module"],
    }),

    archiveLesson: builder.mutation<Lesson, number>({
      query: (id) => ({ url: `/lessons/${id}/archive`, method: "PATCH" }),
      transformResponse: (res: ApiEnvelope<{ lesson: Lesson }>) => res.metadata.lesson,
      invalidatesTags: ["Module"],
    }),

    deleteLesson: builder.mutation<void, number>({
      query: (id) => ({ url: `/lessons/${id}`, method: "DELETE" }),
      invalidatesTags: ["Module"],
    }),

    // ── Content Versions (DRAFT → PUBLISHED / ARCHIVED — see ContentVersionStatus) ─
    listContentVersions: builder.query<ContentVersion[], number>({
      query: (courseId) => `/content/courses/${courseId}/versions`,
      transformResponse: (res: ApiEnvelope<{ versions: ContentVersion[] }>) => res.metadata.versions,
      providesTags: (result) =>
        result
          ? [...result.map((v) => ({ type: "ContentVersion" as const, id: v.id })), "ContentVersion"]
          : ["ContentVersion"],
    }),

    createContentVersion: builder.mutation<
      ContentVersion,
      { courseId: number; versionLabel: string; changelog?: string }
    >({
      query: ({ courseId, ...body }) => ({
        url: `/content/courses/${courseId}/versions`,
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiEnvelope<{ version: ContentVersion }>) => res.metadata.version,
      invalidatesTags: ["ContentVersion"],
    }),

    previewDraft: builder.query<{ course_id: number; preview: boolean; structure: CourseModule[] }, number>({
      query: (courseId) => `/content/courses/${courseId}/preview`,
      transformResponse: (
        res: ApiEnvelope<{ course_id: number; preview: boolean; structure: CourseModule[] }>,
      ) => res.metadata,
    }),

    publishContentVersion: builder.mutation<ContentVersion, number>({
      query: (id) => ({ url: `/content/versions/${id}/publish`, method: "POST" }),
      transformResponse: (res: ApiEnvelope<{ version: ContentVersion }>) => res.metadata.version,
      invalidatesTags: ["ContentVersion"],
    }),

    archiveContentVersion: builder.mutation<ContentVersion, number>({
      query: (id) => ({ url: `/content/versions/${id}/archive`, method: "PATCH" }),
      transformResponse: (res: ApiEnvelope<{ version: ContentVersion }>) => res.metadata.version,
      invalidatesTags: ["ContentVersion"],
    }),
  }),
});

export const {
  useListModulesQuery,
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useArchiveModuleMutation,
  useDeleteModuleMutation,
  useReorderModulesMutation,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useArchiveLessonMutation,
  useDeleteLessonMutation,
  useListContentVersionsQuery,
  useCreateContentVersionMutation,
  useLazyPreviewDraftQuery,
  usePublishContentVersionMutation,
  useArchiveContentVersionMutation,
} = courseContentApi;
