"use client";

import { useQuery } from "@tanstack/react-query";
import { getLearningItems, getLearningItem } from "./api";

export function useLearningItems(lessonId: number) {
  return useQuery({
    queryKey: ["learning-items", "lesson", lessonId],
    queryFn: () => getLearningItems(lessonId),
    enabled: !!lessonId,
  });
}

export function useLearningItem(id: number) {
  return useQuery({
    queryKey: ["learning-items", id],
    queryFn: () => getLearningItem(id),
    enabled: !!id,
  });
}
