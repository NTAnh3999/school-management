import { baseApi } from "./baseApi";
import type { ApiEnvelope } from "./baseApi";
import type { IamAuditLog, IamUser, Membership, Permission, Role, ScopeType } from "@/types";

// IAM endpoints send camelCase request bodies (api/src/routes/iam.routes.js validators),
// even though every response comes back snake_cased.
export interface CreateUserBody {
  email: string;
  password: string;
  fullName: string;
  tenantId?: number;
  scopeType?: ScopeType;
  branchId?: number;
  campusId?: number;
  locationId?: number;
  roleId?: number;
  roleName?: string;
  username?: string;
  phone?: string;
  status?: string;
}

export interface UpdateUserBody {
  id: number;
  email?: string;
  fullName?: string;
  password?: string;
  username?: string;
  phone?: string;
  status?: string;
  tenantId?: number;
  roleId?: number;
  roleName?: string;
}

export interface CreateMembershipBody {
  userId: number;
  tenantId: number;
  scopeType?: ScopeType;
  branchId?: number;
  campusId?: number;
  locationId?: number;
  status?: string;
  expiresAt?: string;
  roleId?: number;
  roleName?: string;
}

export interface UpdateMembershipBody {
  id: number;
  scopeType?: ScopeType;
  branchId?: number | null;
  campusId?: number | null;
  locationId?: number | null;
  status?: string;
  expiresAt?: string | null;
}

export const iamApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listUsers: builder.query<IamUser[], void>({
      query: () => "/iam/users",
      transformResponse: (res: ApiEnvelope<{ users: IamUser[] }>) => res.metadata.users,
      providesTags: (result) =>
        result
          ? [...result.map((u) => ({ type: "IamUser" as const, id: u.id })), "IamUser"]
          : ["IamUser"],
    }),

    createUser: builder.mutation<IamUser, CreateUserBody>({
      query: (body) => ({ url: "/iam/users", method: "POST", body }),
      transformResponse: (res: ApiEnvelope<{ user: IamUser }>) => res.metadata.user,
      invalidatesTags: ["IamUser"],
    }),

    updateUser: builder.mutation<IamUser, UpdateUserBody>({
      query: ({ id, ...body }) => ({ url: `/iam/users/${id}`, method: "PATCH", body }),
      transformResponse: (res: ApiEnvelope<{ user: IamUser }>) => res.metadata.user,
      invalidatesTags: (_r, _e, { id }) => [{ type: "IamUser", id }, "IamUser"],
    }),

    listRoles: builder.query<Role[], void>({
      query: () => "/iam/roles",
      transformResponse: (res: ApiEnvelope<{ roles: Role[] }>) => res.metadata.roles,
      providesTags: ["Role"],
    }),

    listPermissions: builder.query<Permission[], void>({
      query: () => "/iam/permissions",
      transformResponse: (res: ApiEnvelope<{ permissions: Permission[] }>) =>
        res.metadata.permissions,
      providesTags: ["Permission"],
    }),

    createMembership: builder.mutation<Membership, CreateMembershipBody>({
      query: (body) => ({ url: "/iam/memberships", method: "POST", body }),
      transformResponse: (res: ApiEnvelope<{ membership: Membership }>) =>
        res.metadata.membership,
      invalidatesTags: ["IamUser", "Membership"],
    }),

    updateMembership: builder.mutation<Membership, UpdateMembershipBody>({
      query: ({ id, ...body }) => ({ url: `/iam/memberships/${id}`, method: "PATCH", body }),
      transformResponse: (res: ApiEnvelope<{ membership: Membership }>) =>
        res.metadata.membership,
      invalidatesTags: ["IamUser", "Membership"],
    }),

    revokeMembership: builder.mutation<Membership, number>({
      query: (id) => ({ url: `/iam/memberships/${id}`, method: "DELETE" }),
      transformResponse: (res: ApiEnvelope<{ membership: Membership }>) =>
        res.metadata.membership,
      invalidatesTags: ["IamUser", "Membership"],
    }),

    listAuditLogs: builder.query<IamAuditLog[], { actorUserId?: number } | void>({
      query: (params) => ({ url: "/iam/audit-logs", params: params ?? undefined }),
      transformResponse: (res: ApiEnvelope<{ logs: IamAuditLog[] }>) => res.metadata.logs,
      providesTags: ["IamAuditLog"],
    }),
  }),
});

export const {
  useListUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useListRolesQuery,
  useListPermissionsQuery,
  useCreateMembershipMutation,
  useUpdateMembershipMutation,
  useRevokeMembershipMutation,
  useListAuditLogsQuery,
} = iamApi;
