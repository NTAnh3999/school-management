import { API_ROUTES } from "@/config/api";
import { httpClient } from "@/lib/http-client";
import type { UserProfile } from "@/types/models";

// GET /profiles/me — the caller's profile in the active tenant (404 when the
// school hasn't created one).
export async function getMyProfile() {
  const response = await httpClient.get<{ profile: UserProfile }>(API_ROUTES.profiles.me);
  return response.data.profile;
}

// PUT /profiles/:id — owners may change display/contact fields only; the
// school manages full_name, class and codes.
export async function updateMyProfile(
  id: number,
  data: { displayName?: string | null; contactEmail?: string | null; phoneNumber?: string | null },
) {
  const response = await httpClient.put<{ profile: UserProfile }>(API_ROUTES.profiles.update(id), data);
  return response.data.profile;
}
