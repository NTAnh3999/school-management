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
        passing_score: number;
        time_limit_minutes?: number;
        max_attempts: number;
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
        question_text: string;
        question_type: string;
        points: number;
        order_index: number;
        options?: Array<{
          option_text: string;
          is_correct: boolean;
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
    mutationFn: startQuizAttempt,
    onSuccess: (_, quizId) => {
      queryClient.invalidateQueries({ queryKey: ["quiz-attempts", quizId] });
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
        question_id: number;
        selected_option_id?: number;
        text_answer?: string;
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
