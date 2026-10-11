"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AssessmentAnswerPayload } from "@/types/models";
import {
  getAssessment,
  getAssessmentAttempts,
  getAssessmentResults,
  getAssessments,
  startAssessmentAttempt,
  submitAssessmentAttempt,
} from "./api";

export function useAssessments() {
  return useQuery({ queryKey: ["assessments"], queryFn: getAssessments });
}

export function useAssessment(id: number) {
  return useQuery({
    queryKey: ["assessments", id],
    queryFn: () => getAssessment(id),
    enabled: !!id,
    retry: false,
  });
}

export function useAssessmentAttempts(id: number, enrollmentId?: number) {
  return useQuery({
    queryKey: ["assessments", id, "attempts", enrollmentId],
    queryFn: () => getAssessmentAttempts(id, enrollmentId!),
    enabled: !!id && !!enrollmentId,
  });
}

// One attempts query per assessment, for list/status views.
export function useAttemptsForAssessments(
  items: Array<{ assessmentId: number; enrollmentId?: number }>,
) {
  return useQueries({
    queries: items.map(({ assessmentId, enrollmentId }) => ({
      queryKey: ["assessments", assessmentId, "attempts", enrollmentId],
      queryFn: () => getAssessmentAttempts(assessmentId, enrollmentId!),
      enabled: !!enrollmentId,
    })),
  });
}

export function useAssessmentResults(id: number, enabled = true) {
  return useQuery({
    queryKey: ["assessments", id, "results"],
    queryFn: () => getAssessmentResults(id),
    enabled: !!id && enabled,
    // 403 RESULT_NOT_PUBLISHED is an expected state, not a transient error.
    retry: false,
  });
}

export function useStartAssessmentAttempt(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: number) => startAssessmentAttempt(id, enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments", id, "attempts"] });
    },
  });
}

export function useSubmitAssessmentAttempt(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      attemptId,
      answers,
    }: {
      attemptId: number;
      answers: AssessmentAnswerPayload[];
    }) => submitAssessmentAttempt(attemptId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments", id] });
    },
  });
}
