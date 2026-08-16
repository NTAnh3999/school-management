import { baseApi } from "./baseApi";
import type { ApiEnvelope } from "./baseApi";
import type {
  ContentVersion,
  ContentReview,
  ContentAsset,
  ContentAssetProcessingStatus,
  CourseModule,
  Lesson,
  LearningItem,
  LearningItemType,
  CourseAuthorAssignment,
  CourseAuthorRole,
} from "@/types";

// Module/Lesson/LearningItem/ContentVersion endpoints all send camelCase request bodies
// (api/src/routes/module.routes.js, lesson.routes.js, learning-item.routes.js,
// content-version.routes.js). Module/Lesson/LearningItem are version-scoped: update/archive/
// delete require the entity's current `revision` for optimistic locking (409 on mismatch).
export const courseContentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Modules (nested lessons included by the backend's list query) ──────────
    // Course-global: resolves server-side to the course's current open Draft (or Published if
    // none) version — the primary read path for ModuleLessonEditor, which is keyed by courseId.
    listModules: builder.query<CourseModule[], number>({
      query: (courseId) => `/modules/course/${courseId}`,
      transformResponse: (res: ApiEnvelope<{ modules: CourseModule[] }>) => res.metadata.modules,
      providesTags: (result) =>
        result
          ? [...result.map((m) => ({ type: "Module" as const, id: m.id })), "Module"]
          : ["Module"],
    }),

    listModulesByVersion: builder.query<CourseModule[], number>({
      query: (versionId) => `/modules/version/${versionId}`,
      transformResponse: (res: ApiEnvelope<{ modules: CourseModule[] }>) => res.metadata.modules,
      providesTags: (result) =>
        result
          ? [...result.map((m) => ({ type: "Module" as const, id: m.id })), "Module"]
          : ["Module"],
    }),

    createModule: builder.mutation<
      CourseModule,
      { versionId: number; title: string; description?: string; displayOrder?: number }
    >({
      query: ({ versionId, ...body }) => ({ url: `/modules/version/${versionId}`, method: "POST", body }),
      transformResponse: (res: ApiEnvelope<{ module: CourseModule }>) => res.metadata.module,
      invalidatesTags: ["Module"],
    }),

    updateModule: builder.mutation<
      CourseModule,
      { id: number; revision: number; title?: string; description?: string; displayOrder?: number }
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

    reorderModules: builder.mutation<CourseModule[], { versionId: number; orderedIds: number[] }>({
      query: ({ versionId, orderedIds }) => ({
        url: `/modules/version/${versionId}/reorder`,
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
        objective?: string;
        lessonSummary?: string;
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
        revision: number;
        title?: string;
        objective?: string;
        lessonSummary?: string;
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

    // ── Learning Items ───────────────────────────────────────────────────────
    listLearningItems: builder.query<LearningItem[], number>({
      query: (lessonId) => `/learning-items/lesson/${lessonId}`,
      transformResponse: (res: ApiEnvelope<{ items: LearningItem[] }>) => res.metadata.items,
      providesTags: (result) =>
        result
          ? [...result.map((i) => ({ type: "Module" as const, id: `item-${i.id}` })), "Module"]
          : ["Module"],
    }),

    createLearningItem: builder.mutation<
      LearningItem,
      {
        lessonId: number;
        itemType: LearningItemType;
        title: string;
        contentPayload?: Record<string, unknown>;
        assetId?: number;
        source?: "uploaded" | "external";
        displayOrder?: number;
        estimatedDuration?: number;
        isRequired?: boolean;
      }
    >({
      query: ({ lessonId, ...body }) => ({
        url: `/learning-items/lesson/${lessonId}`,
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiEnvelope<{ item: LearningItem }>) => res.metadata.item,
      invalidatesTags: ["Module"],
    }),

    updateLearningItem: builder.mutation<
      LearningItem,
      {
        id: number;
        revision: number;
        title?: string;
        contentPayload?: Record<string, unknown>;
        assetId?: number;
        source?: "uploaded" | "external";
        displayOrder?: number;
        estimatedDuration?: number;
        isRequired?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({ url: `/learning-items/${id}`, method: "PATCH", body }),
      transformResponse: (res: ApiEnvelope<{ item: LearningItem }>) => res.metadata.item,
      invalidatesTags: ["Module"],
    }),

    archiveLearningItem: builder.mutation<LearningItem, number>({
      query: (id) => ({ url: `/learning-items/${id}/archive`, method: "PATCH" }),
      transformResponse: (res: ApiEnvelope<{ item: LearningItem }>) => res.metadata.item,
      invalidatesTags: ["Module"],
    }),

    reorderLearningItems: builder.mutation<LearningItem[], { lessonId: number; orderedIds: number[] }>({
      query: ({ lessonId, orderedIds }) => ({
        url: `/learning-items/lesson/${lessonId}/reorder`,
        method: "PATCH",
        body: { orderedIds },
      }),
      transformResponse: (res: ApiEnvelope<{ items: LearningItem[] }>) => res.metadata.items,
      invalidatesTags: ["Module"],
    }),

    // ── Content Assets ───────────────────────────────────────────────────────
    listContentAssets: builder.query<ContentAsset[], { mediaType?: string } | void>({
      query: (params) => ({ url: "/content-assets", params: params ?? undefined }),
      transformResponse: (res: ApiEnvelope<{ assets: ContentAsset[] }>) => res.metadata.assets,
      providesTags: (result) =>
        result
          ? [...result.map((a) => ({ type: "Module" as const, id: `asset-${a.id}` })), "Module"]
          : ["Module"],
    }),

    createContentAsset: builder.mutation<
      ContentAsset,
      {
        filename: string;
        mediaType: string;
        mimeType: string;
        storageKey: string;
        sizeBytes?: number;
        durationSeconds?: number;
        thumbnailUrl?: string;
      }
    >({
      query: (body) => ({ url: "/content-assets", method: "POST", body }),
      transformResponse: (res: ApiEnvelope<{ asset: ContentAsset }>) => res.metadata.asset,
      invalidatesTags: ["Module"],
    }),

    updateContentAsset: builder.mutation<
      ContentAsset,
      { id: number; filename?: string; thumbnailUrl?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/content-assets/${id}`, method: "PATCH", body }),
      transformResponse: (res: ApiEnvelope<{ asset: ContentAsset }>) => res.metadata.asset,
      invalidatesTags: ["Module"],
    }),

    updateAssetProcessingStatus: builder.mutation<
      ContentAsset,
      { id: number; processingStatus: ContentAssetProcessingStatus; checksum?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/content-assets/${id}/processing-status`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: ApiEnvelope<{ asset: ContentAsset }>) => res.metadata.asset,
      invalidatesTags: ["Module"],
    }),

    // ── Content Versions (Draft → InReview → ChangesRequested/Approved → Published → Archived) ─
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
      invalidatesTags: ["ContentVersion", "Module"],
    }),

    previewDraft: builder.query<
      { course_id: number; preview: boolean; version_id?: number; structure: CourseModule[] },
      number
    >({
      query: (courseId) => `/content/courses/${courseId}/preview`,
      transformResponse: (
        res: ApiEnvelope<{ course_id: number; preview: boolean; version_id?: number; structure: CourseModule[] }>,
      ) => res.metadata,
    }),

    validateContentVersion: builder.query<{ ready: boolean; issues: string[] }, number>({
      query: (id) => `/content/versions/${id}/validate`,
      transformResponse: (res: ApiEnvelope<{ ready: boolean; issues: string[] }>) => res.metadata,
    }),

    submitContentVersionForReview: builder.mutation<ContentVersion, number>({
      query: (id) => ({ url: `/content/versions/${id}/submit-review`, method: "POST" }),
      transformResponse: (res: ApiEnvelope<{ version: ContentVersion }>) => res.metadata.version,
      invalidatesTags: ["ContentVersion"],
    }),

    decideContentReview: builder.mutation<
      ContentVersion,
      { id: number; decision: "APPROVED" | "CHANGES_REQUESTED"; comment?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/content/versions/${id}/review-decision`,
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiEnvelope<{ version: ContentVersion }>) => res.metadata.version,
      invalidatesTags: ["ContentVersion"],
    }),

    listContentReviews: builder.query<ContentReview[], number>({
      query: (versionId) => `/content/versions/${versionId}/reviews`,
      transformResponse: (res: ApiEnvelope<{ reviews: ContentReview[] }>) => res.metadata.reviews,
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

    // ── Course Authors (assigned Content Author per FSD 3.1) ────────────────
    listCourseAuthors: builder.query<CourseAuthorAssignment[], number>({
      query: (courseId) => `/courses/${courseId}/authors`,
      transformResponse: (res: ApiEnvelope<{ authors: CourseAuthorAssignment[] }>) => res.metadata.authors,
      providesTags: ["Course"],
    }),

    assignCourseAuthor: builder.mutation<
      CourseAuthorAssignment,
      { courseId: number; userId: number; roleInCourse?: CourseAuthorRole }
    >({
      query: ({ courseId, ...body }) => ({ url: `/courses/${courseId}/authors`, method: "POST", body }),
      transformResponse: (res: ApiEnvelope<{ assignment: CourseAuthorAssignment }>) => res.metadata.assignment,
      invalidatesTags: ["Course"],
    }),

    revokeCourseAuthor: builder.mutation<void, { courseId: number; userId: number }>({
      query: ({ courseId, userId }) => ({
        url: `/courses/${courseId}/authors/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Course"],
    }),
  }),
});

export const {
  useListModulesQuery,
  useListModulesByVersionQuery,
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useArchiveModuleMutation,
  useDeleteModuleMutation,
  useReorderModulesMutation,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useArchiveLessonMutation,
  useDeleteLessonMutation,
  useListLearningItemsQuery,
  useCreateLearningItemMutation,
  useUpdateLearningItemMutation,
  useArchiveLearningItemMutation,
  useReorderLearningItemsMutation,
  useListContentAssetsQuery,
  useCreateContentAssetMutation,
  useUpdateContentAssetMutation,
  useUpdateAssetProcessingStatusMutation,
  useListContentVersionsQuery,
  useCreateContentVersionMutation,
  useLazyPreviewDraftQuery,
  useValidateContentVersionQuery,
  useLazyValidateContentVersionQuery,
  useSubmitContentVersionForReviewMutation,
  useDecideContentReviewMutation,
  useListContentReviewsQuery,
  usePublishContentVersionMutation,
  useArchiveContentVersionMutation,
  useListCourseAuthorsQuery,
  useAssignCourseAuthorMutation,
  useRevokeCourseAuthorMutation,
} = courseContentApi;
