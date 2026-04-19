"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
} from "./api";

export function useLessons(sectionId: number) {
  return useQuery({
    queryKey: ["lessons", "section", sectionId],
    queryFn: () => getLessons(sectionId),
    enabled: !!sectionId,
  });
}

export function useLesson(id: number) {
  return useQuery({
    queryKey: ["lessons", id],
    queryFn: () => getLesson(id),
    enabled: !!id,
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sectionId,
      data,
    }: {
      sectionId: number;
      data: {
        title: string;
        content?: string;
        lesson_type: string;
        video_url?: string;
        duration_minutes: number;
        order_index: number;
      };
    }) => createLesson(sectionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lessons", "section", variables.sectionId],
      });
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<{
        title: string;
        content: string;
        lesson_type: string;
        video_url: string;
        duration_minutes: number;
        order_index: number;
      }>;
    }) => updateLesson(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["lessons", "section"] });
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}
