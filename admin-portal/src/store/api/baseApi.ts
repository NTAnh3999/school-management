import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../index";

// Every backend response is wrapped as { message, code, metadata } — see
// api/src/utils/success-responses.js. Endpoints pull the piece they need out of `metadata`
// via transformResponse.
export interface ApiEnvelope<T = unknown> {
  message: string;
  code: number;
  metadata: T;
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    // Routes are mounted at /api/v1 on the backend (api/src/app.js); the Vite dev server
    // proxies /api/* straight through to http://localhost:5000.
    baseUrl: "/api/v1",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    "IamUser",
    "Role",
    "Permission",
    "Membership",
    "IamAuditLog",
    "Branch",
    "Campus",
    "Location",
    "Profile",
    "Relationship",
    "Department",
    "Course",
    "Module",
    "ContentVersion",
    "Classroom",
    "ClassroomSession",
    "ClassroomStudent",
    "Enrollment",
    "Assessment",
    "Progress",
    "Notification",
  ],
  endpoints: () => ({}),
});
