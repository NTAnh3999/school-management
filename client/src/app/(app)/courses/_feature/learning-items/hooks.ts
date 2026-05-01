"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLearningItems,
  createLearningItem,
  updateLearningItem,
  archiveLearningItem,
  reorderLearningItems,
} from "./api";

export function useLearningItems(lessonId: number) {
  return useQuery({
    queryKey: ["learning-items", "lesson", lessonId],
    queryFn: () => getLearningItems(lessonId),
    enabled: !!lessonId,
  });
}

export function useCreateLearningItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      data,
    }: {
      lessonId: number;
      data: Parameters<typeof createLearningItem>[1];
    }) => createLearningItem(lessonId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["learning-items", "lesson", variables.lessonId],
      });
    },
  });
}

export function useUpdateLearningItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof updateLearningItem>[1];
    }) => updateLearningItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-items"] });
    },
  });
}

export function useArchiveLearningItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveLearningItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-items"] });
    },
  });
}

export function useReorderLearningItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      orderedIds,
    }: {
      lessonId: number;
      orderedIds: number[];
    }) => reorderLearningItems(lessonId, orderedIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["learning-items", "lesson", variables.lessonId],
      });
    },
  });
}
