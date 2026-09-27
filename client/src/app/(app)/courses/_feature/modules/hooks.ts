"use client";

import { useQuery } from "@tanstack/react-query";
import { getModules, getModule } from "./api";

export function useModules(courseId: number) {
  return useQuery({
    queryKey: ["modules", "course", courseId],
    queryFn: () => getModules(courseId),
    enabled: !!courseId,
  });
}

export function useModule(id: number) {
  return useQuery({
    queryKey: ["modules", id],
    queryFn: () => getModule(id),
    enabled: !!id,
  });
}
