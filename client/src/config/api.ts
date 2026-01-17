export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

export const API_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 10000);

export const API_ROUTES = {
  auth: {
    login: "/auth/login",
    me: "/auth/me",
  },
  users: "/users",
  courses: "/courses",
  modules: "/modules",
  activities: "/activities",
  quizzes: "/quizzes",
  assignments: "/assignments",
  enrollments: "/enrollments",
  submissions: "/submissions",
} as const;
