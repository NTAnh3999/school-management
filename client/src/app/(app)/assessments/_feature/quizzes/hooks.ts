"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getQuiz,
  createQuiz,
  addQuizQuestion,
  startQuizAttempt,
  submitQuizAttempt,
  getQuizAttempts,
} from "./api";

export function useQuiz(id: number) {
  return useQuery({
    queryKey: ["quizzes", id],
    queryFn: () => getQuiz(id),
    enabled: !!id,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      lessonId,
      data,
    }: {
      lessonId: number;
      data: {
        title: string;
        description?: string;
        passingScore: number;
        timeLimitMinutes?: number;
        maxAttempts: number;
      };
    }) => createQuiz(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function useAddQuizQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      quizId,
      data,
    }: {
      quizId: number;
      data: {
        questionText: string;
        questionType: string;
        points: number;
        orderIndex: number;
        options?: Array<{
          text: string;
          isCorrect: boolean;
        }>;
      };
    }) => addQuizQuestion(quizId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["quizzes", variables.quizId],
      });
    },
  });
}

export function useStartQuizAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      quizId,
      enrollmentId,
    }: {
      quizId: number;
      enrollmentId: number;
    }) => startQuizAttempt(quizId, enrollmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quiz-attempts", variables.quizId] });
    },
  });
}

export function useSubmitQuizAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attemptId,
      answers,
    }: {
      attemptId: number;
      answers: Array<{
        questionId: number;
        selectedOptionId?: number;
        selectedOptionIds?: number[];
        textAnswer?: string;
      }>;
    }) => submitQuizAttempt(attemptId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

export function useQuizAttempts(quizId: number) {
  return useQuery({
    queryKey: ["quiz-attempts", quizId],
    queryFn: () => getQuizAttempts(quizId),
    enabled: !!quizId,
  });
}
