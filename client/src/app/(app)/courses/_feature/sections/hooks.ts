"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSections,
  getSection,
  createSection,
  updateSection,
  deleteSection,
} from "./api";

export function useSections(courseId: number) {
  return useQuery({
    queryKey: ["sections", "course", courseId],
    queryFn: () => getSections(courseId),
    enabled: !!courseId,
  });
}

export function useSection(id: number) {
  return useQuery({
    queryKey: ["sections", id],
    queryFn: () => getSection(id),
    enabled: !!id,
  });
}

export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      data,
    }: {
      courseId: number;
      data: {
        title: string;
        description?: string;
        order_index: number;
      };
    }) => createSection(courseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sections", "course", variables.courseId],
      });
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<{
        title: string;
        description: string;
        order_index: number;
      }>;
    }) => updateSection(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sections", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["sections", "course"] });
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
  });
}
