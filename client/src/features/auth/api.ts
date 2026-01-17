import { API_ROUTES } from "@/config/api";
import { httpClient } from "@/services/http-client";
import { type User } from "@/types/models";

export type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  token: string;
  user: User;
};

export const login = (body: LoginPayload) =>
  httpClient<LoginResponse, LoginPayload>(API_ROUTES.auth.login, {
    method: "POST",
    body,
  });

export const fetchProfile = () =>
  httpClient<User>(API_ROUTES.auth.me, {
    method: "GET",
    cache: "no-store",
  });
