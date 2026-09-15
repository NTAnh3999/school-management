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
    passingScore: number;
    timeLimitMinutes?: number;
    maxAttempts: number;
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
    questionText: string;
    questionType: string;
    points: number;
    orderIndex: number;
    options?: Array<{
      text: string;
      isCorrect: boolean;
    }>;
  },
) {
  const response = await httpClient.post(
    API_ROUTES.quizzes.addQuestion(quizId),
    data,
  );
  return response.data;
}

export async function startQuizAttempt(quizId: number, enrollmentId: number) {
  const response = await httpClient.post(
    API_ROUTES.quizzes.startAttempt(quizId),
    { enrollmentId },
  );
  return response.data;
}

export async function submitQuizAttempt(
  attemptId: number,
  answers: Array<{
    questionId: number;
    selectedOptionId?: number;
    selectedOptionIds?: number[];
    textAnswer?: string;
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
