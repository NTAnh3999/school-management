import { httpClient } from "@/lib/http-client";
import { API_ROUTES } from "@/config/api";

export async function getRewards() {
  const response = await httpClient.get(API_ROUTES.rewards.list);
  return response.data;
}

export async function getMyRewards() {
  const response = await httpClient.get(API_ROUTES.rewards.my);
  return response.data;
}

export async function getStudentRewards(studentId: number) {
  const response = await httpClient.get(API_ROUTES.rewards.student(studentId));
  return response.data;
}

export async function createReward(data: {
  title: string;
  description?: string;
  reward_type: string;
  points_value: number;
  icon_url?: string;
}) {
  const response = await httpClient.post(API_ROUTES.rewards.create, data);
  return response.data;
}

export async function awardReward(data: {
  student_id: number;
  reward_id: number;
  enrollment_id?: number;
}) {
  const response = await httpClient.post(API_ROUTES.rewards.award, data);
  return response.data;
}
