"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { getProfile, login, logout, register, type LoginPayload, type RegisterPayload } from "./api";
import { useSessionStore } from "@/stores/session-store";

export const useLogin = () => {
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: ({ accessToken, refreshToken, user }) => {
      setSession({ user, accessToken, refreshToken });
    },
  });
};

export const useRegister = () => {
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
    onSuccess: ({ accessToken, refreshToken, user }) => {
      setSession({ user, accessToken, refreshToken });
    },
  });
};

export const useProfile = () => {
  const enabled = Boolean(useSessionStore((state) => state.accessToken));
  const setUser = useSessionStore((state) => state.setUser);

  return useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled,
    onSuccess: (user) => setUser(user),
  });
};

export const useLogout = () => {
  const refreshToken = useSessionStore((state) => state.refreshToken);
  const clearSession = useSessionStore((state) => state.clearSession);

  return useMutation({
    mutationFn: () => logout(refreshToken),
    onSettled: () => clearSession(),
  });
};
