import { baseApi } from "./baseApi";
import type { ApiEnvelope } from "./baseApi";
import type { Department } from "@/types";

// Department endpoints send camelCase request bodies (api/src/routes/department.routes.js) and
// are always scoped to the caller's active tenant server-side -- there is no tenantId to pass.
export interface ListDepartmentsParams {
  keyword?: string;
  page?: number;
  page_size?: number;
}

export interface ListDepartmentsResult {
  total: number;
  page: number;
  page_size: number;
  departments: Department[];
}

export interface DepartmentBody {
  departmentCode: string;
  departmentName: string;
}

export const departmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listDepartments: builder.query<ListDepartmentsResult, ListDepartmentsParams | void>({
      query: (params) => ({ url: "/departments", params: params ?? undefined }),
      transformResponse: (res: ApiEnvelope<ListDepartmentsResult>) => res.metadata,
      providesTags: (result) =>
        result
          ? [
              ...result.departments.map((d) => ({ type: "Department" as const, id: d.id })),
              "Department",
            ]
          : ["Department"],
    }),

    getDepartmentById: builder.query<Department, number>({
      query: (id) => `/departments/${id}`,
      transformResponse: (res: ApiEnvelope<{ department: Department }>) => res.metadata.department,
      providesTags: (_r, _e, id) => [{ type: "Department", id }],
    }),

    createDepartment: builder.mutation<Department, DepartmentBody>({
      query: (body) => ({ url: "/departments", method: "POST", body }),
      transformResponse: (res: ApiEnvelope<{ department: Department }>) => res.metadata.department,
      invalidatesTags: ["Department"],
    }),

    updateDepartment: builder.mutation<Department, { id: number } & Partial<DepartmentBody>>({
      query: ({ id, ...body }) => ({ url: `/departments/${id}`, method: "PUT", body }),
      transformResponse: (res: ApiEnvelope<{ department: Department }>) => res.metadata.department,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Department", id }, "Department"],
    }),

    deleteDepartment: builder.mutation<void, number>({
      query: (id) => ({ url: `/departments/${id}`, method: "DELETE" }),
      invalidatesTags: ["Department"],
    }),
  }),
});

export const {
  useListDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentsApi;
