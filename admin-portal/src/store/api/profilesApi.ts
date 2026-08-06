import { baseApi } from "./baseApi";
import type { ApiEnvelope } from "./baseApi";
import type {
  ParentStudentRelationship,
  Profile,
  ProfileStatus,
  ProfileType,
  ProfileVisibility,
  RelationshipStatus,
  RelationshipType,
} from "@/types";

export interface ListProfilesParams {
  profileType?: ProfileType;
  status?: ProfileStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListProfilesResult {
  total: number;
  page: number;
  limit: number;
  profiles: Profile[];
}

// Profile endpoints send camelCase request bodies (api/src/routes/profile.routes.js validators).
export interface CreateProfileBody {
  userId: number;
  profileType: ProfileType;
  fullName: string;
  contactEmail?: string;
  phoneNumber?: string;
  status?: ProfileStatus;
  visibility?: ProfileVisibility;
  dateOfBirth?: string;
  yearsOfExperience?: number;
}

export const profilesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listProfiles: builder.query<ListProfilesResult, ListProfilesParams | void>({
      query: (params) => ({ url: "/profiles", params: params ?? undefined }),
      transformResponse: (res: ApiEnvelope<ListProfilesResult>) => res.metadata,
      providesTags: (result) =>
        result
          ? [
              ...result.profiles.map((p) => ({ type: "Profile" as const, id: p.id })),
              "Profile",
            ]
          : ["Profile"],
    }),

    getProfileById: builder.query<Profile, number>({
      query: (id) => `/profiles/${id}`,
      transformResponse: (res: ApiEnvelope<{ profile: Profile }>) => res.metadata.profile,
      providesTags: (_r, _e, id) => [{ type: "Profile", id }],
    }),

    createProfile: builder.mutation<Profile, CreateProfileBody>({
      query: (body) => ({ url: "/profiles", method: "POST", body }),
      transformResponse: (res: ApiEnvelope<{ profile: Profile }>) => res.metadata.profile,
      invalidatesTags: ["Profile"],
    }),

    updateProfile: builder.mutation<
      Profile,
      { id: number } & Partial<Omit<CreateProfileBody, "userId" | "profileType">>
    >({
      query: ({ id, ...body }) => ({ url: `/profiles/${id}`, method: "PUT", body }),
      transformResponse: (res: ApiEnvelope<{ profile: Profile }>) => res.metadata.profile,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Profile", id }, "Profile"],
    }),

    changeProfileStatus: builder.mutation<
      Profile,
      { id: number; status: ProfileStatus; reason?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/profiles/${id}/status`, method: "PATCH", body }),
      transformResponse: (res: ApiEnvelope<{ profile: Profile }>) => res.metadata.profile,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Profile", id }, "Profile"],
    }),

    linkParentToStudent: builder.mutation<
      ParentStudentRelationship,
      { parentProfileId: number; studentProfileId: number; relationshipType?: RelationshipType }
    >({
      query: (body) => ({ url: "/profiles/relationships/link", method: "POST", body }),
      transformResponse: (res: ApiEnvelope<{ relationship: ParentStudentRelationship }>) =>
        res.metadata.relationship,
      invalidatesTags: ["Relationship", "Profile"],
    }),

    updateRelationshipStatus: builder.mutation<
      ParentStudentRelationship,
      { id: number; status: RelationshipStatus; reason?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/profiles/relationships/${id}/status`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: ApiEnvelope<{ relationship: ParentStudentRelationship }>) =>
        res.metadata.relationship,
      invalidatesTags: ["Relationship"],
    }),

    getLinkedStudents: builder.query<Profile[], number>({
      query: (parentProfileId) => `/profiles/parent/${parentProfileId}/students`,
      transformResponse: (res: ApiEnvelope<{ students: Profile[] }>) => res.metadata.students,
      providesTags: ["Relationship"],
    }),

    getProfileAuditLogs: builder.query<
      { id: number; action: string; created_at: string; details: unknown }[],
      number
    >({
      query: (id) => `/profiles/${id}/audit-logs`,
      transformResponse: (
        res: ApiEnvelope<{ logs: { id: number; action: string; created_at: string; details: unknown }[] }>,
      ) => res.metadata.logs,
    }),
  }),
});

export const {
  useListProfilesQuery,
  useGetProfileByIdQuery,
  useCreateProfileMutation,
  useUpdateProfileMutation,
  useChangeProfileStatusMutation,
  useLinkParentToStudentMutation,
  useUpdateRelationshipStatusMutation,
  useGetLinkedStudentsQuery,
  useGetProfileAuditLogsQuery,
} = profilesApi;
