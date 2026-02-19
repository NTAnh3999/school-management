import { API_ROUTES } from "@/config/api";
import { httpClient } from "@/lib/http-client";
import { type User } from "@/types/models";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  roleName?: string;
};

type RawUser = {
  id: number;
  email: string;
  full_name?: string;
  fullName?: string;
  role?: string | { name: string };
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  avatar_url?: string;
  avatarUrl?: string;
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: RawUser;
};

const transformUser = (payload: RawUser): User => {
  const roleSource = typeof payload.role === "string" ? payload.role : payload.role?.name;
  const normalizedRole = roleSource?.toLowerCase();
  return {
    id: payload.id,
    email: payload.email,
    fullName: payload.full_name ?? payload.fullName ?? payload.email,
    role: (normalizedRole as User["role"]) ?? "student",
    avatarUrl: payload.avatar_url ?? payload.avatarUrl,
    createdAt: payload.createdAt ?? payload.created_at ?? "",
    updatedAt: payload.updatedAt ?? payload.updated_at ?? "",
  };
};

export async function login(data: LoginPayload) {
  const response = await httpClient.post<AuthResponse>(API_ROUTES.auth.login, data);
  return {
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
    user: transformUser(response.data.user),
  };
}

export async function register(data: RegisterPayload) {
  const response = await httpClient.post<AuthResponse>(API_ROUTES.auth.register, data);
  return {
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
    user: transformUser(response.data.user),
  };
}

export async function getProfile() {
  const response = await httpClient.get<{ user: RawUser }>(API_ROUTES.users.me);
  return transformUser(response.data.user);
}

export async function updateProfile(data: { fullName: string }) {
  const response = await httpClient.put<{ user: RawUser }>(API_ROUTES.users.update, data);
  return transformUser(response.data.user);
}

export async function logout(refreshToken?: string | null) {
  if (!refreshToken) {
    await httpClient.post(API_ROUTES.auth.logout);
    return;
  }
  await httpClient.post(API_ROUTES.auth.logout, { refreshToken });
}
