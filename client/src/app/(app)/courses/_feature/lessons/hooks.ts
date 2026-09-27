"use client";

import { useQuery } from "@tanstack/react-query";
import { getLessons, getLesson } from "./api";

export function useLessons(moduleId: number) {
  return useQuery({
    queryKey: ["lessons", "module", moduleId],
    queryFn: () => getLessons(moduleId),
    enabled: !!moduleId,
  });
}

export function useLesson(id: number) {
  return useQuery({
    queryKey: ["lessons", id],
    queryFn: () => getLesson(id),
    enabled: !!id,
  });
}
