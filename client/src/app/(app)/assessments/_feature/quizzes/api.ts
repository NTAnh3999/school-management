import { httpClient } from "@/lib/http-client";
import { API_ROUTES } from "@/config/api";

export async function getQuiz(id: number) {
  const response = await httpClient.get(API_ROUTES.quizzes.get(id));
  return response.data;
}

export async function createQuiz(
  lessonId: number,
  data: {
    title: string;
    description?: string;
    passing_score: number;
    time_limit_minutes?: number;
    max_attempts: number;
  },
) {
  const response = await httpClient.post(
    API_ROUTES.quizzes.create(lessonId),
    data,
  );
  return response.data;
}

export async function addQuizQuestion(
  quizId: number,
  data: {
    question_text: string;
    question_type: string;
    points: number;
    order_index: number;
    options?: Array<{
      option_text: string;
      is_correct: boolean;
    }>;
  },
) {
  const response = await httpClient.post(
    API_ROUTES.quizzes.addQuestion(quizId),
    data,
  );
  return response.data;
}

export async function startQuizAttempt(quizId: number) {
  const response = await httpClient.post(
    API_ROUTES.quizzes.startAttempt(quizId),
  );
  return response.data;
}

export async function submitQuizAttempt(
  attemptId: number,
  answers: Array<{
    question_id: number;
    selected_option_id?: number;
    text_answer?: string;
  }>,
) {
  const response = await httpClient.post(
    API_ROUTES.quizzes.submitAttempt(attemptId),
    { answers },
  );
  return response.data;
}

export async function getQuizAttempts(quizId: number) {
  const response = await httpClient.get(API_ROUTES.quizzes.getAttempts(quizId));
  return response.data;
}
