import { baseApi } from "./baseApi";
import type { ApiEnvelope } from "./baseApi";
import type { Branch, Campus, LocationType, OrgLocation } from "@/types";

// Org-structure endpoints send camelCase request bodies (api/src/routes/org-structure.routes.js).
export const orgApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listBranches: builder.query<Branch[], { tenantId?: number } | void>({
      query: (params) => ({ url: "/org/branches", params: params ?? undefined }),
      transformResponse: (res: ApiEnvelope<{ branches: Branch[] }>) => res.metadata.branches,
      providesTags: ["Branch"],
    }),

    createBranch: builder.mutation<
      Branch,
      { tenantId: number; branchCode: string; branchName: string }
    >({
      query: (body) => ({ url: "/org/branches", method: "POST", body }),
      transformResponse: (res: ApiEnvelope<{ branch: Branch }>) => res.metadata.branch,
      invalidatesTags: ["Branch"],
    }),

    listCampuses: builder.query<Campus[], { branchId?: number; tenantId?: number } | void>({
      query: (params) => ({ url: "/org/campuses", params: params ?? undefined }),
      transformResponse: (res: ApiEnvelope<{ campuses: Campus[] }>) => res.metadata.campuses,
      providesTags: ["Campus"],
    }),

    createCampus: builder.mutation<
      Campus,
      { branchId: number; campusCode: string; campusName: string }
    >({
      query: (body) => ({ url: "/org/campuses", method: "POST", body }),
      transformResponse: (res: ApiEnvelope<{ campus: Campus }>) => res.metadata.campus,
      invalidatesTags: ["Campus"],
    }),

    listLocations: builder.query<
      OrgLocation[],
      { campusId?: number; branchId?: number; tenantId?: number } | void
    >({
      query: (params) => ({ url: "/org/locations", params: params ?? undefined }),
      transformResponse: (res: ApiEnvelope<{ locations: OrgLocation[] }>) =>
        res.metadata.locations,
      providesTags: ["Location"],
    }),

    createLocation: builder.mutation<
      OrgLocation,
      {
        campusId: number;
        locationCode: string;
        locationName: string;
        locationType?: LocationType;
        parentLocationId?: number;
        capacity?: number;
      }
    >({
      query: (body) => ({ url: "/org/locations", method: "POST", body }),
      transformResponse: (res: ApiEnvelope<{ location: OrgLocation }>) => res.metadata.location,
      invalidatesTags: ["Location"],
    }),
  }),
});

export const {
  useListBranchesQuery,
  useCreateBranchMutation,
  useListCampusesQuery,
  useCreateCampusMutation,
  useListLocationsQuery,
  useCreateLocationMutation,
} = orgApi;
