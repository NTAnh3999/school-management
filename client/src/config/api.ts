export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

// Base origin of the API server (no /api/v1 suffix) — used to resolve static
// file URLs such as content-asset storage_key ("/uploads/...").
export const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN ?? API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export const API_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 10000);

export const API_ROUTES = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    forgotPassword: "/auth/forgot-password",
  },
  users: {
    me: "/users/me",
    update: "/users/me",
  },
  courses: {
    list: "/courses",
    detail: (id: number) => `/courses/${id}`,
    create: "/courses",
    update: (id: number) => `/courses/${id}`,
    delete: (id: number) => `/courses/${id}`,
    enroll: (id: number) => `/courses/${id}/enroll`,
    myEnrollments: "/courses/my/enrollments",
  },
  modules: {
    listByCourse: (courseId: number) => `/modules/course/${courseId}`,
    listByVersion: (versionId: number) => `/modules/version/${versionId}`,
    detail: (id: number) => `/modules/${id}`,
    create: (courseId: number) => `/modules/course/${courseId}`,
    update: (id: number) => `/modules/${id}`,
    delete: (id: number) => `/modules/${id}`,
  },
  lessons: {
    list: (moduleId: number) => `/lessons/module/${moduleId}`,
    detail: (id: number) => `/lessons/${id}`,
    create: (moduleId: number) => `/lessons/module/${moduleId}`,
    update: (id: number) => `/lessons/${id}`,
    delete: (id: number) => `/lessons/${id}`,
  },
  progress: {
    update: "/progress/update",
    enrollment: (enrollmentId: number) =>
      `/progress/enrollment/${enrollmentId}`,
    course: (courseId: number) => `/progress/course/${courseId}`,
    recomputeEnrollment: (enrollmentId: number) =>
      `/progress/enrollment/${enrollmentId}/recompute`,
    eventLogs: (enrollmentId: number) =>
      `/progress/enrollment/${enrollmentId}/event-logs`,
  },
  quizzes: {
    get: (id: number) => `/quizzes/${id}`,
    create: (lessonId: number) => `/quizzes/lesson/${lessonId}`,
    addQuestion: (quizId: number) => `/quizzes/${quizId}/questions`,
    startAttempt: (quizId: number) => `/quizzes/${quizId}/attempts`,
    submitAttempt: (attemptId: number) =>
      `/quizzes/attempts/${attemptId}/submit`,
    getAttempts: (quizId: number) => `/quizzes/${quizId}/attempts`,
  },
  reviews: {
    course: (courseId: number) => `/reviews/course/${courseId}`,
    create: (courseId: number) => `/reviews/course/${courseId}`,
    update: (id: number) => `/reviews/${id}`,
    delete: (id: number) => `/reviews/${id}`,
  },
  notifications: {
    list: "/notifications",
    markRead: (id: number) => `/notifications/${id}/read`,
    markAllRead: "/notifications/read-all",
    delete: (id: number) => `/notifications/${id}`,
  },
  rewards: {
    list: "/rewards",
    my: "/rewards/my",
    student: (studentId: number) => `/rewards/student/${studentId}`,
    create: "/rewards",
    award: "/rewards/award",
  },
  learningItems: {
    list: (lessonId: number) => `/learning-items/lesson/${lessonId}`,
    detail: (id: number) => `/learning-items/${id}`,
    create: (lessonId: number) => `/learning-items/lesson/${lessonId}`,
    update: (id: number) => `/learning-items/${id}`,
    archive: (id: number) => `/learning-items/${id}/archive`,
    reorder: (lessonId: number) => `/learning-items/lesson/${lessonId}/reorder`,
  },
  contentAssets: {
    list: "/content-assets",
    detail: (id: number) => `/content-assets/${id}`,
    create: "/content-assets",
    update: (id: number) => `/content-assets/${id}`,
    upload: "/content-assets/upload",
  },
  contentVersions: {
    list: (courseId: number) => `/content/courses/${courseId}/versions`,
    create: (courseId: number) => `/content/courses/${courseId}/versions`,
    detail: (id: number) => `/content/versions/${id}`,
    publish: (id: number) => `/content/versions/${id}/publish`,
    archive: (id: number) => `/content/versions/${id}/archive`,
    publishedStructure: (courseId: number) =>
      `/content/courses/${courseId}/published`,
    previewDraft: (courseId: number) => `/content/courses/${courseId}/preview`,
  },
} as const;
