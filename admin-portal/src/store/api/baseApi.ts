import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../index";
import { logout, setAuthResponse } from "@/features/auth/authSlice";
import type { AuthResponse } from "@/types";

// Every backend response is wrapped as { message, code, metadata } — see
// api/src/utils/success-responses.js. Endpoints pull the piece they need out of `metadata`
// via transformResponse.
export interface ApiEnvelope<T = unknown> {
  message: string;
  code: number;
  metadata: T;
}

const rawBaseQuery = fetchBaseQuery({
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
});

// Endpoints that never warrant an auto-refresh-and-retry: a 401 from /auth/login is a
// wrong-password error, and /auth/refresh, /auth/logout are already part of the auth
// lifecycle themselves.
const AUTH_LIFECYCLE_PATHS = ["/auth/login", "/auth/refresh", "/auth/logout", "/auth/forgot-password"];

const requestUrl = (args: string | FetchArgs): string => (typeof args === "string" ? args : args.url);

// Concurrent requests that all 401 at once must share a single in-flight refresh call —
// otherwise each one would race to rotate the refresh token (the backend invalidates the
// previous one on every successful refresh, see AuthService.refresh) and knock the others out.
let refreshPromise: Promise<boolean> | null = null;

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !AUTH_LIFECYCLE_PATHS.includes(requestUrl(args))) {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const refreshToken = (api.getState() as RootState).auth.refreshToken;
        if (!refreshToken) return false;

        const refreshResult = await rawBaseQuery(
          { url: "/auth/refresh", method: "POST", body: { refreshToken } },
          api,
          extraOptions,
        );
        if (refreshResult.data) {
          const auth = (refreshResult.data as ApiEnvelope<AuthResponse>).metadata;
          api.dispatch(setAuthResponse(auth));
          return true;
        }
        return false;
      })().finally(() => {
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      // Refresh token is invalid/expired too — the session is unrecoverable client-side.
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
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
