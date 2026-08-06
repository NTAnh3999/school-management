import { baseApi } from "./baseApi";
import type { ApiEnvelope } from "./baseApi";
import type { AuthResponse, Membership } from "@/types";

// Auth endpoints send camelCase request bodies (api/src/routes/auth.routes.js validators).
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<
      AuthResponse,
      { email: string; password: string; tenantId?: number }
    >({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (res: ApiEnvelope<AuthResponse>) => res.metadata,
    }),

    switchTenant: builder.mutation<AuthResponse, { selectedTenantId: number }>({
      query: (body) => ({ url: "/auth/switch-tenant", method: "POST", body }),
      transformResponse: (res: ApiEnvelope<AuthResponse>) => res.metadata,
    }),

    getTenants: builder.query<
      { active_tenant_id: number | null; tenants: Membership[] },
      void
    >({
      query: () => "/auth/tenants",
      transformResponse: (
        res: ApiEnvelope<{ active_tenant_id: number | null; tenants: Membership[] }>,
      ) => res.metadata,
    }),

    logout: builder.mutation<void, { refreshToken: string | null }>({
      query: (body) => ({ url: "/auth/logout", method: "POST", body }),
    }),

    forgotPassword: builder.mutation<void, { email: string }>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSwitchTenantMutation,
  useGetTenantsQuery,
  useLogoutMutation,
  useForgotPasswordMutation,
} = authApi;
