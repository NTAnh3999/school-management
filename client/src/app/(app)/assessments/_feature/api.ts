import { API_ROUTES } from "@/config/api";
import { httpClient } from "@/lib/http-client";
import type {
  Assessment,
  AssessmentAnswerPayload,
  AssessmentAttempt,
  AssessmentResult,
} from "@/types/models";

// GET /assessments — for students: published assessments of their active
// course/classroom enrollments. Questions come without correct answers.
export async function getAssessments() {
  const response = await httpClient.get<{ assessments: Assessment[] }>(
    API_ROUTES.assessments.list,
  );
  return response.data.assessments;
}

export async function getAssessment(id: number) {
  const response = await httpClient.get<{ assessment: Assessment }>(
    API_ROUTES.assessments.detail(id),
  );
  return response.data.assessment;
}

// POST /assessments/:id/attempts — returns the existing in-progress attempt
// if there is one, otherwise starts a new one (409 when attempts run out).
export async function startAssessmentAttempt(id: number, enrollmentId: number) {
  const response = await httpClient.post<{ attempt: AssessmentAttempt }>(
    API_ROUTES.assessments.startAttempt(id),
    { enrollmentId },
  );
  return response.data.attempt;
}

export async function submitAssessmentAttempt(
  attemptId: number,
  answers: AssessmentAnswerPayload[],
) {
  const response = await httpClient.post<{ attempt: AssessmentAttempt }>(
    API_ROUTES.assessments.submitAttempt(attemptId),
    { answers },
  );
  return response.data;
}

// Attempt history for one enrollment. Includes submission/grade data even
// before results are published — only show scores from getAssessmentResults.
export async function getAssessmentAttempts(id: number, enrollmentId: number) {
  const response = await httpClient.get<{ attempts: AssessmentAttempt[] }>(
    API_ROUTES.assessments.attempts(id),
    { params: { enrollmentId } },
  );
  return response.data.attempts;
}

// 403 RESULT_NOT_PUBLISHED until a teacher (or the publish policy) releases
// the grade.
export async function getAssessmentResults(id: number) {
  const response = await httpClient.get<{ results: AssessmentResult[] }>(
    API_ROUTES.assessments.results(id),
  );
  return response.data.results;
}
