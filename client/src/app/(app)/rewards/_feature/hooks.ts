"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyRewards } from "./api";

export function useMyRewards() {
  return useQuery({
    queryKey: ["rewards", "my"],
    queryFn: getMyRewards,
  });
}
