"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchProfile, login, type LoginPayload } from "./api";
import { useSessionStore } from "@/stores/session-store";

export const useLogin = () => {
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: ({ token, user }) => {
      setSession({ token, user });
    },
  });
};

export const useProfile = () => {
  const enabled = Boolean(useSessionStore((state) => state.token));
  return useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    enabled,
  });
};
