"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCourse,
  fetchCourses,
  upsertCourse,
  type CourseFilter,
  type UpsertCoursePayload,
} from "./api";

export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  list: (filter?: CourseFilter) => [...courseKeys.lists(), filter] as const,
  detail: (id: string) => [...courseKeys.all, "detail", id] as const,
};

export const useCourses = (filter?: CourseFilter) =>
  useQuery({
    queryKey: courseKeys.list(filter),
    queryFn: () => fetchCourses(filter),
  });

export const useCourse = (courseId: string) =>
  useQuery({
    queryKey: courseKeys.detail(courseId),
    queryFn: () => fetchCourse(courseId),
    enabled: Boolean(courseId),
  });

export const useUpsertCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertCoursePayload) => upsertCourse(payload),
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
      queryClient.setQueryData(courseKeys.detail(course.id), course);
    },
  });
};
