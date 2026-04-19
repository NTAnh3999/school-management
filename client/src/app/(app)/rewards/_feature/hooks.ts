"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRewards,
  getMyRewards,
  getStudentRewards,
  createReward,
  awardReward,
} from "./api";

export function useRewards() {
  return useQuery({
    queryKey: ["rewards"],
    queryFn: getRewards,
  });
}

export function useMyRewards() {
  return useQuery({
    queryKey: ["rewards", "my"],
    queryFn: getMyRewards,
  });
}

export function useStudentRewards(studentId: number) {
  return useQuery({
    queryKey: ["rewards", "student", studentId],
    queryFn: () => getStudentRewards(studentId),
    enabled: !!studentId,
  });
}

export function useCreateReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      reward_type: string;
      points_value: number;
      icon_url?: string;
    }) => createReward(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });
}

export function useAwardReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      student_id: number;
      reward_id: number;
      enrollment_id?: number;
    }) => awardReward(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["rewards", "student", variables.student_id],
      });
      queryClient.invalidateQueries({ queryKey: ["rewards", "my"] });
    },
  });
}
