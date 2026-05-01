"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getContentVersions,
  getContentVersion,
  createContentVersion,
  publishContentVersion,
  archiveContentVersion,
  getPublishedContentStructure,
  previewDraftContent,
} from "./api";

export function useContentVersions(courseId: number) {
  return useQuery({
    queryKey: ["content-versions", "course", courseId],
    queryFn: () => getContentVersions(courseId),
    enabled: !!courseId,
  });
}

export function useContentVersion(id: number) {
  return useQuery({
    queryKey: ["content-versions", id],
    queryFn: () => getContentVersion(id),
    enabled: !!id,
  });
}

export function usePublishedContentStructure(courseId: number) {
  return useQuery({
    queryKey: ["content-structure", "published", courseId],
    queryFn: () => getPublishedContentStructure(courseId),
    enabled: !!courseId,
  });
}

export function usePreviewDraftContent(courseId: number) {
  return useQuery({
    queryKey: ["content-structure", "preview", courseId],
    queryFn: () => previewDraftContent(courseId),
    enabled: !!courseId,
  });
}

export function useCreateContentVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      data,
    }: {
      courseId: number;
      data: { versionLabel: string; changelog?: string };
    }) => createContentVersion(courseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["content-versions", "course", variables.courseId],
      });
    },
  });
}

export function usePublishContentVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publishContentVersion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-versions"] });
      queryClient.invalidateQueries({ queryKey: ["content-structure"] });
    },
  });
}

export function useArchiveContentVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveContentVersion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-versions"] });
    },
  });
}
