"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile } from "./api";

export function useMyProfile() {
  return useQuery({ queryKey: ["profile", "me"], queryFn: getMyProfile, retry: false });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateMyProfile>[1] }) =>
      updateMyProfile(id, data),
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile", "me"], profile);
    },
  });
}
