"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateProgress,
  getEnrollmentProgress,
  getCourseProgress,
} from "./api";

export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      enrollment_id: number;
      lesson_id: number;
      status: string;
      time_spent_minutes?: number;
    }) => updateProgress(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["progress", "enrollment", variables.enrollment_id],
      });
      queryClient.invalidateQueries({ queryKey: ["progress", "course"] });
    },
  });
}

export function useEnrollmentProgress(enrollmentId: number) {
  return useQuery({
    queryKey: ["progress", "enrollment", enrollmentId],
    queryFn: () => getEnrollmentProgress(enrollmentId),
    enabled: !!enrollmentId,
  });
}

export function useCourseProgress(courseId: number) {
  return useQuery({
    queryKey: ["progress", "course", courseId],
    queryFn: () => getCourseProgress(courseId),
    enabled: !!courseId,
  });
}
