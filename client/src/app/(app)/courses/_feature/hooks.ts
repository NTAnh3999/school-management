"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCourses, getCourse, enrollCourse, getMyEnrollments } from "./api";

export function useCourses(params?: {
  keyword?: string;
  status?: string;
  departmentId?: number;
  courseType?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery({
    queryKey: ["courses", params],
    queryFn: () => getCourses(params),
  });
}

export function useCourse(id: number) {
  return useQuery({
    queryKey: ["courses", id],
    queryFn: () => getCourse(id),
    enabled: !!id,
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enrollCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: ["enrollments", "my"],
    queryFn: getMyEnrollments,
  });
}
