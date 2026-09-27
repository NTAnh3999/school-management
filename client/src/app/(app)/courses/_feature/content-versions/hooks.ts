"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublishedContentStructure } from "./api";

// 404s when the course has no published version yet — that's an expected,
// non-retriable state for a student (not a transient failure).
export function usePublishedContentStructure(courseId: number) {
  return useQuery({
    queryKey: ["content-structure", "published", courseId],
    queryFn: () => getPublishedContentStructure(courseId),
    enabled: !!courseId,
    retry: false,
  });
}
