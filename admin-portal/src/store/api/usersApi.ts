import { baseApi } from "./baseApi";
import type { ApiEnvelope } from "./baseApi";

// /users/me is the lightweight "current account" endpoint (api/src/controllers/user.controller.js)
// — distinct from the IAM user-management endpoints in iamApi.ts and the business Profile in
// profilesApi.ts. Used for the Account / My Profile screen (ADM-43).
export interface MeUser {
  id: number;
  email: string;
  full_name: string;
  role: string | null;
  created_at?: string;
  updated_at?: string;
}

// user.routes.js validates the update body as camelCase: body("fullName").
export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<MeUser, void>({
      query: () => "/users/me",
      transformResponse: (res: ApiEnvelope<{ user: MeUser }>) => res.metadata.user,
      providesTags: ["IamUser"],
    }),

    updateMe: builder.mutation<MeUser, { fullName: string }>({
      query: (body) => ({ url: "/users/me", method: "PUT", body }),
      transformResponse: (res: ApiEnvelope<{ user: MeUser }>) => res.metadata.user,
      invalidatesTags: ["IamUser"],
    }),
  }),
});

export const { useGetMeQuery, useUpdateMeMutation } = usersApi;
