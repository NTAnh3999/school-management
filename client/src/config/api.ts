export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export const API_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 10000);

export const API_ROUTES = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
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
  sections: {
    list: (courseId: number) => `/sections/course/${courseId}`,
    detail: (id: number) => `/sections/${id}`,
    create: (courseId: number) => `/sections/course/${courseId}`,
    update: (id: number) => `/sections/${id}`,
    delete: (id: number) => `/sections/${id}`,
  },
  lessons: {
    list: (sectionId: number) => `/lessons/section/${sectionId}`,
    detail: (id: number) => `/lessons/${id}`,
    create: (sectionId: number) => `/lessons/section/${sectionId}`,
    update: (id: number) => `/lessons/${id}`,
    delete: (id: number) => `/lessons/${id}`,
  },
  progress: {
    update: "/progress/update",
    enrollment: (enrollmentId: number) =>
      `/progress/enrollment/${enrollmentId}`,
    course: (courseId: number) => `/progress/course/${courseId}`,
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
} as const;
