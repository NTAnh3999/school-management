"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCourseReviews,
  createReview,
  updateReview,
  deleteReview,
} from "./api";

export function useCourseReviews(courseId: number) {
  return useQuery({
    queryKey: ["reviews", "course", courseId],
    queryFn: () => getCourseReviews(courseId),
    enabled: !!courseId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      data,
    }: {
      courseId: number;
      data: {
        rating: number;
        review_text?: string;
      };
    }) => createReview(courseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", "course", variables.courseId],
      });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        rating: number;
        review_text?: string;
      };
    }) => updateReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}
